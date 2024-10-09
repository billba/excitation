import {
  ViewerState,
} from "./Types";

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

export const createCitationId = (formId: number, creator: string) => {
  return formId + '-' + creator + '-' + Date.now();
}

// Rounds a number to the given precision
const round = (value: number, precision = 0) => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};

// Return true if polygons overlap (including sharing borders); false otherwise
// delta controls the amount of space that can be between polygons without them
// being considered non-adjacent (i.e. accounts for spaces between words)
const adjacent = (poly0: number[], poly1: number[], delta = 0.2) => {
  const x0 = [round(poly0[0], 1), round(poly0[2], 1)];
  const y0 = [round(poly0[1], 1), round(poly0[5], 1)];

  const x1 = [round(poly1[0], 1), round(poly1[2], 1)];
  const y1 = [round(poly1[1], 1), round(poly1[5], 1)];

  // The rectangles don't overlap if one rectangle's minimum in some
  // dimension is greater than the other's maximum in that dimension
  const noOverlap =
    x0[0] > x1[1] + delta ||
    x1[0] > x0[1] + delta ||
    y0[0] > y1[1] + delta ||
    y1[0] > y0[1] + delta;
  return !noOverlap;
};

// Similar to above, but only returns true if the polygons are adjacent in
// such a way that they are on the same line (or thereabouts; basically the 
// y-data needs to overlap)
const onSameLine = (poly0: number[], poly1: number[], delta= 0.2) => {
  const y0 = [round(poly0[1], 1), round(poly0[5], 1)];
  const y1 = [round(poly1[1], 1), round(poly1[5], 1)];

  const noOverlap = 
    y0[0] > y1[1] + delta ||
    y1[0] > y0[1] + delta;
  return !noOverlap;
}

// from x(x0, x1) and y(y0, y1) create an 8 value polygon
const polygonize = (x: number[], y: number[]) => {
  return [x[0], y[0], x[1], y[0], x[1], y[1], x[0], y[1]];
};

// Combine two squared up polygons and return the combination
// if the two polygons are NOT adjacent you will get weird results!!!
const combinePolygons = (poly0: number[], poly1: number[]) => {
  const x = [Math.min(poly0[0], poly1[0]), Math.max(poly0[2], poly1[2])];
  const y = [Math.min(poly0[1], poly1[1]), Math.max(poly0[5], poly1[5])];
  return polygonize(x, y);
};

// Return a polygon with sides that are parallel to the major axes
const squareUp = (poly: number[]) => {
  const x = [Math.min(poly[0], poly[6]), Math.max(poly[2], poly[4])];
  const y = [Math.min(poly[1], poly[3]), Math.max(poly[5], poly[7])];
  return polygonize(x, y);
};

// return the given boundingRegions combined into the minimum possible
// number of boundingRegions
export const condenseRegions = (boundingRegions: Bounds[]) => {
  if (boundingRegions.length === 0) return boundingRegions;

  const condensedRegions: Bounds[] = [
    {
      pageNumber: boundingRegions[0].pageNumber,
      polygon: squareUp(boundingRegions[0].polygon),
    },
  ];

  let last = condensedRegions.length - 1;
  for (let index = 1; index < boundingRegions.length; index++) {
    boundingRegions[index].polygon = squareUp(boundingRegions[index].polygon);

    if (
      condensedRegions[last].pageNumber === boundingRegions[index].pageNumber
    ) {
      if (
        adjacent(condensedRegions[last].polygon, boundingRegions[index].polygon)
      ) {
        // adding to existing polygon
        condensedRegions[last].polygon = combinePolygons(
          condensedRegions[last].polygon,
          boundingRegions[index].polygon
        );
      } else {
        // New column or similar
        condensedRegions.push(boundingRegions[index]);
        last++;
      }
    } else {
      // new page
      condensedRegions.push(boundingRegions[index]);
      last++;
    }
  }
  return condensedRegions;
};

// creates a polygon on provided canvas using provided scale and polygon data
export const drawPolygon = (
  context: CanvasRenderingContext2D,
  scale: number = 1,
  polygon: number[]
): void => {
  const multiplier = 72 * (window.devicePixelRatio || 1) * scale;
  context.fillStyle = "rgba(252, 207, 8, 0.3)";
  context.strokeStyle = "#fccf08";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(polygon[0] * multiplier, polygon[1] * multiplier);
  for (let i = 2; i < polygon.length; i += 2) {
    context.lineTo(polygon[i] * multiplier, polygon[i + 1] * multiplier);
  }
  context.closePath();
  context.fill();
  context.stroke();
};

// Simple matching
// special cases:
//  - case is irrelevant
//  - strip trailing periods
//  - strip trailing semicolons
//  - strip dollar signs
//  - strip leading quotes
const match = (str0: string, str1: string) => {
  // lower case
  str0 = str0.toLocaleLowerCase();
  str1 = str1.toLocaleLowerCase();

  // // Strip trailing periods
  // if (str0.slice(-1) == ".") str0 = str0.slice(0, -1);
  // if (str1.slice(-1) == ".") str1 = str1.slice(0, -1);

  // // Strip trailing semicolons
  // if (str0.slice(-1) == ";") str0 = str0.slice(0, -1);
  // if (str1.slice(-1) == ";") str1 = str1.slice(0, -1);

  // // strip dollar signs
  // if (str0.slice(0, 1) == "$") str0 = str0.slice(1);
  // if (str1.slice(0, 1) == "$") str1 = str1.slice(1);

  // // strip leading quotes
  // if (str0.slice(0, 1) == '"') str0 = str0.slice(1);
  // if (str1.slice(0, 1) == '"') str1 = str1.slice(1);

  if (str0 === str1) return true;

  return false;
};

