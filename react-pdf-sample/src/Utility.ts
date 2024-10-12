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
// both polys are assumed to be in the same column
// returns:
// -1 if poly is situated earlier in the page than refPoly
// 0 if poly is sitatued within/about refPoly
// 1 if poly is situated later in the page than refPoly
const comparePolygons = (poly: number[], refPoly: number[]) => {
  const x = [ poly[0], poly[2] ];
  const y = [ poly[1], poly[5] ];

  const refX = [ refPoly[0], refPoly[2] ];
  const refY = [ refPoly[1], refPoly[5] ];

  // first: how do they compare vertically?
  // poly is earlier in the column
  if (y[1] < refY[0]) return -1;
  // poly is later in the column
  if (y[0] > refY[1]) return 1;

  // then: how do they compare horizontally within the line?
  // poly is earlier in the line
  if (x[1] < refX[0]) return -1;
  // poly is later in the line
  if (x[0] > refX[1]) return 1;

  // if we're still here, poly overlaps refPoly
  return 0;
}

// starting from lines[axis] and working backward, find the first entry
// in lines that intersects with poly
const getFirstIntersectionIndex = (lines: Line[], poly: number[], axis: number) => {
  do axis--; while (axis >= 0 && comparePolygons(poly, lines[axis].polygon) == 0);
  return ++axis;
}

// starting from lines[axis] and working forward, find the last entry in
// lines that intersects with poly
const getLastIntersectionIndex = (lines: Line[], poly: number[], axis: number) => {
  do axis++; while (axis < lines.length && comparePolygons(poly, lines[axis].polygon) == 0);
  return --axis;
}

// searches lines[start, end) (that is, inclusive of start and exclusive of end)
// for poly, in a binary search - compare against midpoint and move from there
const polygonBinarySearch = (lines: Line[], start: number, end: number, poly: number[]) => {
  // no data whatsoever
  if (end == 0) {
    console.log("no lines to search");
    return lines;
  }
  // no intersections :(
  if (start == end) {
    console.log("no further lines to search; closest guess returned");
    return lines.slice(start, start + 1);
  }

  // find the midpoint of the given range [start, end)
  let axis = Math.floor((end - start) / 2) + start;
  console.log(`axis [${axis}]:`, lines[axis].content);

  // compare poly to the midpoint
  switch (comparePolygons(poly, lines[axis].polygon)) {
    case -1:
      console.log("looking farther up the page...");
      return polygonBinarySearch(lines, start, axis, poly);

    case 0:
      return lines.slice(
        getFirstIntersectionIndex(lines, poly, axis),
        getLastIntersectionIndex(lines, poly, axis) + 1);

    case 1:
      console.log("looking farther down the page...")
      return polygonBinarySearch(lines, axis + 1, end, poly);
  }
}

interface Column {
  polygon: number[],
  lines: Line[]
}

const splitIntoColumns = (lines: Line[]) => {
  if (lines.length == 0) return [{
    polygon: [],
    lines: []
  }];
  if (lines.length == 1) return [{
    polygon: lines[0].polygon,
    lines: lines
  }];

  let cols = [];
  let firstLineOfCol = 0;

  for (let currentLine = 0; currentLine < lines.length; currentLine++) {
    // is lines[currentLine + 1] a new column?
    // OR, is this the last line and therefore the end of the last column?
    if (currentLine == lines.length - 1
        || comparePolygons(lines[currentLine + 1].polygon, lines[currentLine].polygon) < 0) {
      // let's wrap up the current column.
      cols.push({
        polygon: combinePolygons(lines[firstLineOfCol].polygon, lines[currentLine].polygon),
        lines: lines.slice(firstLineOfCol, currentLine + 1)
      });
      firstLineOfCol = currentLine + 1;
    }
  }

  console.log(`split ${lines.length} lines into ${cols.length} columns`)
  return cols;
}

// from an array of Columns, find the first where col.polygon intersects with poly
const getRelevantColumn = (columns: Column[], poly: number[]) => {
  for (const col of columns) {
    console.log(`col ${col}`);
    if (comparePolygons(col.polygon, poly) == 0) return col;
  }

  // if there's no match or no columns
  return {
    polygon: [],
    lines: []
  };
}

const findTextFromBoundingRegions = (
  response: DocumentIntelligenceResponse,
  bounds: Bounds[]
) => {
  // page numbers are 1-indexed, thus the subtraction
  const page = response.analyzeResult.pages[bounds[0].pageNumber - 1];
  const lines = page.lines;
  const columns = splitIntoColumns(lines);
  const col = getRelevantColumn(columns, bounds[0].polygon);
  const intersectingLines = polygonBinarySearch(col.lines, 0, col.lines.length, bounds[0].polygon);

  if (intersectingLines.length == 0) {
    console.log("nothing found for user selection");
    return 'ERR';
  }
  const contents = intersectingLines.map((line) => line.content);
  return contents.join(' ');
}

export function findUserSelection(
  pageNumber: number,
  range: Range,
  viewer: ViewerState,
  response: DocumentIntelligenceResponse
) {
  let { top, left, bottom, right } = range.getBoundingClientRect();
  const multiplier = 72;

  const dx = viewer.left - window.scrollX;
  const dy = viewer.top - window.scrollY;

  top = round((top - dy) / multiplier, 4);
  bottom = round((bottom - dy) / multiplier, 4);
  left = round((left - dx) / multiplier, 4);
  right = round((right - dx) / multiplier, 4);

  if (top < 1) console.log("bounds:top is curiously small for a standard document", top);
  if (bottom > 10) console.log("bounds:bottom is curiously large for a standard document", bottom);
  if (left < 1) console.log("bounds:left is curiously small for a standard document", left);
  if (right > 7.5) console.log("bounds:right is curiously large for a standard document", right);

  const bounds = [
    {
      pageNumber,
      polygon: polygonize([left, right], [top, bottom]),
    },
  ];

  const excerpt = findTextFromBoundingRegions(response, bounds);
  console.log("found excerpt:", excerpt);

  return { excerpt, bounds };
}
