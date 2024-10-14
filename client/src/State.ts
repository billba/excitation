import { useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
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
  FormDocument,
  LoadForm,
  AsyncState,
} from "./Types";
import {
  createCitationId,
  findUserSelection,
  returnTextPolygonsFromDI,
} from "./Utility";
import { calculateRange } from "./Range";

export const docs: FormDocument[] = [];
export const docFromId: { [id: number]: FormDocument } = {};

async function loadForm(url: string): Promise<State> {
  try {
    const form: LoadForm = await (await fetch(url)).json();

    console.log("raw form", form);

    for await (const doc of form.documents) {
      doc.di = await (await fetch(doc.diUrl)).json();
      doc.pages = doc.di.analyzeResult.pages.length;
      docs.push(doc);
      docFromId[doc.documentId] = doc;
    }

    const updatedCitations: Event[] = [];

    for (const question of form.questions) {
      for (const citation of question.citations) {
        const { bounds, citationId, documentId } = citation;
        if (!bounds) {
          const bounds = returnTextPolygonsFromDI(
            citation.excerpt,
            docFromId[documentId].di
          );
          if (bounds) {
            citation.bounds = bounds;
            updatedCitations.push({
              type: "updateBounds",
              citationId,
              bounds,
              creator: "client",
            });
          }
        }
      }
    }

    console.log("amended form", form);

    if (updatedCitations.length) {
      await dispatchEvents(updatedCitations);
    }

    const defaultDocumentId = docs[0].documentId;

    return {
      ...form,
      defaultDocumentId,
      ux: inferUXState(defaultDocumentId, 0, form.questions[0].citations, 0),
      asyncState: { status: "idle" },
      viewer: { top: 0, left: 0, width: 1024, height: 768 },
    };
  } catch (error) {
    console.error("error loading form", error);
    throw error;
  }
}

const citationHighlightsFor = (citation?: Citation) => {
  const bounds = citation?.bounds ?? [];

  return [
    ...new Set(bounds.map(({ pageNumber }) => pageNumber)),
  ].map<CitationHighlight>((pageNumber) => ({
    pageNumber,
    polygons: bounds
      .filter((bounds) => bounds.pageNumber === pageNumber)
      .map(({ polygon }) => polygon),
  }));
};

// when citationIndex !== undefined && keepCurrentCitation == false, we keep citationIndex if there are no unreviewed citations
// when citationIndex !== undefined && keepCurrentCitation == true, we keep citationIndex no matter what
function inferUXState(
  defaultDocumentId: number,
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
  let documentId = defaultDocumentId;

  if (citationIndex == undefined)
    return {
      questionIndex,
      pageNumber,
      documentId,
    };

  const citation = citations[citationIndex];
  const citationHighlights = citationHighlightsFor(citation);

  if (citationHighlights.length) {
    [pageNumber] = citationHighlights
      .map(({ pageNumber }) => pageNumber)
      .sort();
    ({ documentId } = citation);
  }

  return {
    questionIndex,
    pageNumber,
    documentId,
    selectedCitation: { citationIndex, citationHighlights },
  };
}

export const asyncHelpers = (asyncState: AsyncState) => {
  const isAsyncing = asyncState.status != "idle";
  const isError = isAsyncing && !!asyncState.uxAtError;
  return { isAsyncing, isError };
};

const formId = window.location.pathname.split("/")[1];
console.log("form id:", formId);
const _stateAtom = atom<State>(
  await loadForm("http://localhost:8000/form/" + formId)
);

const stateAtom = atom<State, [Action], void>(
  (get) => get(_stateAtom),

  (get, set, action: Action) => {
    const prevState = get(_stateAtom);
    if (action.type != "setSelectedText") {
      console.log("dispatching", action, prevState);
    }

    const newState =
      action.type === "asyncRevert"
        ? (prevState.asyncState as AsyncErrorState).prevState
        : create(prevState, (state) => {
            const {
              metadata,
              defaultDocumentId,
              questions,
              ux,
              asyncState,
              viewer,
            } = state;
            const { documentId, pageNumber, questionIndex, selectedCitation } =
              ux;
            const { isAsyncing } = asyncHelpers(asyncState);

            function goto(gotoPageNumber: number, gotoDocumentId?: number) {
              ux.pageNumber = gotoPageNumber;
              ux.range = undefined;

              if (gotoDocumentId != undefined && gotoDocumentId !== documentId) {
                ux.documentId = gotoDocumentId;
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

            function firstCitedPage(documentId: number): number | undefined {
              return questions[questionIndex].citations
                .filter(
                  (citation) =>
                    citation.documentId === documentId && citation.bounds
                )
                .flatMap(({ bounds }) =>
                  bounds!.map(({ pageNumber }) => pageNumber)
                )
                .sort()[0];
            }

            switch (action.type) {
              case "selectCitation": {
                const { citationIndex } = action;
                if (citationIndex !== undefined) {
                  state.ux = inferUXState(
                    defaultDocumentId,
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
                  defaultDocumentId,
                  questionIndex - 1,
                  questions[questionIndex - 1].citations
                );
                break;

              case "nextQuestion":
                state.ux = inferUXState(
                  defaultDocumentId,
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
                goto(
                  action.pageNumber ??
                    firstCitedPage(action.documentId ?? documentId) ??
                    1,
                  action.documentId
                );
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
                console.assert(!isAsyncing);
                const { range } = ux;
                console.assert(range !== undefined);
                const realRange = calculateRange(range);
                console.assert(realRange !== undefined);

                const { excerpt, bounds } = findUserSelection(
                  pageNumber,
                  realRange!,
                  viewer,
                  docFromId[documentId].di
                );

                questions[questionIndex].citations.push({
                  documentId,
                  citationId: createCitationId(metadata.formId, "client"),
                  bounds,
                  excerpt,
                  review: Review.Approved,
                });

                setAsync({
                  event: {
                    type: "addCitation",
                    formId: metadata.formId,
                    questionId: questionIndex,
                    documentId,
                    citationId: createCitationId(metadata.formId, "client"),
                    excerpt,
                    bounds,
                    review: Review.Approved,
                    creator: "client",
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
                  defaultDocumentId,
                  questionIndex,
                  citations,
                  citations.length - 1,
                  true
                );
                break;
              }

              case "toggleReview": {
                console.assert(!isAsyncing);

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
                      defaultDocumentId,
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

                setAsync({
                  event: {
                    type: "updateReview",
                    citationId: targetCitation.citationId,
                    review: targetCitation.review,
                    creator: "client",
                  },
                  onError: {
                    type: "errorToggleReview",
                    questionIndex,
                    citationIndex: action.citationIndex,
                  },
                });
                break;
              }

              case "errorToggleReview": {
                const { questionIndex, citationIndex } = action;
                const { citations } = questions[questionIndex];
                state.ux = inferUXState(
                  defaultDocumentId,
                  questionIndex,
                  citations,
                  citationIndex,
                  true
                );
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

export function useAppState() {
  return useAtom(stateAtom);
}

export function useDispatchAppState() {
  return useSetAtom(stateAtom);
}

export function useAppStateValue() {
  return useAtomValue(stateAtom);
}

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
          await dispatchEvents([event]);
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

async function dispatchEvents(events: Event[]): Promise<string | void> {
  console.log("dispatching events", events);
  const response = await fetch("http://localhost:8000/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(events),
  });
  console.log("events response", response.status, await response.text());
  if (!response.ok) {
    throw new Error(await response.text());
  }
}
