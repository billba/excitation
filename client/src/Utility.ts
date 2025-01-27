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

interface Column {
  polygon: number[],
  lines: Line[]
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

// from x(x0, x1) and y(y0, y1) create an 8 value polygon
const polygonize = (x: number[], y: number[]) => {
  return [x[0], y[0], x[1], y[0], x[1], y[1], x[0], y[1]];
};

// Combine two squared up polygons and return the combination
// if the two polygons are NOT adjacent you will get weird results!!!
const combineTwoPolygons = (poly0: number[], poly1: number[]) => {
  const x = [Math.min(poly0[0], poly1[0]), Math.max(poly0[2], poly1[2])];
  const y = [Math.min(poly0[1], poly1[1]), Math.max(poly0[5], poly1[5])];
  return polygonize(x, y);
};

// Combine an array of polygons using combineTwoPolygons
const combinePolygons = (polygons: number[][]) => {
  if (polygons.length == 0) return [];

  while (polygons.length > 1) {
    let lastPoly = polygons.pop();
    if (lastPoly) polygons[polygons.length - 1] = combineTwoPolygons(polygons[polygons.length - 1], lastPoly);
  }

  return polygons[0];
}

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
        condensedRegions[last].polygon = combineTwoPolygons(
          condensedRegions[last].polygon,
          boundingRegions[index].polygon
        );
      } else {
        // create new polygon to bridge non-adjacent polygons
        const intermediaryPolygon = polygonize(
          [condensedRegions[last].polygon[2], boundingRegions[index].polygon[0]],
          [
            Math.min(condensedRegions[last].polygon[3], boundingRegions[index].polygon[1]), 
            Math.max(condensedRegions[last].polygon[5], boundingRegions[index].polygon[7])
          ]
        );

        // combine polygons
        condensedRegions[last].polygon = combinePolygons([
          condensedRegions[last].polygon, 
          intermediaryPolygon, 
          boundingRegions[index].polygon
        ]);
      }
    } else {
      // new page
      condensedRegions.push(boundingRegions[index]);
      last++;
    }
  }
  return condensedRegions;
};

// Simple matching
// special cases:
//  - case is irrelevant
const match = (str0: string, str1: string) => {
  // lower case
  str0 = str0.toLocaleLowerCase();
  str1 = str1.toLocaleLowerCase();

  return (str0 === str1);
};

// const matchArray = (strArr0: string[], strArr1: string[]) => {
//   if (strArr0.length != strArr1.length) return false;

//   for (let index = 0; index < strArr0.length; index++) {
//     if (!match(strArr0[index], strArr1[index])) return false;
//   }

