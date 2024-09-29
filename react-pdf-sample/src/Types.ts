export type Action =
  | {
      type: "startNewCitation";
    }
  | {
      type: "endNewCitation";
    }
  | {
      type: "gotoCitation";
      citationIndex?: number; // if undefined, choose the first one with unreviewed status. If none, keep current citation.
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
      selectedText: string;
    }
  | {
      type: "addSelection";
    }
  | {
      type: "toggleReviewStatus";
      citationIndex: number;
      target: ReviewStatus.Approved | ReviewStatus.Rejected;
    };

interface ExploreState {
  explore: true;
  docIndex: number;
  pageNumber: number;
}

export interface CitationHighlight {
  pageNumber: number;
  polygons: number[][];
}

export type NewCitationState = ExploreState & {
  newCitation: true;
  selectedText: string;
}

export type NoCitationsState = ExploreState & {
  newCitation: false;
  citationIndex: undefined;
}

export type UnlocatedCitationState = ExploreState & {
  newCitation: false;
  citationIndex: number;
}

export interface LocatedCitationState {
  newCitation: false;
  explore: false;
  citationIndex: number;
  citationHighlights: CitationHighlight[];
};

export type UXState = NewCitationState | NoCitationsState | UnlocatedCitationState | LocatedCitationState;

export enum ReviewStatus {
  Unreviewed,
  Approved,
  Rejected,
}

export interface Doc {
  filename: string;
  pages: number;
  response?: DocumentIntelligenceResponse;
}

export interface Citation {
  excerpt: string;
  docIndex: number;
  reviewStatus: ReviewStatus;
  boundingRegions?: BoundingRegion[];
}

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
