import { useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { create } from "mutative";
import { getCitation } from "./StateUtils";
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
  ResizeHandle,
  BaseDocumentModeState,
} from "./Types";
import {
  hasDocumentContext,
  getDocumentId,
  getPageNumber,
  hasCitationContext,
} from "./StateUtils";
import { createCitationId, returnTextPolygonsFromDI } from "./Utility";
import { createPerPageRegions, summaryToBounds, rangeToSummary, Bounds } from "./di";
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

function arraysAreEqual(arr1: number[], arr2: number[]) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}

function boundsAreEqual(bounds1?: Bounds[], bounds2?: Bounds[]) {
  if (bounds1 === undefined || bounds2 === undefined) return false;
  if (bounds1.length !== bounds2.length) return false;
  return bounds1.every((b1, index) => arraysAreEqual(b1.polygon, bounds2[index].polygon));
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
  sortBy((citation: Citation) => {
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

function findNextUnreviewedCitation(
  citations: Citation[],
  documentId?: number,
  pageNumber?: number
): Citation | undefined {
  return citations
    .filter(citation => citation.review === Review.Unreviewed)
    .sort(sortUnreviewedCitations(documentId, pageNumber))
  [0];
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

  const citation = findNextUnreviewedCitation(citations);

  if (!citation) {
    return {
      largeAnswerPanel: answer === undefined ? undefined : true,
      questionIndex,
      mode: ApplicationMode.Idle
    };
  }

  const citationHighlights = citationHighlightsFor(citation);

  return {
    questionIndex,
    mode: ApplicationMode.ViewingCitation,
    documentId: citation.documentId,
    pageNumber: citationHighlights[0]?.pageNumber ?? 1,
    citationId: citation.citationId,
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

    if (action.type != "setSelectionEnd") {
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
                const currentDocId = getDocumentId(state.ux);
                const currentPageNumber = getPageNumber(state.ux);
                const newDocId = documentId ?? currentDocId;
                let newPageNumber: number;

                if (newDocId === undefined) {
                  console.error("Cannot go to page without document ID");
                  return;
                }

                if (newDocId === currentDocId) {
                  if (pageNumber === currentPageNumber) {
                    console.warn("Already on the requested page");
                    return;
                  }

                  newPageNumber = pageNumber ?? currentPageNumber!;

                  if (hasCitationContext(state.ux)) {
                    const pageNumbers = state.ux.citationHighlights.map(({ pageNumber }) => pageNumber);
                    if (pageNumbers.includes(newPageNumber)) {
                      state.ux.pageNumber = newPageNumber;
                      return;
                    }
                  }
                } else {
                  newPageNumber = firstCitedPage(newDocId) ?? 1;
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
                citationId?: string,
                reviewCitations?: true
              ) {
                // If no citation ID, go to document view mode
                if (citationId == undefined) {
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

                // Get the citation using the helper function with the specified ID
                const citation = getCitation(state as LoadedState, citationId)!;
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
                  citationId: citation.citationId,
                  citationHighlights,
                  largeAnswerPanel: reviewCitations ? undefined : state.ux.largeAnswerPanel
                };
              }

              function selectQuestion(questionIndex: number) {
                // First save the answer panel state
                const largeAnswerPanel = questions[questionIndex].answer === undefined ? undefined : true;

                // Then check if there's an unreviewed citation to select
                const nextCitation = findNextUnreviewedCitation(
                  questions[questionIndex].citations
                );

                if (nextCitation) {
                  // We have an unreviewed citation to go to
                  const citationHighlights = citationHighlightsFor(nextCitation);

                  if (citationHighlights.length > 0) {
                    // Go to citation view mode
                    state.ux = {
                      mode: ApplicationMode.ViewingCitation,
                      questionIndex,
                      documentId: nextCitation.documentId,
                      pageNumber: citationHighlights[0].pageNumber,
                      citationId: nextCitation.citationId,
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


              switch (action.type) {
                case "selectCitation": {
                  selectCitation(action.citationId, action.reviewCitation);
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

                case "setViewerSize": {
                  const { width, height } = action;
                  state.viewer = { width, height };
                  break;
                }

                case "reviewCitation": {
                  console.assert(!isAsyncing);
                  const { review, citationId } = action;

                  // Get the citation using the helper function with the specified ID
                  const citation = getCitation(state as LoadedState, citationId)!;
                  citation.review = review;

                  // Always update the citation view regardless of current mode
                  selectCitation(citationId);

                  setAsync({
                    event: {
                      type: "updateReview",
                      citationId,
                      review,
                      creator: "client",
                    },
                    onError: {
                      type: "errorReviewCitation",
                      questionIndex: state.ux.questionIndex,
                      citationId,
                    },
                  });
                  break;
                }

                case "errorReviewCitation":
                  state.ux.questionIndex = action.questionIndex;
                  selectCitation(action.citationId);
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

                case "enterResizingCitationMode":
                  console.assert(!isAsyncing);

                  if (state.ux.mode === ApplicationMode.ViewingCitation) {
                    const citation = getCitation(state)!;
                    const currentBounds = citation.bounds || [];

                    state.ux = {
                      ...state.ux,
                      mode: ApplicationMode.ResizingCitation,
                      currentBounds,
                      selectedExcerpt: citation.excerpt,
                    };
                  }
                  break;

                case "selectResizeHandle": {
                  // Can only select resize handle when in ResizingCitation mode
                  if (state.ux.mode !== ApplicationMode.ResizingCitation) {
                    console.warn("Can only select resize handle when in ResizingCitation mode");
                    return;
                  }

                  // Update the state with the selected handle
                  state.ux.activeHandle = action.handle;
                  break;
                }

                case "updateResizeDrag": {
                  // Can only update resize when in ResizingCitation mode
                  if (state.ux.mode !== ApplicationMode.ResizingCitation) {
                    console.warn("Can only update resize when in ResizingCitation mode");
                    return;
                  }

                  // Store the current pointer position
                  state.ux.currentPointerPosition = action.currentPointerPosition;

                  // Only calculate new bounds if we have an active handle
                  const { activeHandle, currentBounds, documentId, pageNumber } = state.ux;

                  if (activeHandle !== undefined && currentBounds.length > 0) {
                    const currentPoint = action.currentPointerPosition;

                    // Get the document intelligence data
                    const docIntelligence = docFromId[documentId]?.di;
                    if (!docIntelligence) return;

                    // Get the anchor point (the opposite end of what we're dragging)
                    let start, end;

                    if (activeHandle === ResizeHandle.Start) {
                      // We're dragging the start point, so the current position is the start
                      // and we need to extract the end point from the current bounds
                      start = { page: pageNumber, point: currentPoint };

                      // Find the bound for the current page
                      const pageBound = currentBounds.find(bound => bound.pageNumber === pageNumber);
                      if (!pageBound) return;

                      // Extract end point from the bottom-right corner (indices 2,3)
                      end = {
                        page: pageNumber,
                        point: {
                          x: pageBound.polygon[2],
                          y: pageBound.polygon[3]
                        }
                      };
                    } else {
                      // We're dragging the end point, so the current position is the end
                      end = { page: pageNumber, point: currentPoint };

                      // Find the bound for the current page
                      const pageBound = currentBounds.find(bound => bound.pageNumber === pageNumber);
                      if (!pageBound) return;

                      // Extract start point from the top-left corner (indices 0,1)
                      start = {
                        page: pageNumber,
                        point: {
                          x: pageBound.polygon[0],
                          y: pageBound.polygon[1]
                        }
                      };
                    }

                    // Calculate new bounds using the same approach as for new citations
                    const summary = rangeToSummary({ start, end }, docIntelligence);
                    const newBounds = summaryToBounds(summary, true);

                    // Update the bounds and excerpt in the state
                    if (newBounds && newBounds.length > 0) {
                      state.ux.currentBounds = newBounds;
                      state.ux.selectedExcerpt = summary.excerpt;
                    }
                  }
                  break;
                }

                case "stopResizeDrag": {
                  // Can only stop resize drag when in ResizingCitation mode
                  if (state.ux.mode !== ApplicationMode.ResizingCitation) {
                    console.warn("Can only stop resize drag when in ResizingCitation mode");
                    return;
                  }

                  // Remove the selected handle but keep the current bounds
                  state.ux.activeHandle = undefined;
                  break;
                }

                case "completeResize": {
                  // Can only complete resize when in ResizingCitation mode
                  if (state.ux.mode !== ApplicationMode.ResizingCitation) {
                    console.warn("Can only complete resize when in ResizingCitation mode");
                    return;
                  }

                  console.assert(!isAsyncing);
                  const { currentBounds, selectedExcerpt } = state.ux;

                  const citation = getCitation(state as LoadedState)!;

                  // Update both the bounds and excerpt from the resize state
                  citation.bounds = currentBounds;
                  citation.excerpt = selectedExcerpt;

                  // Get updated citation highlights
                  const citationHighlights = citationHighlightsFor(citation);

                  // Return to ViewingCitation mode
                  state.ux = {
                    mode: ApplicationMode.ViewingCitation,
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber,
                    citationId: citation.citationId,
                    citationHighlights
                  };

                  // Send async event to update citation bounds and excerpt remotely
                  setAsync({
                    event: {
                      type: "updateBounds",
                      citationId: citation.citationId,
                      bounds: citation.bounds,
                      creator: "client",
                    },
                    onError: {
                      type: "errorUpdateBounds",
                      questionIndex: state.ux.questionIndex,
                      citationId: citation.citationId,
                    },
                  });
                  break;
                }

                case "cancelResize": {
                  // Can only cancel resize when in ResizingCitation mode
                  if (state.ux.mode !== ApplicationMode.ResizingCitation) {
                    console.warn("Can only cancel resize when in ResizingCitation mode");
                    return;
                  }

                  // We simply discard the currentBounds and transition back to viewing mode
                  // No need to modify the original citation since we never changed it

                  const citation = getCitation(state as LoadedState)!;

                  // Get citation highlights from the unchanged citation
                  const citationHighlights = citationHighlightsFor(citation);

                  // Return to ViewingCitation mode
                  state.ux = {
                    mode: ApplicationMode.ViewingCitation,
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber,
                    citationId: citation.citationId,
                    citationHighlights
                  };
                  break;
                }

                case "errorUpdateBounds": {
                  state.ux.questionIndex = action.questionIndex;
                  selectCitation(action.citationId);
                  break;
                }

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

                case "setSelectionStart": {
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    return;
                  }

                  state.ux.start = action.start;
                  const point = action.start;
                  const page = state.ux.pageNumber;

                  const summary = rangeToSummary(
                    { start: { page, point }, end: { page, point } },
                    docFromId[state.ux.documentId].di
                  );

                  state.ux.excerpt = summary.excerpt;
                  state.ux.bounds = summaryToBounds(summary, true);
                  state.ux.isSelecting = true;
                  state.ux.hoverBounds = undefined;
                  break;
                }

                case "setSelectionEnd": {
                  // Can only set cursor range in SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    return;
                  }

                  const start = state.ux.isSelecting ? state.ux.start : action.end;
                  const page = state.ux.pageNumber;

                  const summary = rangeToSummary(
                    { start: { page, point: start }, end: { page, point: action.end } },
                    docFromId[state.ux.documentId].di
                  );

                  const bounds = summaryToBounds(summary, true);

                  if (state.ux.isSelecting) {
                    if (!boundsAreEqual(bounds, state.ux.bounds)) {
                      state.ux.bounds = bounds;
                      state.ux.excerpt = summary.excerpt;
                    }
                  } else {
                    if (state.ux.hoverBounds === undefined || !boundsAreEqual(bounds, state.ux.hoverBounds)) {
                      state.ux.hoverBounds = bounds;
                    }
                  }
                  break;
                }

                case "endSelectionHover": {
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    return;
                  }

                  state.ux.hoverBounds = undefined;
                  break;
                }

                case "endSelection": {
                  // Can only end selection in SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    return;
                  }

                  state.ux.isSelecting = false;
                  break;
                }

                case "confirmSelection": {
                  // Can only confirm selection when in SelectingNewCitation mode
                  if (state.ux.mode !== ApplicationMode.SelectingNewCitation) {
                    console.warn("Can only confirm selection when in SelectingNewCitation mode");
                    return;
                  }

                  console.assert(!state.ux.isSelecting);

                  const { bounds, excerpt } = state.ux;
                  // If no excerpt was found, we can't create a citation
                  if (!excerpt || !bounds) {
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
                    bounds,
                    excerpt,
                    review: Review.Approved,
                    userAdded: true,
                  };

                  // Add the citation
                  questions[state.ux.questionIndex].citations.push(newCitation);

                  // Get citation highlights
                  const citationHighlights = citationHighlightsFor(newCitation);

                  // Create a new state object for ViewingCitation mode
                  state.ux = {
                    questionIndex: state.ux.questionIndex,
                    largeAnswerPanel: state.ux.largeAnswerPanel,
                    mode: ApplicationMode.ViewingCitation,
                    documentId: state.ux.documentId,
                    pageNumber: state.ux.pageNumber,
                    citationId: newCitation.citationId,
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
                      excerpt,
                      bounds,
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

                case "deleteCitation": {
                  // Can only delete citation when in ViewingCitation mode
                  if (state.ux.mode !== ApplicationMode.ViewingCitation) {
                    console.warn("Can only delete citation when in ViewingCitation mode");
                    return;
                  }

                  const { documentId, pageNumber } = state.ux;

                  // Get the citation from the current context
                  const citation = getCitation(state as LoadedState)!;

                  // Find the citation's index in the array
                  const citations = questions[state.ux.questionIndex].citations;
                  const citationIndex = citations.findIndex(c => c.citationId === citation.citationId);

                  if (citationIndex === -1) {
                    console.warn(`Cannot delete citation: citation with ID ${citation.citationId} not found`);
                    return;
                  }

                  // Remove the citation from the array
                  citations.splice(citationIndex, 1);

                  // If there are still citations, try to select another one
                  if (citations.length > 0) {
                    // Find the next citation on the same document page if possible
                    const nextCitation = findNextUnreviewedCitation(citations, documentId, pageNumber);
                    if (nextCitation) {
                      // Select the next unreviewed citation
                      selectCitation(nextCitation.citationId);
                      return;
                    }
                  }

                  // If no citation to select, go back to document viewing mode
                  state.ux = {
                    mode: ApplicationMode.ViewingDocument,
                    questionIndex: state.ux.questionIndex,
                    documentId,
                    pageNumber,
                    largeAnswerPanel: state.ux.largeAnswerPanel
                  };

                  // TODO: Implement server-side deletion when API supports it
                  // Currently there's no event type for deleting citations

                  return;
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
                  const { citationId } = action;

                  const citation = getCitation(state as LoadedState, citationId);

                  if (!citation) {
                    console.error(`Cannot enter ViewingCitationMode: citation with ID ${citationId} not found`);
                    return state;
                  }

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
                      citationId,
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
                      mode: ApplicationMode.SelectingNewCitation,
                      questionIndex: state.ux.questionIndex,
                      largeAnswerPanel: state.ux.largeAnswerPanel,
                      documentId: state.ux.documentId,
                      pageNumber: state.ux.pageNumber,
                      isSelecting: false,
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
