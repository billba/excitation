import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { create } from "mutative";
import {
  Citation,
  CitationHighlight,
  UXState,
  Action,
  Review,
  Event,
  State,
  AsyncSuccessState,
  AsyncErrorState,
  Form,
  FormDocument,
} from "./Types";
import { findUserSelection, returnTextPolygonsFromDI } from "./Utility";
import { calculateRange } from "./Range";

const form: Form = await (await fetch("./mocks.json")).json();

console.log(form);

for await (const doc of form.documents) {
  doc.response = await (await fetch(doc.filename + ".json")).json();
}

form.defaultDoc = form.documents[0];

for (const question of form.questions) {
  for (const citation of question.citations) {
    if (!citation.boundingRegions) {
      const doc = form.documents.find(
        ({ documentId }) => documentId === citation.documentId
      );
      citation.doc = doc;
      const { response } = doc!;
      citation.boundingRegions = returnTextPolygonsFromDI(
        citation.excerpt,
        response!
      );
    }
  }
}

// eventually we'll want to send any new bounding regions back to the server

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
  defaultDoc: FormDocument,
  questionIndex: number,
  citations: Citation[],
  citationIndex?: number,
  keepCurrentCitation = false
): UXState {
  if (!keepCurrentCitation) {
    if (citations.length === 0) {
      citationIndex = undefined;
    } else {
      const index = citations.findIndex(
        (citation) => citation.review === Review.Unreviewed
      );
      citationIndex = index == -1 ? undefined : index;
    }
  }

  let pageNumber = 1;
  let doc = defaultDoc;

  if (citationIndex == undefined)
    return {
      questionIndex,
      pageNumber,
      doc,
    };

  const citation = citations[citationIndex];
  const citationHighlights = citationHighlightsFor(citation);

  if (citationHighlights.length) {
    [pageNumber] = citationHighlights
      .map(({ pageNumber }) => pageNumber)
      .sort();
    doc = citation.doc!;
  }

  return {
    questionIndex,
    pageNumber,
    doc: doc,
    selectedCitation: { citationIndex, citationHighlights },
  };
}

console.log(form);

const _stateAtom = atom<State>({
  ...form,
  ux: inferUXState(form.defaultDoc, 0, form.questions[0].citations, 0),
  asyncState: { status: "idle" },
  viewer: { top: 0, left: 0, width: 1024, height: 768 },
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
            const { defaultDoc, questions, ux, asyncState, viewer } = state;
            const { doc, pageNumber, questionIndex, selectedCitation } = ux;

            function goto(gotoPageNumber: number, gotoDoc?: FormDocument) {
              ux.pageNumber = gotoPageNumber;
              ux.range = undefined;

              if (gotoDoc && gotoDoc !== doc) {
                ux.doc = gotoDoc;
                ux.selectedCitation = undefined;
              } else {
                // Deselect the current citation, unless moving to
                // a different page of the same multi-page citation.
                if (
                  !selectedCitation?.citationHighlights.find(
                    ({ pageNumber }) => pageNumber == gotoPageNumber
                  )
                ) {
                  ux.selectedCitation = undefined;
                }
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
              case "selectCitation": {
                const { citationIndex } = action;
                if (citationIndex !== undefined) {
                  state.ux = inferUXState(
                    defaultDoc!,
                    questionIndex,
                    questions[questionIndex].citations,
                    citationIndex,
                    true
                  );
                } else {
                  ux.selectedCitation = undefined;
                }
                break;
              }

              case "prevQuestion":
                state.ux = inferUXState(
                  defaultDoc!,
                  questionIndex - 1,
                  questions[questionIndex - 1].citations
                );
                break;

              case "nextQuestion":
                state.ux = inferUXState(
                  defaultDoc!,
                  questionIndex + 1,
                  questions[questionIndex + 1].citations
                );
                break;

              case "prevPage":
                goto(pageNumber - 1);
                break;

              case "nextPage":
                goto(pageNumber + 1);
                break;

              case "goto":
                goto(action.pageNumber ?? 1, action.doc);
                break;

              case "setSelectedText":
                ux.range = action.range;
                break;

              case "setViewerSize": {
                const { top, left, width, height } = action;
                state.viewer = { top, left, width, height };
                break;
              }

              case "addSelection": {
                console.assert(asyncState.status == "idle");
                const { range } = ux;
                console.assert(range !== undefined);
                const realRange = calculateRange(range);
                console.assert(realRange !== undefined);

                const { excerpt, boundingRegions } = findUserSelection(
                  pageNumber,
                  realRange!,
                  viewer
                  // docs[docIndex].response!
                );
                questions[questionIndex].citations.push({
                  documentId: doc.documentId,
                  doc,
                  citationId: "foobar",
                  boundingRegions,
                  excerpt,
                  review: Review.Approved,
                });

                setAsync({
                  event: {
                    type: "mockEvent",
                    delay: 0,
                    // delay: 3000,
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
                const { citations } = questions[questionIndex];
                state.ux = inferUXState(
                  defaultDoc!,
                  questionIndex,
                  citations,
                  citations.length - 1,
                  true
                );
                break;
              }

              case "toggleReview": {
                console.assert(asyncState.status === "idle");

                const { citations } = questions[questionIndex];
                const targetCitation = citations[action.citationIndex];
                targetCitation.review =
                  targetCitation.review == action.target
                    ? Review.Unreviewed
                    : action.target;

                if (selectedCitation?.citationIndex == action.citationIndex) {
                  // After approving or rejecting the current citation, if there's still a citation that's unreviewed, go to it
                  if (targetCitation.review! != Review.Unreviewed) {
                    state.ux = inferUXState(
                      defaultDoc!,
                      questionIndex,
                      citations,
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

    if (prevState === newState) {
      console.log("no state change");
    } else {
      console.log("new state", newState);
      set(_stateAtom, newState);
    }
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
