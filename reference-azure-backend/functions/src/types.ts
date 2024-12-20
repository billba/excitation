export enum Review {
  Unreviewed,
  Approved,
  Rejected,
}

export interface Bounds {
  pageNumber: number;
  polygon: number[];
}

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
    type: "updateBounds";
    citationId: string;
    bounds: Bounds[];
    creator: string;
  }
  | {
    type: "updateAnswer";
    questionId: number;
    formId: number;
    answer: string;
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
  bounds: Bounds[];
}

export interface Form {
  formName: string;
  questions: string[];
  documents: Document[];
  citations: Citation[];
}

export interface Answer {
  questionId: number;
  formId: number;
  answer: string;
  creator: string;
}