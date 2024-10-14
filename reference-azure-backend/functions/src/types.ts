export enum Review {
  Unreviewed,
  Approved,
  Rejected,
}

export interface BoundingRegion {
  pageNumber: number;
  polygon: number[];
}

export type Event =
  | {
    type: "addCitation";
    formId: number;
    questionId: number;
    documentId: number;
    citationId: number;
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

interface Document {
  name: string;
  pdfURL: string;
  diURL: string;
}

interface Citation {
  questionId: number;
  documentId: number;
  excerpt: string;
  bounds: BoundingRegion[];
}

export interface Form {
  formName: string;
  questions: string[];
  documents: Document[];
  citations: Citation[];
}