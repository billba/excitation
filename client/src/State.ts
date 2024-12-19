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
  PseudoBoolean,
  UXState,
  Question,
  FormStatus,
  LoadedState,
} from "./Types";
import {
  createCitationId,
  findUserSelection,
  returnTextPolygonsFromDI,
} from "./Utility";
import { calculateRange } from "./Range";
import { BlobClient } from "@azure/storage-blob";

export function togglePseudoBoolean(pb: PseudoBoolean): PseudoBoolean {
  return pb ? undefined : true;
}

export const largeSmall = (large: PseudoBoolean) => (large ? "large" : "small");

const _stateAtom = atom<State>({
  formStatus: FormStatus.None,
});

const docFromIdAtom = atom<{ [id: number]: FormDocument }>((get) => {
  const docFromId: { [id: number]: FormDocument } = {};
  const state = get(_stateAtom) as LoadedState;

  if (state.formStatus == FormStatus.Loaded) {
    for (const doc of state.docs) {
      docFromId[doc.documentId] = doc;
    }
  }

  return docFromId;
});

export function useDocFromId() {
  return useAtomValue(docFromIdAtom);
}

export function useLoadForm(formId: number, questionIndex = 0) {
  const [state, dispatch] = useAppState();
  const { formStatus } = state;
  const docFromId = useDocFromId();

  if (formStatus == FormStatus.Loading) {
    return;
  }

  if (formStatus == FormStatus.Error) {
    return;
  }

  if (formStatus == FormStatus.Loaded && state.metadata.formId == formId) {
    if (state.ux.questionIndex != questionIndex) {
      dispatch({ type: "gotoQuestion", questionIndex });
    }
    return;
  }

  dispatch({ type: "loadForm" });

  const apiUrl = import.meta.env.VITE_API_URL;
  (async () => {
    try {
      const form: LoadForm = await (
        await fetch(`${apiUrl}/form/${formId}`)
      ).json();
      const docs: FormDocument[] = [];

      console.log("raw form", form);
      
      for await (const doc of form.documents) {
        let analyzeResult;
        if (
          import.meta.env.VITE_DOCUMENT_BLOB_STORAGE_GENERATE_SAS_URL == "TRUE"
        ) {
          const diParams = new URLSearchParams();
          diParams.append("url", doc.diUrl);
          const diGenerateSasUrl =
            `${apiUrl}/blob-sas-url/?${diParams.toString()}`;
          const diSasUrl = await (await fetch(diGenerateSasUrl)).json();

          const blobClient = new BlobClient(diSasUrl);
          const blob = await blobClient.download();
          const blobText = await (await blob.blobBody)?.text();
          analyzeResult = JSON.parse(blobText!);

          const pdfParams = new URLSearchParams();
          pdfParams.append("url", doc.pdfUrl);
          const pdfGenerateSasUrl =
            `${apiUrl}/blob-sas-url/?${pdfParams.toString()}`;
            doc.pdfUrl = await (await fetch(pdfGenerateSasUrl)).json();
          doc.di = {
            analyzeResult,
            createdDateTime: "unknown",
            lastUpdatedDateTime: "unknown",
            status: "unknown",
          };
        } else {
          doc.di = await (await fetch(doc.diUrl)).json();
        }
        doc.pages = doc.di.analyzeResult.pages.length;
        docs.push(doc);
        docFromId[doc.documentId] = doc;
      }
      
      console.log("done amending docs", docs);

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

      // if (updatedCitations.length) {
      //   await dispatchEvents(updatedCitations);
      // }

      dispatch({
        type: "loadFormSuccess",
        form,
        questionIndex,
        docs,
      });
    } catch {
      dispatch({
        type: "loadFormError",
        error: "Failed to load form",
      });
    }
  })();
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

const sortUnreviewedCitations = (documentId?: number, pageNumber?: number) =>
  sortBy(([citation]: [Citation, number]) => {
    if (!citation.bounds) return Number.MAX_SAFE_INTEGER;

    const ch = citationHighlightsFor(citation);
    const firstPage = ch.length ? ch[0].pageNumber : 1000;
    const lastPage = ch.length ? ch[ch.length - 1].pageNumber : 1000;

    return documentId === citation.documentId &&
      pageNumber! >= firstPage &&
      pageNumber! <= lastPage
      ? 0
      : citation.documentId * 1000000 + firstPage * 1000 + lastPage;
  });

function indexOfNextUnreviewedCitation(
  citations: Citation[],
  documentId?: number,
  pageNumber?: number
) {
  return citations
    .map<[Citation, number]>((citation, citationIndex) => [
      citation,
      citationIndex,
    ])
    .filter(([{ review }]) => review === Review.Unreviewed)
    .sort(sortUnreviewedCitations(documentId, pageNumber))[0]?.[1];
}

function initialUXState(
  questionIndex: number,
  { citations, answer }: Question
): UXState {
  if (citations.length == 0)
    return {
      questionIndex,
      documentId: undefined,
    };

  const citationIndex = indexOfNextUnreviewedCitation(citations);

  if (citationIndex == undefined)
    return {
      largeAnswerPanel: answer === undefined ? undefined : true,
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

const stateAtom = atom<State, [Action], void>(
  (get) => get(_stateAtom),

  (get, set, action: Action) => {
    const prevState = get(_stateAtom);
    const docFromId = get(docFromIdAtom);

    // let's get some special cases out of the way

    if (action.type != "setSelectedText") {
      console.log("dispatching", action, prevState);
    }

    let newState: State;

    switch (prevState.formStatus) {
      case FormStatus.None:
      case FormStatus.Error:
        console.assert(action.type === "loadForm");
        newState = {
          formStatus: FormStatus.Loading,
        };
        break;
      case FormStatus.Loading:
        switch (action.type) {
          case "loadFormError":
            newState = {
              formStatus: FormStatus.Error,
              error: action.error,
            };
            break;
          case "loadFormSuccess": {
            const { questionIndex, docs, form } = action;

            if (questionIndex >= action.form.questions.length) {
              newState = {
                formStatus: FormStatus.Error,
                error: "Invalid question index",
              };
            } else {
              newState = {
                ...form,
                formStatus: FormStatus.Loaded,
                ux: initialUXState(
                  questionIndex,
                  form.questions[questionIndex]
                ),
                asyncState: { status: "idle" },
                viewer: { width: 1024, height: 768 },
                docs,
              };
            }
            break;
          }
          default:
            console.error("unexpected action", action);
            newState = {
              formStatus: FormStatus.Error,
              error: "unexpected action",
            };
            break;
        }
        break;
      default:
        console.assert(prevState.formStatus === FormStatus.Loaded);

        newState =
          action.type === "asyncRevert"
            ? (prevState.asyncState as AsyncErrorState).prevState
            : create(prevState, (state) => {
                const { metadata, questions, ux, asyncState, viewer } = state;
                const { isAsyncing } = asyncHelpers(asyncState);

                function goto(pageNumber?: number, documentId?: number) {
                  console.assert(ux.documentId !== undefined);
                  ux.range = undefined;
                  ux.pageNumber =
                    pageNumber ?? firstCitedPage(documentId!) ?? 1;

                  if (
                    documentId === undefined ||
                    documentId === ux.documentId
                  ) {
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

                function firstCitedPage(
                  documentId: number
                ): number | undefined {
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

                function selectCitation(
                  citationIndex?: number,
                  reviewCitations?: true
                ) {
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

                  if (reviewCitations) ux.largeAnswerPanel = undefined;
                }

                function selectQuestion(questionIndex: number) {
                  ux.questionIndex = questionIndex;
                  selectUnreviewedCitation();
                  ux.largeAnswerPanel =
                    questions[questionIndex].answer === undefined
                      ? undefined
                      : true;
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
                    selectCitation(action.citationIndex, action.reviewCitation);
                    break;
                  }

                  case "prevQuestion":
                    selectQuestion(ux.questionIndex - 1);
                    break;

                  case "nextQuestion":
                    selectQuestion(ux.questionIndex + 1);
                    break;

                  case "gotoQuestion":
                    selectQuestion(action.questionIndex);
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
                    const { width, height } = action;
                    state.viewer = { width, height };
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
                        review: Review.Unreviewed,
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

                  case "reviewCitation": {
                    console.assert(!isAsyncing);
                    const { review, citationIndex } = action;

                    const citation =
                      questions[ux.questionIndex].citations[citationIndex];
                    citation.review = review;

                    if (ux.selectedCitation?.citationIndex === citationIndex) {
                      // After approving or rejecting the current citation, if there's still a citation that's unreviewed, go to it
                      // if (review! != Review.Unreviewed) {
                      //   selectUnreviewedCitation();
                      // }
                    } else {
                      selectCitation(citationIndex);
                    }

                    setAsync({
                      event: {
                        type: "updateReview",
                        citationId: citation.citationId,
                        review,
                        creator: "client",
                      },
                      onError: {
                        type: "errorReviewCitation",
                        questionIndex: ux.questionIndex,
                        citationIndex,
                      },
                    });
                    break;
                  }

                  case "errorReviewCitation":
                    ux.questionIndex = action.questionIndex;
                    selectCitation(action.citationIndex);
                    break;

                  case "contractAnswerPanel":
                    ux.largeAnswerPanel = undefined;
                    break;

                  case "expandAnswerPanel":
                    ux.largeAnswerPanel = true;
                    break;

                  case "startEditExcerpt":
                    console.assert(!isAsyncing);
                    console.assert(ux.selectedCitation !== undefined);
                    ux.selectedCitation!.editing = true;
                    break;

                  case "updateExcerpt": {
                    console.assert(!isAsyncing);
                    console.assert(ux.selectedCitation !== undefined);
                    console.assert(ux.selectedCitation?.editing !== undefined);
                    ux.selectedCitation!.editing = undefined;

                    const { excerpt } = action;
                    const { citationIndex } = ux.selectedCitation!;

                    const citation =
                      questions[ux.questionIndex].citations[citationIndex];

                    if (citation.excerpt === excerpt) return;

                    citation.excerpt = excerpt;

                    setAsync({
                      event: {
                        type: "updateExcerpt",
                        citationId: citation.citationId,
                        excerpt,
                        creator: "client",
                      },
                      onError: {
                        type: "errorUpdateExcerpt",
                        questionIndex: ux.questionIndex,
                        citationIndex,
                      },
                    });
                    break;
                  }

                  case "errorUpdateExcerpt":
                    ux.questionIndex = action.questionIndex;
                    selectCitation(action.citationIndex);
                    break;

                  case "cancelEditExcerpt":
                    console.assert(!isAsyncing);
                    console.assert(ux.selectedCitation?.editing !== undefined);
                    ux.selectedCitation!.editing = undefined;
                    break;

                  case "updateAnswer": {
                    console.assert(!isAsyncing);

                    const { answer } = action;

                    const question = questions[ux.questionIndex];

                    if (question.answer === answer) return;

                    question.answer = answer;

                    setAsync({
                      event: {
                        type: "updateAnswer",
                        formId: metadata.formId,
                        questionId: ux.questionIndex,
                        answer,
                        creator: "client",
                      },
                      onError: {
                        type: "errorUpdateAnswer",
                        questionIndex: ux.questionIndex,
                      },
                    });
                    break;
                  }

                  case "errorUpdateAnswer":
                    ux.questionIndex = action.questionIndex;
                    break;

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
        break;
    }

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
  const { asyncState } = state as LoadedState;

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
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log("dispatching events", events);
  const response = await fetch(`${apiUrl}/event`, {
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
