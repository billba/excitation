// DocInt polygons
export type Polygon4 = [
  number, number,
  number, number,
  number, number,
  number, number
]
export type PolygonN = number[]

// Complex polygons
// This does mean supporting cases where the lead and
// the tail are non-adjacent (i.e. the selection travels
// to the next line but not far enough to overlap with
// the previous line)
export interface PolygonC {
  lead: Polygon4;
  body?: Polygon4;
  tail?: Polygon4;
}

export type Polygon = Polygon4 | PolygonC

export interface PolygonOnPage {
  polygon: Polygon;
  page: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PointOnPage {
  point: Point;
  page: number;
}

// lowercase is pageless and primitives
export type Range = [number, number]

// uppercase range uses Points and therefore has pages
export interface CursorRange {
  start: PointOnPage;
  end: PointOnPage;
}

// Region is added to DocIntResponse.analyzeResult
export interface Region {
  polygon: Polygon4;
  lineIndices: Range;
  wordIndices: Range;
}

// returned to the Viewer
export interface Summary {
  excerpt: string;
  polygons: PolygonOnPage[];
}

// Doc Int base types
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
  content?: string;
  delta?: number; // <- added by Preprocess.ts
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
  boundingRegions: Bounds[];
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
  boundingRegions: Bounds[];
  role?: string;
  content: string;
}

interface Table {
  rowCount: number;
  columnCount: number;
  cells: Cell[];
  boundingRegions: Bounds[];
  spans: Span[];
  caption: Caption;
}

interface Caption {
  content: string;
  boundingRegions: Bounds[];
  spans: Span[];
  elements: string[];
}

interface Cell {
  rowIndex: number;
  columnIndex: number;
  content: string;
  boundingRegions: Bounds[];
  spans: (Span | Span)[];
  elements?: string[];
  columnSpan?: number;
  kind?: string;
}

export interface Bounds {
  pageNumber: number;
  polygon: Polygon4;
}

export interface Page {
  pageNumber: number;
  angle: number;
  width: number;
  height: number;
  unit: string;
  words: Word[];
  lines: Line[];
  regions?: Region[]; // <- added by Preprocess.ts
  spans: Span[];
  selectionMarks?: SelectionMark[];
}

interface SelectionMark {
  state: string;
  polygon: Polygon4;
  confidence: number;
  span: Span;
}

export interface Line {
  content: string;
  polygon: Polygon4;
  spans: Span[];
}

export interface Word {
  content: string;
  polygon: Polygon4;
  confidence: number;
  span: Span;
}

interface Span {
  offset: number;
  length: number;
}