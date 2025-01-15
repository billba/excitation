import { SerializedRange } from "./Range";
import { Bounds, DocumentIntelligenceResponse } from "./Utility";

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
      type: "setSelectedText";
      range?: SerializedRange;
    }
  | {
      type: "setViewerSize";
      width: number;
      height: number;
    }
  | {
      type: "emptyTextLayer";
      isTextLayerEmpty: boolean;
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

export interface UXState {
  questionIndex: number;

  largeAnswerPanel?: true;

  documentId?: number;
  pageNumber?: number;
  range?: SerializedRange;
  selectedCitation?: {
    citationIndex: number;
    citationHighlights: CitationHighlight[];
    editing?: true;
  };
}

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
  di: DocumentIntelligenceResponse;
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
  top?: number;
  left?: number;
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
  isTextLayerEmpty?: boolean;
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
