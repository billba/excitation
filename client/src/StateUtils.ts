import {
  ApplicationMode,
  UXState,
  IdleModeState,
  AnswerModeState,
  ViewingDocumentModeState,
  ViewingCitationModeState,
  EditingCitationModeState,
  SelectingNewCitationModeState,
  ResizingCitationModeState,
  LoadedState,
  Citation
} from "./Types";

// Type guard functions to check what mode the UX state is in
export function isIdleMode(ux: UXState): ux is IdleModeState {
  return ux.mode === ApplicationMode.Idle;
}

export function isAnswerMode(ux: UXState): ux is AnswerModeState {
  return ux.mode === ApplicationMode.Answer;
}

export function isViewingDocumentMode(ux: UXState): ux is ViewingDocumentModeState {
  return ux.mode === ApplicationMode.ViewingDocument;
}

export function isViewingCitationMode(ux: UXState): ux is ViewingCitationModeState {
  return ux.mode === ApplicationMode.ViewingCitation;
}

export function isEditingCitationMode(ux: UXState): ux is EditingCitationModeState {
  return ux.mode === ApplicationMode.EditingCitation;
}

export function isSelectingNewCitationMode(ux: UXState): ux is SelectingNewCitationModeState {
  return ux.mode === ApplicationMode.SelectingNewCitation;
}

export function isResizingCitationMode(ux: UXState): ux is ResizingCitationModeState {
  return ux.mode === ApplicationMode.ResizingCitation;
}

// Helper to check if a mode has document context (i.e., documentId and pageNumber)
export function hasDocumentContext(ux: UXState): ux is ViewingDocumentModeState |
  ViewingCitationModeState |
  EditingCitationModeState |
  SelectingNewCitationModeState |
  ResizingCitationModeState |
  AnswerModeState {
  return ux.mode !== ApplicationMode.Idle;
}

// Helper to check if a mode has citation context
export function hasCitationContext(ux: UXState): ux is ViewingCitationModeState |
  EditingCitationModeState |
  ResizingCitationModeState {
  return ux.mode === ApplicationMode.ViewingCitation ||
    ux.mode === ApplicationMode.EditingCitation ||
    ux.mode === ApplicationMode.ResizingCitation;
}

// Helper to safely get documentId, returning undefined if not available
export function getDocumentId(ux: UXState): number | undefined {
  return hasDocumentContext(ux) ? ux.documentId : undefined;
}

// Helper to safely get pageNumber, returning undefined if not available
export function getPageNumber(ux: UXState): number | undefined {
  return hasDocumentContext(ux) ? ux.pageNumber : undefined;
}

/**
 * Helper to get the current citation from the state's UX context
 * Returns the citation object if found or undefined if not in citation mode
 * or the citation with the current id cannot be found
 * @param state The loaded application state
 * @param citationId Optional citation ID to look up, defaults to the currently selected citation ID
 */
export function getCitation(state: LoadedState, citationId?: string): Citation | undefined {
  const { ux, questions } = state;
  
  citationId = citationId ?? (hasCitationContext(ux) ? ux.citationId : undefined);
  
  return questions[ux.questionIndex].citations.find(c => c.citationId === citationId);
}
