import { SerializedRange } from "./Range";

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
      type: "gotoPage";
      pageNumber: number;
    }
  | {
      type: "gotoDoc";
      doc: FormDocument;
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
  filename: string;
  friendlyname?: string;
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
  boundingRegions?: BoundingRegion[];
}

export interface Question {
  prefix?: string;
  text: string;
  citations: Citation[];
}

export interface DocumentIntelligenceResponse {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: AnalyzeResult;
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

interface AnalyzeResult {
  apiVersion: string;
  modelId: string;
  stringIndexType: string;
  content: string;
  pages: Page[];
  tables: Table[];
  paragraphs: Paragraph[];
  styles: Style[];
  contentFormat: string;
  sections: Section[];
  figures: Figure[];
}

interface Figure {
  id: string;
  boundingRegions: BoundingRegion[];
  spans: Span[];
  elements: string[];
  caption: Caption;
}

interface Section {
  spans: Span[];
  elements: string[];
}

interface Style {
  confidence: number;
  spans: Span[];
  isHandwritten: boolean;
}

interface Paragraph {
  spans: Span[];
  boundingRegions: BoundingRegion[];
  role?: string;
  content: string;
}

interface Table {
  rowCount: number;
  columnCount: number;
  cells: Cell[];
  boundingRegions: BoundingRegion[];
  spans: Span[];
  caption: Caption;
}

interface Caption {
  content: string;
  boundingRegions: BoundingRegion[];
  spans: Span[];
  elements: string[];
}

interface Cell {
  rowIndex: number;
  columnIndex: number;
  content: string;
  boundingRegions: BoundingRegion[];
  spans: (Span | Span)[];
  elements?: string[];
  columnSpan?: number;
  kind?: string;
}

export interface BoundingRegion {
  pageNumber: number;
  polygon: number[];
}

interface Page {
  pageNumber: number;
  angle: number;
  width: number;
  height: number;
  unit: string;
  words: Word[];
  lines: Line[];
  spans: Span[];
  selectionMarks?: SelectionMark[];
}

interface SelectionMark {
  state: string;
  polygon: number[];
  confidence: number;
  span: Span;
}

interface Line {
  content: string;
  polygon: number[];
  spans: Span[];
}

interface Word {
  content: string;
  polygon: number[];
  confidence: number;
  span: Span;
}

interface Span {
  offset: number;
  length: number;
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
      bounds: BoundingRegion[];
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
      bounds: BoundingRegion[];
      creator: string;
    };
