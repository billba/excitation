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
  ApplicationMode,
  BaseDocumentModeState,
} from "./Types";
import {
  hasDocumentContext,
  getDocumentId,
  getPageNumber,
  hasCitationContext
} from "./StateUtils";
import { createCitationId, returnTextPolygonsFromDI } from "./Utility";
import { createPerPageRegions, summaryToBounds, rangeToSummary } from "./di";
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
        if (
          import.meta.env.VITE_DOCUMENT_BLOB_STORAGE_GENERATE_SAS_URL == "TRUE"
        ) {
          const diParams = new URLSearchParams();
          diParams.append("url", doc.diUrl);
          const diGenerateSasUrl = `${apiUrl}/blob-sas-url/?${diParams.toString()}`;
          const diSasUrl = await (await fetch(diGenerateSasUrl)).json();

          const blobClient = new BlobClient(diSasUrl);
          const blob = await blobClient.download();
          const blobText = await (await blob.blobBody)?.text();
          const analyzeResult = JSON.parse(blobText!);

          const pdfParams = new URLSearchParams();
          pdfParams.append("url", doc.pdfUrl);
          const pdfGenerateSasUrl = `${apiUrl}/blob-sas-url/?${pdfParams.toString()}`;
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
        createPerPageRegions(doc.di);
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
  if (citations.length == 0) {
    return {
      questionIndex,
      mode: ApplicationMode.Idle,
      largeAnswerPanel: answer === undefined ? undefined : true
    };
  }

  const citationIndex = indexOfNextUnreviewedCitation(citations);

  if (citationIndex == undefined) {
    return {
      largeAnswerPanel: answer === undefined ? undefined : true,
      questionIndex,
      mode: ApplicationMode.Idle
    };
  }

  const citation = citations[citationIndex];
  const citationHighlights = citationHighlightsFor(citation);

  return {
    questionIndex,
    mode: ApplicationMode.ViewingCitation,
    documentId: citation.documentId,
    pageNumber: citationHighlights[0]?.pageNumber ?? 1,
    citationIndex,
    citationHighlights,
    largeAnswerPanel: answer === undefined ? undefined : true
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
            : create<LoadedState>(prevState, (state) => {
              const { metadata, questions, asyncState } = state;
              const { isAsyncing } = asyncHelpers(asyncState);

              function goto(pageNumber?: number, documentId?: number) {
                const newDocId = documentId ?? getDocumentId(state.ux);

                if (newDocId === undefined) {
                  console.error("Cannot go to page without document ID");
                  return;
                }

                const newPageNumber = pageNumber ??
                  getPageNumber(state.ux) ?? firstCitedPage(newDocId) ?? 1;

                if (hasCitationContext(state.ux)) {
                  const pageNumbers = state.ux.citationHighlights.map(({ pageNumber }) => pageNumber);
                  if (pageNumbers.includes(newPageNumber)) {
                    state.ux.pageNumber = newPageNumber;
                    return;
                  }
                }

                state.ux = {
                  mode: ApplicationMode.ViewingDocument,
                  questionIndex: state.ux.questionIndex,
                  documentId: newDocId,
                  pageNumber: newPageNumber,
                  largeAnswerPanel: state.ux.largeAnswerPanel
                };
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
                return questions[state.ux.questionIndex].citations
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
                // If no citation index, go to document view mode
                if (citationIndex == undefined) {
                  // If we already have a document ID, stay in viewing document mode
                  if (hasDocumentContext(state.ux)) {
                    state.ux = {
                      mode: ApplicationMode.ViewingDocument,
                      questionIndex: state.ux.questionIndex,
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber ?? 1,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  } else {
                    // Otherwise go to idle mode
                    state.ux = {
                      mode: ApplicationMode.Idle,
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  }
                  return;
                }

                const citation = questions[state.ux.questionIndex].citations[citationIndex];
                const citationHighlights = citationHighlightsFor(citation);

                // If no highlights, go to document view mode
                if (citationHighlights.length == 0) {
                  if (hasDocumentContext(state.ux)) {
                    state.ux = {
                      mode: ApplicationMode.ViewingDocument,
                      questionIndex: state.ux.questionIndex,
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber ?? 1,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  } else {
                    state.ux = {
                      mode: ApplicationMode.Idle,
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  }
                  return;
                }

                // Go to citation view mode
                state.ux = {
                  mode: ApplicationMode.ViewingCitation,
                  questionIndex: state.ux.questionIndex,
                  documentId: citation.documentId,
                  pageNumber: citationHighlights[0].pageNumber,
                  citationIndex,
                  citationHighlights,
                  largeAnswerPanel: reviewCitations ? undefined : state.ux.largeAnswerPanel
                };
              }

              function selectQuestion(questionIndex: number) {
                // First save the answer panel state
                const largeAnswerPanel = questions[questionIndex].answer === undefined ? undefined : true;

                // Then check if there's an unreviewed citation to select
                const citationIndex = indexOfNextUnreviewedCitation(
                  questions[questionIndex].citations
                );

                if (citationIndex !== undefined) {
                  // We have an unreviewed citation to go to
                  const citation = questions[questionIndex].citations[citationIndex];
                  const citationHighlights = citationHighlightsFor(citation);

                  if (citationHighlights.length > 0) {
                    // Go to citation view mode
                    state.ux = {
                      mode: ApplicationMode.ViewingCitation,
                      questionIndex,
                      documentId: citation.documentId,
                      pageNumber: citationHighlights[0].pageNumber,
                      citationIndex,
                      citationHighlights,
                      largeAnswerPanel
                    };
                    return;
                  }
                }

                // No valid citation to view, go to idle mode
                state.ux = {
                  mode: ApplicationMode.Idle,
                  questionIndex,
                  largeAnswerPanel
                };
              }

              // This function is intentionally kept but marked as unused
              // It could be useful for future functionality that wants to find and select
              // the next unreviewed citation
              function _selectUnreviewedCitation() {
                const documentId = getDocumentId(state.ux);
                const pageNumber = getPageNumber(state.ux);

                const citationIndex = indexOfNextUnreviewedCitation(
                  questions[state.ux.questionIndex].citations,
                  documentId,
                  pageNumber
                );

                if (citationIndex !== undefined) {
                  selectCitation(citationIndex);
                } else {
                  // If we already have document context, stay in viewing document mode
                  if (hasDocumentContext(state.ux)) {
                    state.ux = {
                      mode: ApplicationMode.ViewingDocument,
                      questionIndex: state.ux.questionIndex,
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  } else {
                    // Otherwise go to idle mode
                    state.ux = {
                      mode: ApplicationMode.Idle,
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel
                    };
                  }
                }
              }

              switch (action.type) {
                case "selectCitation": {
                  selectCitation(action.citationIndex, action.reviewCitation);
                  break;
                }

                case "prevQuestion":
                  selectQuestion(state.ux.questionIndex - 1);
                  break;

                case "nextQuestion":
                  selectQuestion(state.ux.questionIndex + 1);
                  break;

                case "gotoQuestion":
                  selectQuestion(action.questionIndex);
                  break;

                case "prevPage":
                  goto((state.ux as BaseDocumentModeState).pageNumber - 1);
                  break;

                case "nextPage":
                  goto((state.ux as BaseDocumentModeState).pageNumber + 1);
                  break;

                case "goto":
                  goto(action.pageNumber, action.documentId);
                  break;

                case "setSelectedText":
                  // Range is only available in SelectingNewCitationMode
                  if (state.ux.mode === ApplicationMode.SelectingNewCitation) {
                    state.ux = {
                      ...state.ux,
                      range: action.range
                    };
                  }
                  break;

                case "setViewerSize": {
                  const { width, height } = action;
                  state.viewer = { width, height };
                  break;
                }

                case "emptyTextLayer": {
                  const { isTextLayerEmpty } = action;
                  state.isTextLayerEmpty = isTextLayerEmpty;
                  break;
                }

                case "addSelection": {
                  console.assert(!isAsyncing);

                  // We can only add a selection when in the SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    console.warn("Can only add selection in SelectingNewCitation mode");
                    return;
                  }

                  console.assert(state.ux.cursorRange !== undefined);
                  console.assert(state.ux.documentId !== undefined);

                  // Use the captured cursorRange (built from mouse events) directly
                  const summary = rangeToSummary(
                    state.ux.cursorRange!,
                    docFromId[state.ux.documentId!].di
                  );
                  if (!summary.excerpt) {
                    console.warn(
                      "No valid excerpt found from user selection"
                    );
                    return;
                  }

                  const citationId = createCitationId(
                    metadata.formId,
                    "client"
                  );

                  // Create the new citation using the summary polygons for bounds.
                  const newCitation: Citation = {
                    documentId: state.ux.documentId!,
                    citationId,
                    bounds: summaryToBounds(summary, true),
                    excerpt: summary.excerpt,
                    review: Review.Unreviewed,
                  };

                  // Insert the new citation.
                  const newCitationIndex = questions[state.ux.questionIndex].citations.push(newCitation) - 1;

                  // Switch to viewing the newly created citation
                  const citationHighlights = citationHighlightsFor(newCitation);

                  // Set the state to ViewingCitation mode with the new citation
                  state.ux = {
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    mode: ApplicationMode.ViewingCitation,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber,
                    citationIndex: newCitationIndex,
                    citationHighlights
                  };

                  setAsync({
                    event: {
                      type: "addCitation",
                      formId: metadata.formId,
                      questionId: questions[state.ux.questionIndex].questionId,
                      documentId: state.ux.documentId!,
                      citationId,
                      excerpt: summary.excerpt,
                      bounds: newCitation.bounds!,
                      review: Review.Unreviewed,
                      creator: "client",
                    },
                    onError: {
                      type: "errorAddSelection",
                      questionIndex: state.ux.questionIndex,
                    },
                  });
                  break;
                }

                case "errorAddSelection": {
                  selectCitation(
                    questions[state.ux.questionIndex].citations.length - 1
                  );
                  break;
                }

                case "reviewCitation": {
                  console.assert(!isAsyncing);
                  const { review, citationIndex } = action;

                  const citation =
                    questions[state.ux.questionIndex].citations[citationIndex];
                  citation.review = review;

                  // Always update the citation view regardless of current mode
                  selectCitation(citationIndex);

                  setAsync({
                    event: {
                      type: "updateReview",
                      citationId: citation.citationId,
                      review,
                      creator: "client",
                    },
                    onError: {
                      type: "errorReviewCitation",
                      questionIndex: state.ux.questionIndex,
                      citationIndex,
                    },
                  });
                  break;
                }

                case "errorReviewCitation":
                  state.ux.questionIndex = action.questionIndex;
                  selectCitation(action.citationIndex);
                  break;

                case "contractAnswerPanel":
                  state.ux.largeAnswerPanel = undefined;
                  break;

                case "expandAnswerPanel":
                  state.ux.largeAnswerPanel = true;
                  break;

                case "startEditExcerpt":
                  console.assert(!isAsyncing);

                  // We can only edit an excerpt when in ViewingCitation mode
                  if (state.ux.mode === ApplicationMode.ViewingCitation) {
                    // Switch to EditingCitation mode, keeping all the same properties
                    state.ux = {
                      ...state.ux,
                      mode: ApplicationMode.EditingCitation
                    };
                  }
                  break;

                case "updateExcerpt": {
                  console.assert(!isAsyncing);

                  // Can only update excerpt in EditingCitation mode
                  if (state.ux.mode !== ApplicationMode.EditingCitation) {
                    console.warn("Can only update excerpt in EditingCitation mode");
                    return;
                  }

                  const { excerpt } = action;
                  const { citationIndex } = state.ux;
                  const citation = questions[state.ux.questionIndex].citations[citationIndex];

                  if (citation.excerpt === excerpt) return;

                  citation.excerpt = excerpt;

                  // Switch back to ViewingCitation mode
                  state.ux = {
                    ...state.ux,
                    mode: ApplicationMode.ViewingCitation
                  };

                  setAsync({
                    event: {
                      type: "updateExcerpt",
                      citationId: citation.citationId,
                      excerpt,
                      creator: "client",
                    },
                    onError: {
                      type: "errorUpdateExcerpt",
                      questionIndex: state.ux.questionIndex,
                      citationIndex,
                    },
                  });
                  break;
                }

                case "errorUpdateExcerpt":
                  state.ux.questionIndex = action.questionIndex;
                  selectCitation(action.citationIndex);
                  break;

                case "cancelEditExcerpt":
                  console.assert(!isAsyncing);

                  // Can only cancel editing in EditingCitation mode
                  if (state.ux.mode === ApplicationMode.EditingCitation) {
                    // Switch back to ViewingCitation mode
                    state.ux = {
                      ...state.ux,
                      mode: ApplicationMode.ViewingCitation
                    };
                  }
                  break;

                case "updateAnswer": {
                  console.assert(!isAsyncing);

                  const { answer } = action;

                  const question = questions[state.ux.questionIndex];

                  if (question.answer === answer) return;

                  question.answer = answer;

                  setAsync({
                    event: {
                      type: "updateAnswer",
                      formId: metadata.formId,
                      questionId: question.questionId,
                      answer,
                      creator: "client",
                    },
                    onError: {
                      type: "errorUpdateAnswer",
                      questionIndex: state.ux.questionIndex,
                    },
                  });
                  break;
                }

                case "errorUpdateAnswer":
                  state.ux.questionIndex = action.questionIndex;
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
                  (asyncState as AsyncErrorState).uxAtError = state.ux;
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

                case "setCursorRange": {
                  // Can only set cursor range in SelectingNewCitation mode
                  if (state.ux.mode === ApplicationMode.SelectingNewCitation) {
                    state.ux = {
                      ...state.ux,
                      cursorRange: action.cursorRange
                    };
                  } else {
                    console.warn("Can only set cursor range in SelectingNewCitation mode");
                  }
                  break;
                }

                case "confirmSelection": {
                  // Can only confirm selection when in SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    console.warn("Can only confirm selection when in SelectingNewCitation mode");
                    return;
                  }

                  // Must have a valid cursor range to confirm selection
                  if (!state.ux.cursorRange) {
                    console.warn("Cannot confirm selection without a cursorRange");
                    return;
                  }

                  // Use the captured cursorRange to create a summary
                  const summary = rangeToSummary(
                    state.ux.cursorRange,
                    docFromId[state.ux.documentId].di
                  );

                  // If no excerpt was found, we can't create a citation
                  if (!summary.excerpt) {
                    console.warn("No valid excerpt found from user selection");
                    return;
                  }

                  // Create citation ID
                  const citationId = createCitationId(
                    metadata.formId,
                    "client"
                  );

                  // Create the new citation
                  const newCitation: Citation = {
                    documentId: state.ux.documentId,
                    citationId,
                    bounds: summaryToBounds(summary, true),
                    excerpt: summary.excerpt,
                    review: Review.Unreviewed,
                  };

                  // Add the citation
                  const newCitationIndex = questions[state.ux.questionIndex].citations.push(newCitation) - 1;

                  // Get citation highlights
                  const citationHighlights = citationHighlightsFor(newCitation);

                  // Create a new state object for ViewingCitation mode
                  state.ux = {
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    mode: ApplicationMode.ViewingCitation,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber,
                    citationIndex: newCitationIndex,
                    citationHighlights
                  };

                  // Send async event to store the citation remotely
                  setAsync({
                    event: {
                      type: "addCitation",
                      formId: metadata.formId,
                      questionId: questions[state.ux.questionIndex].questionId,
                      documentId: state.ux.documentId,
                      citationId,
                      excerpt: summary.excerpt,
                      bounds: newCitation.bounds!,
                      review: Review.Unreviewed,
                      creator: "client",
                    },
                    onError: {
                      type: "errorAddSelection",
                      questionIndex: state.ux.questionIndex,
                    },
                  });
                  break;
                }

                case "cancelSelection": {
                  // Can only cancel selection when in SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    console.warn("Can only cancel selection when in SelectingNewCitation mode");
                    return;
                  }

                  // Return to document viewing mode with a new state object
                  state.ux = {
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    mode: ApplicationMode.ViewingDocument,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber
                  };

                  break;
                }

                // Mode-related actions
                case "enterIdleMode": {
                  return {
                    ...state,
                    ux: {
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      mode: ApplicationMode.Idle
                    }
                  };
                }

                case "enterAnswerMode": {
                  // Create a new UX state with QuestionFocus mode
                  const newUx = {
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    mode: ApplicationMode.Answer,
                  };

                  // Add document context if available
                  if (hasDocumentContext(state.ux)) {
                    Object.assign(newUx, {
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber
                    });
                  }

                  return {
                    ...state,
                    ux: newUx
                  };
                }

                case "enterViewingDocumentMode": {
                  // Get documentId from action or current state using getDocumentId helper
                  const documentId = action.documentId || getDocumentId(state.ux);

                  // Get pageNumber from action, current state using getPageNumber helper, or default to 1
                  const pageNumber = action.pageNumber || getPageNumber(state.ux) || 1;

                  if (!documentId) {
                    console.error("Cannot enter ViewingDocumentMode without a document ID");
                    return state;
                  }

                  return {
                    ...state,
                    ux: {
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      mode: ApplicationMode.ViewingDocument,
                      documentId,
                      pageNumber
                    }
                  };
                }

                case "enterViewingCitationMode": {
                  const { citationIndex } = action;
                  const citation = questions[state.ux.questionIndex].citations[citationIndex];
                  const citationHighlights = citationHighlightsFor(citation);

                  if (citationHighlights.length === 0) {
                    console.error("Cannot enter ViewingCitationMode with empty citation highlights");
                    return state;
                  }

                  return {
                    ...state,
                    ux: {
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      mode: ApplicationMode.ViewingCitation,
                      documentId: citation.documentId,
                      pageNumber: citationHighlights[0].pageNumber,
                      citationIndex,
                      citationHighlights
                    }
                  };
                }

                case "enterEditingCitationMode": {
                  if (state.ux.mode !== ApplicationMode.ViewingCitation) {
                    console.error("Can only enter EditingCitationMode from ViewingCitationMode");
                    return state;
                  }

                  return {
                    ...state,
                    ux: {
                      ...state.ux,
                      mode: ApplicationMode.EditingCitation
                    }
                  };
                }

                case "enterSelectingNewCitationMode": {
                  // Check if we have document context using the helper function
                  if (!hasDocumentContext(state.ux)) {
                    console.error("Cannot enter SelectingNewCitationMode without document context");
                    return state;
                  }

                  // Now TypeScript knows these properties exist after the check
                  return {
                    ...state,
                    ux: {
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      mode: ApplicationMode.SelectingNewCitation,
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber,
                      range: undefined,
                      cursorRange: undefined
                    }
                  };
                }

                case "enterResizingCitationMode": {
                  if (state.ux.mode !== ApplicationMode.ViewingCitation) {
                    console.error("Can only enter ResizingCitationMode from ViewingCitationMode");
                    return state;
                  }

                  // Since we've verified we're in ViewingCitation mode, these properties will exist
                  const { citationIndex, citationHighlights, documentId, pageNumber } = state.ux;
                  const citation = questions[state.ux.questionIndex].citations[citationIndex];

                  return {
                    ...state,
                    ux: {
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      mode: ApplicationMode.ResizingCitation,
                      documentId,
                      pageNumber,
                      citationIndex,
                      citationHighlights,
                      previousBounds: citation.bounds || [],
                      currentBounds: citation.bounds || [],
                      selectedExcerpt: citation.excerpt
                    }
                  };
                }

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
      // debugger
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
