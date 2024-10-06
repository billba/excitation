import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { create } from "mutative";
import {
  Doc,
  Citation,
  CitationHighlight,
  UXState,
  Action,
  Review,
  Event,
  State,
  AsyncSuccessState,
  AsyncErrorState,
} from "./Types";
import { mockCitations, mockDocs, mockQuestions } from "./Mocks";
import { locateCitations, returnTextPolygonsFromDI } from "./Utility";
import { calculateRange, rangeToString } from "./Range";

async function docsWithResponses(docs: Doc[]) {
  return await Promise.all(
    docs.map(async (doc) =>
      create(doc, async (draft) => {
        draft.response = await (await fetch(doc.filename + ".json")).json();
      })
    )
  );
}

export const docs = await docsWithResponses(mockDocs); // not an atom because they never change

const locatedCitations = locateCitations(docs, mockCitations);

const citationHighlightsFor = (citation?: Citation) => {
  const boundingRegions = citation?.boundingRegions ?? [];

  return [
    ...new Set(boundingRegions.map(({ pageNumber }) => pageNumber)),
  ].map<CitationHighlight>((pageNumber) => ({
    pageNumber,
    polygons: boundingRegions
      .filter((boundingRegion) => boundingRegion.pageNumber === pageNumber)
      .map(({ polygon }) => polygon),
  }));
};

// when citationIndex !== undefined && keepCurrentCitation == false, we keep citationIndex if there are no unreviewed citations
// when citationIndex !== undefined && keepCurrentCitation == true, we keep citationIndex no matter what
function inferUXState(
  citations: Citation[][],
  questionIndex: number,
  citationIndex?: number,
  keepCurrentCitation = false
): UXState {
  const questionCitations = citations[questionIndex];

  if (!keepCurrentCitation) {
    if (questionCitations.length === 0) {
      citationIndex = undefined;
    } else {
      const index = questionCitations.findIndex(
        (citation) => citation.review === Review.Unreviewed
      );
      citationIndex = index == -1 ? undefined : index;
    }
  }

  let pageNumber = 1;
  let docIndex = 0;

  if (citationIndex == undefined)
    return {
      questionIndex,
      pageNumber,
      docIndex,
    };

  const citation = questionCitations[citationIndex];
  const citationHighlights = citationHighlightsFor(citation);

  if (citationHighlights.length) {
    [pageNumber] = citationHighlights
      .map(({ pageNumber }) => pageNumber)
      .sort();
    ({ docIndex } = citation);
  }

  return {
    questionIndex,
    pageNumber,
    docIndex,
    selectedCitation: { citationIndex, citationHighlights },
  };
}

const _stateAtom = atom<State>({
  form: {
    title: "Sample Form",
    docs,
    questions: mockQuestions,
  },
  ux: inferUXState(locatedCitations, 0),
  asyncState: { status: "idle" },
  citations: locatedCitations,
});

