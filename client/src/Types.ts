import { Bounds, DocIntResponse, Point } from "./di";

export type PseudoBoolean = undefined | true;

export type Action =
  | {
    type: "loadForm";
  }
  | {
    type: "loadFormError";
    error: string;
  }
  | {
    type: "loadFormSuccess";
    form: Form;
    questionIndex: number;
    docs: FormDocument[];
  }
  | {
    type: "toggleQuestionPanel";
  }
  | {
    type: "contractAnswerPanel";
  }
  | {
    type: "expandAnswerPanel";
  }
  | {
    type: "selectCitation";
    citationIndex?: number;
    reviewCitation?: true;
  }
  | {
    type: "gotoQuestion";
    questionIndex: number;
  }
  | {
    type: "prevQuestion";
  }
  | {
    type: "nextQuestion";
  }
  | {
    type: "prevPage";
  }
  | {
    type: "nextPage";
  }
  | {
    type: "goto";
    documentId?: number;
    pageNumber?: number;
  }
  | {
    type: "setViewerSize";
    width: number;
    height: number;
  }
  | {
    type: "addSelection";
  }
  | {
    type: "errorAddSelection";
    questionIndex: number;
  }
  | {
    type: "reviewCitation";
    citationIndex: number;
    review: Review;
  }
  | {
    type: "errorReviewCitation";
    questionIndex: number;
    citationIndex: number;
  }
  | {
    type: "startEditExcerpt";
  }
  | {
    type: "cancelEditExcerpt";
  }
  | {
    type: "updateExcerpt";
    excerpt: string;
  }
  | {
    type: "errorUpdateExcerpt";
    questionIndex: number;
    citationIndex: number;
  }
  | {
    type: "updateAnswer";
    answer: string;
  }
  | {
    type: "errorUpdateAnswer";
    questionIndex: number;
  }
  | {
    type: "errorUpdateBounds";
    questionIndex: number;
    citationIndex: number;
  }
  | {
    type: "startEditExcerpt";
  }
  | {
    type: "cancelEditExcerpt";
  }
  | {
    type: "updateExcerpt";
    excerpt: string;
  }
  | {
    type: "errorUpdateExcerpt";
    questionIndex: number;
    citationIndex: number;
  }
  | {
    type: "asyncLoading";
  }
  | {
    type: "asyncSuccess";
  }
  | {
    type: "asyncError";
    error: string;
  }
  | {
    type: "asyncRetry";
  }
  | {
    type: "asyncRevert";
  }
  | {
    type: "setSelectionStart";
    start: Point;
  }
  | {
    type: "setSelectionEnd";
    end: Point;
  }
  | {
    type: "endSelectionHover";
  }
  | {
    type: "endSelection";
  }
  | {
    type: "enterIdleMode";
  }
  | {
    type: "enterAnswerMode";
    // Answer mode doesn't require document context
  }
  | {
    type: "enterViewingDocumentMode";
    // If coming from Idle mode, need these parameters
    documentId?: number;
    pageNumber?: number;
  }
  | {
    type: "enterViewingCitationMode";
    citationIndex: number;
    // documentId, pageNumber, and citationHighlights can be derived 
    // from the citationIndex and current state
  }
  | {
    type: "enterEditingCitationMode";
    // No parameters needed - editing can only happen when a citation is already selected
  }
  | {
    type: "enterSelectingNewCitationMode";
  }
  | {
    type: "enterResizingCitationMode";
    // No parameters needed - resizing can only happen when a citation is already selected
  }
  | {
    type: "selectResizeHandle";
    handle: ResizeHandle;
  }
  | {
    type: "updateResizeDrag";
    currentPointerPosition: { x: number, y: number };
  }
  | {
    type: "stopResizeDrag";
  }
  | {
    type: "completeResize";
  }
  | {
    type: "cancelResize";
  }
  | {
    type: "confirmSelection";
  }
  | {
    type: "cancelSelection";
  };

export type AsyncIdleState = {
  status: "idle";
};

export type AsyncPendingState = {
  status: "pending";
  prevState: State;
  event: Event;
  onError: Action;
  uxAtError?: UXState;
};

export type AsyncLoadingState = {
  status: "loading";
  prevState: State;
  event: Event;
  onError: Action;
  uxAtError?: UXState;
};

export type AsyncSuccessState = {
  status: "success";
  uxAtError?: UXState;
};

export type AsyncErrorState = {
  status: "error";
  prevState: State;
  event: Event;
  onError: Action;
  error: string;
  uxAtError: UXState;
};

export type AsyncState =
  | AsyncIdleState
  | AsyncPendingState
  | AsyncLoadingState
  | AsyncErrorState;

