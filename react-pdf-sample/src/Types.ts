export type Action =
  | {
      type: "startNewCitation";
    }
  | {
      type: "endNewCitation";
    }
  | {
      type: "gotoCitation";
      citationIndex: number;
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
      docIndex: number;
    }
  | {
      type: "setSelectedText";
      range?: Range;
    }
  | {
      type: "addSelection";
    }
  | {
      type: "toggleReviewStatus";
      citationIndex: number;
      target: ReviewStatus;
    }
  | {
      type: "retryAddSelection";
      docIndex: number;
      questionIndex: number;
      pageNumber: number;
      range: Range;
    }
  | {
      type: "revertAddSelection";
      questionIndex: number;
      citationIndex: number;
    };

export type AsyncState =
  | {
      status: "idle";
    }
  | {
      status: "pending";
      event: Event;
      onRetry: Action;
      onRevert: Action;
    }
  | {
      status: "loading";
      onRetry: Action;
      onRevert: Action;
    }
  | {
      status: "success";
    }
  | {
      status: "error";
      error: string;
      onRetry: Action;
      onRevert: Action;
    };

export interface CitationHighlight {
  pageNumber: number;
  polygons: number[][];
}

interface BaseState {
  questionIndex: number;
  newCitation: boolean;
  docIndex: number;
  pageNumber: number;
}

export interface NewCitationState extends BaseState {
  newCitation: true;
  range?: Range;
}

export interface NoCitationsState extends BaseState {
  newCitation: false;
  citationIndex: undefined;
}

export interface CitationState extends BaseState {
  newCitation: false;
  citationIndex: number;
  citationHighlights: CitationHighlight[];
}

export type NotNewCitationStates = NoCitationsState | CitationState;
export type UXState = NewCitationState | NotNewCitationStates;

export enum ReviewStatus {
  Unreviewed,
  Approved,
  Rejected,
}

export interface Doc {
  filename: string;
  friendlyname?: string;
  pages: number;
  response?: DocumentIntelligenceResponse;
}

export interface Citation {
  excerpt: string;
  docIndex: number;
  reviewStatus: ReviewStatus;
  boundingRegions?: BoundingRegion[];
}

export type Event = {
  type: "mockEvent";
  delay: number;
  error?: string;
};

export interface DocumentIntelligenceResponse {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: AnalyzeResult;
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
    type: "addCitation";
    formId: number;
    questionId: number;
    documentId: number;
    excerpt: string;
    bounds: BoundingRegion[];
    review: ReviewStatus;
    creator: string;
  }
  | {
    type: "updateReview";
    citationId: number;
    review: ReviewStatus;
    creator: string;
  }
  | {
    type: "updateBounds";
    citationId: number;
    bounds: BoundingRegion[];
    creator: string;
  };