const matchArray = (strArr0: string[], strArr1: string[]) => {
  if (strArr0.length != strArr1.length) return false;

  for (let index = 0; index < strArr0.length; index++) {
    if (!match(strArr0[index], strArr1[index])) return false;
  }

  return true;
}

// Given a docint response and reference text (array of words), find
// the relevant BoundingRegions (per-word)
const findBoundingRegions = (
  text: string[],
  response: DocumentIntelligenceResponse
) => {
  const pages = response.analyzeResult.pages;
  let boundingRegions: Bounds[] = [];

  let textIndex = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    let lineIndex = 0;
    const line = page.lines[lineIndex];
    let wordsInLine = line.content.split(' ');
    for (let wordIndex = 0; wordIndex < page.words.length; wordIndex++) {
      const word = page.words[wordIndex];
      if (matchArray(wordsInLine, text.slice(textIndex, textIndex + wordsInLine.length))) {
        console.log("array equals succeeded for line", wordsInLine);
        textIndex += wordsInLine.length;
        boundingRegions.push({
          pageNumber: pageIndex + 1,
          polygon: line.polygon
        });
        if (textIndex == text.length) return boundingRegions;
      }
      else if (match(word.content, text[textIndex])) {
        textIndex++;
        boundingRegions.push({
          pageNumber: pageIndex + 1,
          polygon: word.polygon,
        });
        if (textIndex == text.length) return boundingRegions;
      } else {
        if (textIndex != 0) {
          // If the word doesn't match, and we thought we had found
          // some part of the sentence, reset to the beginning and
          // clear stored region data
          textIndex = 0;
          boundingRegions = [] as Bounds[];
        }
      }
    }
  }
  return boundingRegions;
};

export const returnTextPolygonsFromDI = (
  text: string,
  response: DocumentIntelligenceResponse
) => {
  const words = text.split(/\s+/); // split on all space characters
  const foundBoundingRegions = findBoundingRegions(words, response);
  const bounds = condenseRegions(foundBoundingRegions);
  if (bounds.length === 0) {
    console.log("NO MATCH:", words);
    // what happens if we don't find any bounding regions?
    // The question exists, the reference exists, the document exists, Document Intelligence just didn't do its job
    return;
  }
  console.log("MATCH:", words);
  return bounds;
  // what happens if we don't find any bounding regions?
  // The question exists, the reference exists, the document exists, Document Intelligence just didn't do its job
};

// compares a bounding regions polygon to a reference polygon
// refPoly MUST be a full-width line (full column width, not 
// necessarily full page width)
// poly may be of any width
// returns:
// -1 if poly is situated earlier in the page than refPoly
// 0 if poly is sitatued within/about refPoly
// 1 if poly is situated later in the page than refPoly
const comparePolygons = (poly: number[], refPoly: number[]) => {
  const x = [ poly[0], poly[2] ];
  const y = [ poly[1], poly[5] ];

  const refX = [ refPoly[0], refPoly[2] ];
  const refY = [ refPoly[1], refPoly[5] ];

  // first: are they in the same column?
  // no, poly is an earlier column
  if (x[1] < refX[0]) return -1;
  // no, poly is a later column
  if (x[0] > refX[1]) return 1;

  // then: how do they compare vertically within a column?
  // poly is earlier in the column
  if (y[1] < refY[0]) return -1;
  // poly is later in the column
  if (y[0] < refY[1]) return 1;

  // if we're still here, poly overlaps refPoly
  return 0;
}

const polygonBinarySearch = (lines: Line[], poly: number[]) => {
  if (lines.length === 1) return lines[0];
  let axis = Math.floor(lines.length / 2);
  console.log("lines:", lines);
  console.log("axis:", axis);

  switch (comparePolygons(poly, lines[axis].polygon)) {
    case -1:
      return polygonBinarySearch(lines.slice(0, axis), poly);
    case 0:
      // todo spread out and find *all* intersecting lines
      return lines[axis];
    case 1:
      return polygonBinarySearch(lines.slice(axis + 1), poly);
  }
}

const findTextFromBoundingRegions = (
  response: DocumentIntelligenceResponse,
  boundingRegions: Bounds[]
) => {
  console.log(response);
  // page numbers are 1-indexed, thus the subtraction
  const page = response.analyzeResult.pages[boundingRegions[0].pageNumber - 1];
  const lines = page.lines;
  console.log(lines);
  const intersectingLine = polygonBinarySearch(lines, boundingRegions[0].polygon)
  return intersectingLine.content;
}

export function findUserSelection(
  pageNumber: number,
  range: Range,
  viewer: ViewerState,
  response: DocumentIntelligenceResponse
) {
  let { top, left, bottom, right } = range.getBoundingClientRect();
  const multiplier = 144 / (window.devicePixelRatio || 1);

  const dx = viewer.left - window.scrollX;
  const dy = viewer.top - window.scrollY;

  top = (top - dy) / multiplier;
  bottom = (bottom - dy) / multiplier;
  left = (left - dx) / multiplier;
  right = (right - dx) / multiplier;

  const bounds = [
    {
      pageNumber,
      polygon: polygonize([left, right], [top, bottom]),
    },
  ];

  const excerpt = findTextFromBoundingRegions(response, bounds);
  console.log(excerpt);
  return { excerpt, bounds };
}