export interface CitationHighlight {
  pageNumber: number;
  polygons: number[][];
}

export enum FormStatus {
  None,
  Loading,
  Error,
  Loaded,
}

// Application modes
export enum ApplicationMode {
  Idle,                  // Renamed from Default
  Answer,
  ViewingDocument,
  ViewingCitation,
  EditingCitation,
  SelectingNewCitation,
  ResizingCitation
}

// Enum for citation resize handles
export enum ResizeHandle {
  Start,
  End
}

// Base state properties shared by all modes
export interface BaseUXState {
  questionIndex: number;
  largeAnswerPanel?: true;
}

// Idle mode - no document or page selected
export interface IdleModeState extends BaseUXState {
  mode: ApplicationMode.Idle;
}

// Base state for all modes except Idle - includes document and page
export interface BaseDocumentModeState extends BaseUXState {
  documentId: number;
  pageNumber: number;
}

// Answer mode - focus on answering with document context
export interface AnswerModeState extends BaseDocumentModeState {
  mode: ApplicationMode.Answer;
}

// Document viewing mode - viewing a PDF document
export interface ViewingDocumentModeState extends BaseDocumentModeState {
  mode: ApplicationMode.ViewingDocument;
}

// Base citation state shared by citation-related modes
export interface BaseCitationModeState extends BaseDocumentModeState {
  citationIndex: number;
  citationHighlights: CitationHighlight[];
}

// Viewing an existing citation
export interface ViewingCitationModeState extends BaseCitationModeState {
  mode: ApplicationMode.ViewingCitation;
}

// Editing citation text
export interface EditingCitationModeState extends BaseCitationModeState {
  mode: ApplicationMode.EditingCitation;
}

// Selecting a new citation area - now a dedicated mode for text selection
export interface SelectingNewCitationModeState extends BaseDocumentModeState {
  mode: ApplicationMode.SelectingNewCitation;
  isSelecting: boolean;
  start: Point;
  excerpt?: string;
  bounds?: Bounds[];
  hoverBounds?: Bounds[];
}

// Resizing an existing citation
export interface ResizingCitationModeState extends BaseCitationModeState {
  mode: ApplicationMode.ResizingCitation;
  activeHandle?: ResizeHandle;     // Currently selected handle (optional - none selected initially)
  currentBounds: Bounds[];         // Current bounds as user is dragging
  currentPointerPosition?: { x: number, y: number }; // Current pointer position during drag
  selectedExcerpt: string;         // The currently selected excerpt text
}

// Union type of all possible mode states
export type UXState = 
  | IdleModeState 
  | AnswerModeState
  | ViewingDocumentModeState 
  | ViewingCitationModeState 
  | EditingCitationModeState
  | SelectingNewCitationModeState
  | ResizingCitationModeState;

export enum Review {
  Unreviewed,
  Approved,
  Rejected,
}

export interface FormDocument {
  diUrl: string;
  name?: string;
  pdfUrl: string;
  documentId: number;
  pages: number;
  di: DocIntResponse;
}

export interface Citation {
  excerpt: string;
  documentId: number;
  review: Review;
  citationId: string;
  bounds?: Bounds[];
}

export interface Question {
  questionId: number;
  prefix?: string;
  text: string;
  citations: Citation[];
  answer?: string;
}

export interface ViewerState {
  width: number;
  height: number;
}

export interface FormMetadata {
  templateName: string;
  formName: string;
  formId: number;
}

export interface Form {
  metadata: FormMetadata;
  questions: Question[];
}

export interface LoadForm extends Form {
  documents: FormDocument[];
}

export type LoadedState = {
  formStatus: FormStatus.Loaded;
  ux: UXState;
  asyncState: AsyncState;
  viewer: ViewerState;
  docs: FormDocument[];
} & Form;

export type State =
  | {
    formStatus: FormStatus.None;
  }
  | {
    formStatus: FormStatus.Loading;
  }
  | {
    formStatus: FormStatus.Error;
    error: string;
  }
  | LoadedState;

export type Event =
  | {
    type: "addCitation";
    formId: number;
    questionId: number;
    documentId: number;
    citationId: string;
    excerpt: string;
    bounds: Bounds[];
    review: Review;
    creator: string;
  }
  | {
    type: "updateReview";
    citationId: string;
    review: Review;
    creator: string;
  }
  | {
    type: "updateExcerpt";
    citationId: string;
    excerpt: string;
    creator: string;
  }
  | {
    type: "updateAnswer";
    formId: number;
    questionId: number;
    answer: string;
    creator: string;
  }
  | {
    type: "updateBounds";
    citationId: string;
    bounds: Bounds[];
    creator: string;
  };