export const stateAtom = atom<State, [Action], void>(
  (get) => get(_stateAtom),

  (get, set, action: Action) => {
    const prevState = get(_stateAtom);
    console.log("dispatching", action, prevState);

    const newState =
      action.type === "asyncRevert"
        ? (prevState.asyncState as AsyncErrorState).prevState
        : create(prevState, (state) => {
            const { form, citations, ux, asyncState } = state;
            const { docIndex, pageNumber, questionIndex, selectedCitation } =
              ux;
            const { docs } = form;

            function gotoPage(
              gotoPageNumber: number,
              alwaysDeselectCitation = false
            ) {
              ux.pageNumber = gotoPageNumber;
              ux.range = undefined;

              // Deselect the current citation, unless moving to
              // a different page of the same multi-page citation.
              if (
                alwaysDeselectCitation ||
                !selectedCitation?.citationHighlights.find(
                  ({ pageNumber }) => pageNumber == gotoPageNumber
                )
              ) {
                ux.selectedCitation = undefined;
              }
            }

            function setAsync({
              event,
              onError,
            }: {
              event: Event;
              onError: Action;
            }) {
              state.asyncState = {
                status: "pending",
                prevState,
                event,
                onError,
              };
            }

            switch (action.type) {
              case "gotoCitation":
                state.ux = inferUXState(
                  citations,
                  questionIndex,
                  action.citationIndex,
                  true
                );
                break;

              case "prevQuestion":
                state.ux = inferUXState(citations, questionIndex - 1);
                break;

              case "nextQuestion":
                state.ux = inferUXState(citations, questionIndex + 1);
                break;

              case "prevPage":
                gotoPage(pageNumber - 1);
                break;

              case "nextPage":
                gotoPage(pageNumber + 1);
                break;

              case "gotoPage":
                gotoPage(action.pageNumber);
                break;

              case "gotoDoc":
                console.assert(docIndex != action.docIndex);
                ux.docIndex = action.docIndex;
                gotoPage((ux.pageNumber = 1), true);
                break;

              case "setSelectedText":
                ux.range = action.range;
                break;

              case "addSelection": {
                console.assert(asyncState.status == "idle");
                const { range } = ux;
                console.assert(range !== undefined);
                const realRange = calculateRange(range);
                console.assert(realRange !== undefined);
                const excerpt = rangeToString(realRange!);

                citations[questionIndex].push({
                  docIndex,
                  boundingRegions: returnTextPolygonsFromDI(
                    excerpt,
                    docs[docIndex].response!
                  ),
                  excerpt,
                  review: Review.Approved,
                });

                setAsync({
                  event: {
                    type: "mockEvent",
                    delay: 0,
                    // delay: 5000,
                    // error: {
                    //   count: 2,
                    //   description: "dang",
                    // },
                  },
                  onError: {
                    type: "errorAddSelection",
                    questionIndex,
                  },
                });
                break;
              }

              case "errorAddSelection": {
                const { questionIndex } = action;
                state.ux = inferUXState(
                  citations,
                  questionIndex,
                  citations[questionIndex].length - 1,
                  true
                );
                break;
              }

              case "toggleReview": {
                console.assert(asyncState.status === "idle");

                const targetCitation =
                  citations[questionIndex][action.citationIndex];
                targetCitation.review =
                  targetCitation.review == action.target
                    ? Review.Unreviewed
                    : action.target;

                if (selectedCitation?.citationIndex == action.citationIndex) {
                  // After approving or rejecting the current citation, if there's still a citation that's unreviewed, go to it
                  if (targetCitation.review! != Review.Unreviewed) {
                    state.ux = inferUXState(
                      citations,
                      questionIndex,
                      action.citationIndex
                    );
                  }
                } else {
                  state.ux.selectedCitation = {
                    citationIndex: action.citationIndex,
                    citationHighlights: citationHighlightsFor(targetCitation),
                  };
                }
                break;
              }

              case "asyncLoading":
                console.assert(asyncState.status === "pending");
                asyncState.status = "loading";
                break;

              case "asyncSuccess": {
                console.assert(asyncState.status === "loading");
                const { uxAtError } =
                  asyncState as unknown as AsyncSuccessState;
                console.log("async success", uxAtError);
                if (uxAtError) {
                  state.ux = uxAtError;
                }

                state.asyncState = {
                  status: "idle",
                };
                break;
              }

              case "asyncError": {
                console.assert(asyncState.status === "loading");
                const { error } = action;
                asyncState.status = "error";
                (asyncState as AsyncErrorState).error = error;
                (asyncState as AsyncErrorState).uxAtError = ux;
                break;
              }

              case "asyncRetry": {
                console.assert(asyncState.status === "error");
                asyncState.status = "pending";
                break;
              }

              // case "asyncRevert":
              // here we need to assign the entire state to the ux.prevstate
              // we can't do that inside the 'create' function (which is just about
              // making changes *within* the state, so we do it at the top of the function

              default:
                console.log("unhandled action", action);
                break;
            }
          });

    console.log("new state", newState);
    set(_stateAtom, newState);
  }
);

export const useAsyncStateMachine = () => {
  const [state, dispatch] = useAtom(stateAtom);
  const { asyncState } = state;

  useEffect(() => {
    // useEffect can't take an async function directly, so they suggest the following
    (async () => {
      if (asyncState.status == "pending") {
        console.log("async pending", asyncState);
        const { event, onError } = asyncState;
        dispatch({
          type: "asyncLoading",
        });
        try {
          await sendEvent(event);
          dispatch({
            type: "asyncSuccess",
          });
        } catch (error) {
          console.log("caught me an error", error);
          dispatch({ type: "asyncError", error: error as string });
          document.getSelection()?.empty();
          dispatch(onError);
        }
      }
    })();
  }, [asyncState, dispatch]);
};

let errorCount = 0;

export const sendEvent = (event: Event) => {
  switch (event.type) {
    case "mockEvent":
      console.log("mockEvent loading");
      return new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          console.log(errorCount, event.error?.count);
          if (event.error && errorCount++ < event.error.count) {
            console.log("mockEvent error");
            reject(event.error.description);
          } else {
            console.log("mockEvent success");
            errorCount = 0;
            resolve();
          }
        }, event.delay)
      );

    default:
      console.error("unexpected event type", event);
      return new Promise<void>((_, reject) => reject("unexpected event type"));
  }
};
