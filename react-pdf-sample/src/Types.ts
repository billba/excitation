export enum ReviewStatus {
  Unreviewed,
  Approved,
  Rejected,
}

export interface Region {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Doc {
  filename: string;
  pages: number;
}

export interface Citation {
  excerpt: string;
  docIndex: number;
  reviewStatus: ReviewStatus;
  page: number;
  region: Region;
}
