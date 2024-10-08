import { SerializedRange } from "./Range";
import { Bounds, DocumentIntelligenceResponse } from "./Utility";

export type Action =
  | {
      type: "selectCitation";
      citationIndex?: number;
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
      doc?: FormDocument;
      pageNumber?: number;
    }
  | {
      type: "setSelectedText";
      range?: SerializedRange;
    }
  | {
      type: "setViewerSize";
      top: number;
      left: number;
      width: number;
      height: number;
    }
  | {
      type: "addSelection";
    }
  | {
      type: "toggleReview";
      citationIndex: number;
      target: Review;
    }
  | {
      type: "errorAddSelection";
      questionIndex: number;
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

export interface UXState {
  questionIndex: number;
  doc: FormDocument;
  pageNumber: number;
  range?: SerializedRange;
  selectedCitation?: {
    citationIndex: number;
    citationHighlights: CitationHighlight[];
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
  pages: number;
  documentId: number;
  response?: DocumentIntelligenceResponse;
}

export interface Citation {
  excerpt: string;
  documentId: number;
  doc?: FormDocument;
  review: Review;
  citationId: string;
  bounds?: Bounds[];
}

export interface Question {
  prefix?: string;
  text: string;
  citations: Citation[];
}


export interface ViewerState {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FormMetadata {
  templateName: string,
  formName: string;
  formId: number,
}

export interface Form {
  metadata: FormMetadata;
  documents: FormDocument[];
  questions: Question[];
  defaultDoc?: FormDocument;
}

export interface State extends Form {
  ux: UXState;
  asyncState: AsyncState;
  viewer: ViewerState;
}

export type Event =
  | {
      type: "mockEvent";
      delay: number;
      error?: {
        count: number;
        description: string;
      };
    }
  | {
      type: "addCitation";
      formId: number;
      questionId: number;
      documentId: number;
      excerpt: string;
      bounds: Bounds[];
      review: Review;
      creator: string;
    }
  | {
      type: "updateReview";
      citationId: number;
      review: Review;
      creator: string;
    }
  | {
      type: "updateBounds";
      citationId: number;
      bounds: Bounds[];
      creator: string;
    };