//   return true;
// }

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
    // let lineIndex = 0;
    // const line = page.lines[lineIndex];
    // let wordsInLine = line.content.split(' ');
    for (let wordIndex = 0; wordIndex < page.words.length; wordIndex++) {
      const word = page.words[wordIndex];
      // if (matchArray(wordsInLine, text.slice(textIndex, textIndex + wordsInLine.length))) {
      //   console.log("array equals succeeded for line", wordsInLine);
      //   textIndex += wordsInLine.length;
      //   boundingRegions.push({
      //     pageNumber: pageIndex + 1,
      //     polygon: line.polygon
      //   });
      //   if (textIndex == text.length) return boundingRegions;
      // }

      // Selection marks do not come back in the page.words and therefore do not have the bounds. 
      // selction marks are available in the paragraphs and lines but we don't currently use those fields.
      // When we encounter a selection mark from the `text` array, we skip it and continue to the next word from the `text` array.
      let currWord = text[textIndex];
      while (currWord == ":unselected:" || currWord == ":selected:") {
        textIndex++;
        currWord = text[textIndex];
        if (textIndex == text.length) return boundingRegions;
      }
      if (match(word.content, currWord)) {
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
};

// compares a bounding regions polygon to a reference polygon
// both polys are assumed to be in the same column
// returns:
// - if poly is situated earlier in the page than refPoly
// 0 if poly is sitatued within/about refPoly
// + if poly is situated later in the page than refPoly
const comparePolygons = (poly: number[], refPoly: number[]) => {
  const x = [poly[0], poly[2]];
  const y = [poly[1], poly[5]];

  const refX = [refPoly[0], refPoly[2]];
  const refY = [refPoly[1], refPoly[5]];

  // first: how do they compare vertically?
  // poly is earlier in the column
  if (y[1] < refY[0]) return -1;
  // poly is later in the column
  if (y[0] > refY[1]) return 1;

  // then: how do they compare horizontally within the line?
  // poly is earlier in the line
  if (x[1] < refX[0]) return -2;
  // poly is later in the line
  if (x[0] > refX[1]) return 2;

  // if we're still here, poly overlaps refPoly
  return 0;
}

// starting from lines[axis] and working backward, find the first entry
// in lines that intersects with poly
const getFirstPolyIntersectionIndex = (lines: Line[], poly: number[], axis: number) => {
  do axis--; while (axis >= 0 && comparePolygons(poly, lines[axis].polygon) == 0);
  return ++axis;
}

// starting from lines[axis] and working forward, find the last entry in
// lines that intersects with poly
const getLastPolyIntersectionIndex = (lines: Line[], poly: number[], axis: number) => {
  do axis++; while (axis < lines.length && comparePolygons(poly, lines[axis].polygon) == 0);
  return --axis;
}

// searches lines[start, end) (that is, inclusive of start and exclusive of end)
// for poly, in a binary search - compare against midpoint and move from there
const polygonBinarySearch = (lines: Line[], start: number, end: number, poly: number[]) => {
  // no data whatsoever
  if (end == 0) {
    console.log("polygon search | no lines to search");
    return [];
  }
  // no intersections :(
  if (start == end) {
    console.log("polygon search | no further lines to search");
    return [];
  }

  // find the midpoint of the given range [start, end)
  const axis = Math.floor((end - start) / 2) + start;
  console.log(`polygon search | axis [${axis}]:`, lines[axis].content);

  // compare poly to the midpoint
  switch (comparePolygons(poly, lines[axis].polygon)) {
    case -2:
    case -1:
      return polygonBinarySearch(lines, start, axis, poly);

    case 0:
      return lines.slice(
        getFirstPolyIntersectionIndex(lines, poly, axis),
        getLastPolyIntersectionIndex(lines, poly, axis) + 1);

    case 1:
    case 2:
      return polygonBinarySearch(lines, axis + 1, end, poly);
  }
}

// compares offsetRange against refOffset. returns:
// - if offsetRange is earlier in the page than refOffset
// 0 if offsetRange contains refOffset
// + if offsetRange is later in the page than refOffset
const compareOffsets = (offsetRange: number[], refOffset: number) => {
  if (offsetRange[1] < refOffset) return -1;
  if (offsetRange[0] > refOffset) return 1;
  return 0;
}

// starting from words[axis] and working backward, find the first entry
// in words that overlaps with offsetRange
const getFirstOffsetIntersectionIndex = (words: Word[], axis: number, offsetRange: number[]) => {
  do axis--; while (axis >= 0 && compareOffsets(offsetRange, words[axis].span.offset) == 0);
  return ++axis;
}

// starting from words[axis] and working forward, find the last entry
// in words that overlaps with offsetRange
const getLastOffsetIntersectionIndex = (words: Word[], axis: number, offsetRange: number[]) => {
  do axis++; while (axis < words.length && compareOffsets(offsetRange, words[axis].span.offset) == 0);
  return --axis;
}

// searches words[start, end) (that is, inclusive of start and exclusive of end)
// for the words contained within the offset range
const offsetBinarySearch = (words: Word[], start: number, end: number, offsetRange: number[]) => {
  if (end == 0) {
    console.log("offset search | no words to search");
    return [];
  }

  if (start == end) {
    console.log("offset search | no further words to search");
    return [];
  }

  const axis = Math.floor((end - start) / 2) + start;
  console.log(`offset search | axis [${axis}]: offset ${words[axis].span.offset}`);

  switch (compareOffsets(offsetRange, words[axis].span.offset)) {
    case -1:
      return offsetBinarySearch(words, start, axis, offsetRange);

    case 0:
      return words.slice(
        getFirstOffsetIntersectionIndex(words, axis, offsetRange),
        getLastOffsetIntersectionIndex(words, axis, offsetRange) + 1);

    case 1:
      return offsetBinarySearch(words, axis + 1, end, offsetRange);
  }
}

// Takes an array of lines and returns an array of Column items
// each of which is a polygon and an array of lines
const splitIntoColumns = (lines: Line[]) => {
  // no lines
  if (lines.length == 0) return [{
    polygon: [],
    lines: []
  }];
  // single line
  if (lines.length == 1) return [{
    polygon: lines[0].polygon,
    lines: lines
  }];

  let cols = [];
  let firstLineOfCol = 0;

  for (let currentLine = 0; currentLine < lines.length; currentLine++) {
    // is this the last line and therefore the end of the last column?
    // OR, is lines[currentLine + 1] a new column/section?
    if (currentLine == lines.length - 1 ||
      !adjacent(lines[currentLine + 1].polygon, lines[currentLine].polygon)) {
      // let's wrap up the current column.
      const colLines = lines.slice(firstLineOfCol, currentLine + 1);
      // we combine all polys to make sure we capture the full width of the column
      // and don't accidentally just grab, say, a header (short) and a last line of
      // a paragraph (also short)
      const polygon = combinePolygons(colLines.map((line) => line.polygon));
      cols.push({
        polygon: polygon,
        lines: colLines
      });
      firstLineOfCol = currentLine + 1;
    }
  }

  console.log(`split ${lines.length} lines into ${cols.length} columns`);
  for (let index = 0; index < cols.length; index++) {
    let col = cols[index];
    console.log(`col [${index}]: "${col.lines[0].content}" ... ${col.lines.length - 2} more lines ... "${col.lines[col.lines.length - 1].content}"`);
  }

  return cols;
}

// from an array of Columns, find any where col.polygon intersects with poly
const getRelevantColumns = (columns: Column[], poly: number[]) => {
  return columns.filter((col) => comparePolygons(col.polygon, poly) == 0)
}

// Given bounds and a doc int response, find the most likely excerpt text
const findTextFromBoundingRegions = (
  response: DocumentIntelligenceResponse,
  bounds: Bounds[]
) => {
  let excerptWords = [];
  for (const bound of bounds) {
    console.log(`searching for bounds x(${bound.polygon[0]},${bound.polygon[2]}) y(${bound.polygon[1]},${bound.polygon[5]})`)
    // page numbers are 1-indexed, thus the subtraction
    const page = response.analyzeResult.pages[bound.pageNumber - 1];
    const lines = page.lines;
    const words = page.words;

    const columns = splitIntoColumns(lines);
    const relevantColumns = getRelevantColumns(columns, bound.polygon);
    if (relevantColumns.length == 0) console.log("no relevant columns to search");

    const intersectingLines = [];
    for (const col of relevantColumns) {
      let index = columns.indexOf(col);
      console.log(`SEARCHING col [${index}]`);

      intersectingLines.push(...polygonBinarySearch(col.lines, 0, col.lines.length, bound.polygon));
    }

    if (intersectingLines.length == 0) continue;

    const offsetStart = intersectingLines[0].spans[0].offset;
    const lastLine = intersectingLines[intersectingLines.length - 1];
    const offsetEnd = lastLine.spans[0].offset + lastLine.spans[0].length;
    console.log("offset range for search:", offsetStart, offsetEnd);

    const intersectingWords = offsetBinarySearch(words, 0, words.length, [offsetStart, offsetEnd]);
    excerptWords.push(...intersectingWords.filter((word) => comparePolygons(word.polygon, bound.polygon) == 0));
  }

  const excerpts = excerptWords.map((word) => word.content);
  let excerpt = excerpts.join(' ');
  if (excerpt === '') excerpt = 'could not find matching line(s)';
  return excerpt;
}

// Takes in user selection information and a doc int response
// creates bounds from selection info
// and finds the most likely excerpt text
export function findUserSelection(
  pageNumber: number,
  range: Range,
  response: DocumentIntelligenceResponse
) {
  let { top, left, bottom, right } = range.getBoundingClientRect();
  const multiplier = 72;

  const topDiv = document.getElementById("answer-container")?.offsetHeight
  const midDiv = document.getElementById("navbar")?.offsetHeight
  const lowerDiv = document.getElementById("breadcrumbs")?.offsetHeight
  const dy = window.scrollY + (topDiv! + midDiv! + lowerDiv!);

  const sideDiv = document.getElementById("sidebar")?.offsetWidth
  const dx = window.scrollX + sideDiv!; // should be static.

  top = round((top - dy) / multiplier, 4);
  bottom = round((bottom - dy) / multiplier, 4);

  left = round((left - dx) / multiplier, 4);
  right = round((right - dx) / multiplier, 4);

  if (top < 1) console.log(`bounds:top [${top}] is curiously small for a standard document`);
  if (bottom > 10) console.log(`bounds:bottom [${bottom}] is curiously large for a standard document`);
  if (left < 1) console.log(`bounds:left [${left}] is curiously small for a standard document`);
  if (right > 7.5) console.log(`bounds:right [${right}] is curiously large for a standard document`);

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
