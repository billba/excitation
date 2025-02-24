// ========================
// Polygon Types
// ========================

/**
 * Represents a quadrilateral polygon defined by 8 numerical values.
 * These values correspond to the (x, y) coordinates of four vertices.
 */
export type Polygon4 = [
  number,
  number, // Top-left
  number,
  number, // Top-right
  number,
  number, // Bottom-right
  number,
  number // Bottom-left
];

/**
 * Represents a polygon with an arbitrary number of points.
 * It is defined as an array of numerical values representing (x, y) coordinates.
 */
export type PolygonN = number[];

/**
 * Represents a polygon that can be either a four-sided (`Polygon4`) or an
 * arbitrarily complex (`PolygonN`) polygon.
 */
export type Polygon = Polygon4 | PolygonN;

/**
 * Represents a complex polygon that can be composed of multiple segments:
 * - `head`: The starting segment of the polygon.
 * - `body`: The middle segment, typically representing the main shape.
 * - `tail`: The ending segment.
 *
 * This structure supports cases where selections travel across multiple lines
 * without necessarily overlapping previous lines.
 */
export interface PolygonC {
  head?: Polygon4;
  body?: Polygon4;
  tail?: Polygon4;
}

/**
 * Represents a polygon that is associated with a specific page in a document.
 */
export interface PolygonOnPage {
  polygon: PolygonC;
  page: number;
}

// ========================
// Point Types
// ========================

/**
 * Represents a point in a 2D coordinate system.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a point in a 2D coordinate system associated with a specific page.
 */
export interface PointOnPage {
  point: Point;
  page: number;
}

// ========================
// Range & Selection Types
// ========================

/**
 * Represents a numerical range as a tuple with two values:
 * `[start, end]`.
 */
export type Range = [number, number];

/**
 * Represents a cursor-based selection range, using `PointOnPage` for both
 * the start and end points.
 */
export interface CursorRange {
  start: PointOnPage;
  end: PointOnPage;
}

// ========================
// Region Types
// ========================

/**
 * An array of citation regions.
 */
export type CitationRegions = Array<PolygonC>;

/**
 * Represents the citation regions found on a specific page.
 */
export interface CitationRegionsPerPage {
  page: number;
  citationRegions: CitationRegions;
}

/**
 * Represents a defined region within a page.
 */
export interface Region {
  polygon: Polygon4;
  lineIndices: Range;
  wordIndices: Range;
  paragraphIndex: number;
}

/**
 * Represents a summary of selected text in a document.
 * - `excerpt`: The extracted text.
 * - `polygons`: The list of associated polygons on pages.
 *
 * This is typically returned to the viewer.
 */
export interface Summary {
  excerpt: string;
  polygons: PolygonOnPage[];
}

// ========================
// DI Types
// ========================

/**
 * Represents the response from DI.
 * Contains metadata and analysis results.
 */
export interface DocIntResponse {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: AnalyzeResult;
}

/**
 * Represents the results of DI.
 */
export interface AnalyzeResult {
  apiVersion: string;
  modelId: string;
  stringIndexType: string;
  content?: string;
  pages: Page[];
  tables: Table[];
  paragraphs: Paragraph[];
  styles: Style[];
  contentFormat?: string;
  sections?: Section[];
  figures?: Figure[];
}

/**
 * Represents a paragraph of text extracted from the document.
 */
export interface Paragraph {
  spans: Span[];
  boundingRegions: Bounds[];
  role?: string;
  content: string;
}

/**
 * Represents an analyzed figure within a document.
 */
interface Figure {
  id: string;
  boundingRegions: Bounds[];
  spans: Span[];
  elements: string[];
  caption: Caption;
}

/**
 * Represents a section in a document, containing text spans and elements.
 */
interface Section {
  spans: Span[];
  elements: string[];
}

/**
 * Represents the detected style of text, such as handwriting recognition.
 */
interface Style {
  confidence: number;
  spans: Span[];
  isHandwritten: boolean;
}

/**
 * Represents a structured table found in a document.
 */
interface Table {
  rowCount: number;
  columnCount: number;
  cells: Cell[];
  boundingRegions: Bounds[];
  spans: Span[];
  caption?: Caption;
}

/**
 * Represents a caption found in a document, typically associated with a figure or table.
 */
interface Caption {
  content: string;
  boundingRegions: Bounds[];
  spans: Span[];
  elements: string[];
}

/**
 * Represents an individual cell within a table.
 */
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

/**
 * Represents the bounding region of an element within a document.
 */
export interface Bounds {
  pageNumber: number;
  polygon: Polygon;
}

/**
 * Represents an analyzed page within a document.
 */
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

/**
 * Represents a detected selection mark.
 */
interface SelectionMark {
  state: string;
  polygon: Polygon;
  confidence: number;
  span: Span;
}

/**
 * Represents a line of text extracted from the document.
 */
export interface Line {
  content: string;
  polygon: Polygon;
  spans: Span[];
}

/**
 * Represents an individual word extracted from the document.
 */
export interface Word {
  content: string;
  polygon: Polygon;
  confidence: number;
  span: Span;
}

/**
 * Represents a span of text within a document, defined by an offset and length.
 */
interface Span {
  offset: number;
  length: number;
}
