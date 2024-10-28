import { useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { create } from "mutative";
import {
  Citation,
  CitationHighlight,
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

    return {
      ...form,
      ux: initialUXState(0, form.questions[0].citations),
      asyncState: { status: "idle" },
      viewer: { top: 0, left: 0, width: 1024, height: 768 },
    };
  } catch (error) {
    console.error("error loading form", error);
    throw error;
  }
}

// throughout the code we sort using functions that map items into a number
// this helper expands those functions into the sort function that Array.sort expects
export function sortBy<T>(sortFunction: (a: T) => number) {
  return (a: T, b: T) => sortFunction(a) - sortFunction(b);
}

// TODO: also sort by polygons top then left
const sortCitationHighlight = sortBy(
  (a: CitationHighlight) => a.pageNumber * 1000
);

const citationHighlightsFor = (citation?: Citation) => {
  const bounds = citation?.bounds ?? [];

  return [...new Set(bounds.map(({ pageNumber }) => pageNumber))]
    .map<CitationHighlight>((pageNumber) => ({
      pageNumber,
      polygons: bounds
        .filter((bounds) => bounds.pageNumber === pageNumber)
        .map(({ polygon }) => polygon),
    }))
    .sort(sortCitationHighlight);
};

const sortUnreviewedCitations = (documentId?: number, pageNumber?: number) => sortBy(([citation]: [Citation, number]) => {
  if (!citation.bounds) return Number.MAX_SAFE_INTEGER;

  const ch = citationHighlightsFor(citation);
  const firstPage = ch.length ? ch[0].pageNumber : 1000
  const lastPage = ch.length ? ch[ch.length - 1].pageNumber : 1000;

  return documentId === citation.documentId && pageNumber! >= firstPage && pageNumber! <= lastPage ? 0 : citation.documentId * 1000000 + firstPage * 1000 + lastPage;
})

function indexOfNextUnreviewedCitation(citations: Citation[], documentId?: number, pageNumber?: number) {
  return citations
    .map<[Citation, number]>((citation, citationIndex) => [citation, citationIndex])
    .filter(([{ review }]) => review === Review.Unreviewed)
    .sort(sortUnreviewedCitations(documentId, pageNumber))[0]?.[1];
}

function initialUXState(questionIndex: number, citations: Citation[]) {
  if (citations.length == 0)
    return {
      questionIndex,
      documentId: undefined,
    };

  const citationIndex = indexOfNextUnreviewedCitation(citations);

  if (citationIndex == undefined)
    return {
      questionIndex,
      documentId: undefined,
    };

  const citation = citations[citationIndex];
  const citationHighlights = citationHighlightsFor(citation);

  return {
    questionIndex,
    documentId: citation.documentId,
    pageNumber: citationHighlights[0]?.pageNumber ?? 1,
    range: undefined,
    selectedCitation: {
      citationIndex,
      citationHighlights,
    },
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
            const { metadata, questions, ux, asyncState, viewer } = state;
            const { isAsyncing } = asyncHelpers(asyncState);

            function goto(pageNumber?: number, documentId?: number) {
              console.assert(ux.documentId !== undefined);
              ux.range = undefined;
              ux.pageNumber = pageNumber ?? firstCitedPage(documentId!) ?? 1;

              if (documentId === undefined || documentId === ux.documentId) {
                if (
                  ux.selectedCitation?.citationHighlights.find(
                    (ch) => ch.pageNumber === pageNumber
                  )
                )
                  return;
              } else {
                ux.documentId = documentId;
              }

              ux.selectedCitation = undefined;
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
              return questions[ux.questionIndex].citations
                .filter(
                  (citation) =>
                    citation.documentId === documentId && citation.bounds
                )
                .flatMap(({ bounds }) =>
                  bounds!.map(({ pageNumber }) => pageNumber)
                )
                .sort()[0];
            }

            function selectCitation(citationIndex?: number) {
              if (citationIndex == undefined) {
                ux.selectedCitation = undefined;
                return;
              }

              const citation =
                questions[ux.questionIndex].citations[citationIndex];
              const citationHighlights = citationHighlightsFor(citation);

              if (citationHighlights.length == 0) {
                ux.selectedCitation = undefined;
                return;
              }

              ux.documentId = citation.documentId;
              ux.pageNumber = citationHighlights[0].pageNumber;
              ux.selectedCitation = {
                citationIndex,
                citationHighlights,
              };
            }

            function selectQuestion(questionIndex: number) {
              ux.questionIndex = questionIndex;
              selectUnreviewedCitation();
            }

            function selectUnreviewedCitation() {
              const citationIndex = indexOfNextUnreviewedCitation(
                questions[ux.questionIndex].citations,
                ux.documentId,
                ux.pageNumber
              );

              if (citationIndex != undefined) {
                selectCitation(citationIndex);
              } else {
                ux.selectedCitation = undefined;
              }
            }

            switch (action.type) {
              case "selectCitation": {
                selectCitation(action.citationIndex);
                break;
              }

              case "prevQuestion":
                selectQuestion(ux.questionIndex - 1);
                break;

              case "nextQuestion":
                selectQuestion(ux.questionIndex + 1);
                break;

              case "prevPage":
                goto(ux.pageNumber! - 1);
                break;

              case "nextPage":
                goto(ux.pageNumber! + 1);
                break;

              case "goto":
                goto(action.pageNumber, action.documentId);
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
                console.assert(ux.range !== undefined);
                console.assert(ux.documentId !== undefined);
                const realRange = calculateRange(ux.range);
                console.assert(realRange !== undefined);

                const { excerpt, bounds } = findUserSelection(
                  ux.pageNumber!,
                  realRange!,
                  viewer,
                  docFromId[ux.documentId!].di
                );

                selectCitation(
                  questions[ux.questionIndex].citations.push({
                    documentId: ux.documentId!,
                    citationId: createCitationId(metadata.formId, "client"),
                    bounds,
                    excerpt,
                    review: Review.Approved,
                  }) - 1
                );

                setAsync({
                  event: {
                    type: "addCitation",
                    formId: metadata.formId,
                    questionId: ux.questionIndex,
                    documentId: ux.documentId!,
                    citationId: createCitationId(metadata.formId, "client"),
                    excerpt,
                    bounds,
                    review: Review.Approved,
                    creator: "client",
                  },
                  onError: {
                    type: "errorAddSelection",
                    questionIndex: ux.questionIndex,
                  },
                });
                break;
              }

              case "errorAddSelection": {
                selectCitation(
                  questions[ux.questionIndex].citations.length - 1
                );
                break;
              }

              case "toggleReview": {
                console.assert(!isAsyncing);

                const targetCitation =
                  questions[ux.questionIndex].citations[action.citationIndex];
                targetCitation.review =
                  targetCitation.review == action.target
                    ? Review.Unreviewed
                    : action.target;

                if (
                  ux.selectedCitation?.citationIndex == action.citationIndex
                ) {
                  // After approving or rejecting the current citation, if there's still a citation that's unreviewed, go to it
                  if (targetCitation.review! != Review.Unreviewed) {
                    selectUnreviewedCitation();
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
                    questionIndex: ux.questionIndex,
                    citationIndex: action.citationIndex,
                  },
                });
                break;
              }

              case "errorToggleReview": {
                selectCitation(action.citationIndex);
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
