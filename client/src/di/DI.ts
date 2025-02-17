import {
  CursorRange,
  DocIntResponse,
  Page,
  Point,
  Polygon4,
  PolygonOnPage,
  Range,
  Region,
  Summary,
} from "./Types";
import {
  comparePointToPolygon,
  comparePoints,
  combinePolygons,
} from "./Utility";
import { offsetSearch } from "./OffsetSearch";

/**
 * Finds the index of the word that intersects with the given point within the specified region on a page.
 *
 * @param point - The target point to check for intersection.
 * @param page - The page containing the region and words.
 * @param region - The region in which to search for the word.
 * @returns The index of the intersecting word, or `null` if no word is found.
 */
function findInRegion(point: Point, page: Page, region: Region): number | null {
  const linesOfInterest = page.lines
    .slice(region.lineIndices[0], region.lineIndices[1] + 1)
    .filter(
      (line) => comparePointToPolygon(point, line.polygon as Polygon4) == 0
    );

  const wordIndices = [] as number[];
  for (const line of linesOfInterest) {
    const offsetStart = line.spans[0].offset;
    const offsetEnd = offsetStart + line.spans[0].length;
    const wordRange = offsetSearch(page.words, [offsetStart, offsetEnd]);
    if (!wordRange) return null;

    const [startWord, endWord] = wordRange;
    for (let index = startWord; index <= endWord; index++) {
      if (
        comparePointToPolygon(point, page.words[index].polygon as Polygon4) == 0
      )
        wordIndices.push(index);
    }
  }

  if (wordIndices.length == 0) {
    console.log(
      `findInRegion | found no Word at point (${point.x}, ${point.y})`
    );
    return null;
  } else if (wordIndices.length > 1)
    console.log(
      `findInRegion | found multiple Words at point (${point.x}, ${point.y})`
    );

  return wordIndices[0];
}

/**
 * Finds the index of the word that intersects with the given point on a page.
 *
 * @param point - The target point to check for intersection.
 * @param page - The page containing regions and words.
 * @returns The index of the intersecting word, or `null` if no word is found.
 */
function findInPage(point: Point, page: Page): number | null {
  if (!page.regions) return null;

  const regionsOfInterest = page.regions.filter(
    (region) => comparePointToPolygon(point, region.polygon) == 0
  );
  if (regionsOfInterest.length == 0) {
    console.log(
      `findInPage | found no Region at point (${point.x}, ${point.y})`
    );
    return null;
  }
  if (regionsOfInterest.length > 1)
    console.log(
      `findInPage | found multiple Regions at point (${point.x}, ${point.y})`
    );

  for (const region of regionsOfInterest) {
    const index = findInRegion(point, page, region);
    if (index != null) return index;
  }
  return null;
}

/**
 * Creates a summary from a specified range of words across one or more pages.
 *
 * @param range - A tuple representing the start and end pages (0-indexed).
 * @param wordRange - A tuple representing the start and end word indices.
 * @param di - The document interpretation response containing the text analysis.
 * @returns A `Summary` object containing the extracted excerpt and polygonal representation.
 */
function createSummary(
  [startPage, endPage]: Range,
  [startWord, endWord]: Range,
  di: DocIntResponse
): Summary {
  const summary = { excerpt: "", polygons: [] as PolygonOnPage[] };

  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
    const page = di.analyzeResult.pages[pageIndex];

    // again i want the typing to stop yelling
    if (!page.regions) continue;

    for (const region of page.regions) {
      // if the end of this region is still prior to our startWord (and we're
      // on startWord's page), skip it
      if (pageIndex == startPage && region.wordIndices[1] < startWord) continue;
      // if the beginning of this region is past our endWord (and we're on
      // endWord's page), break the loop
      if (pageIndex == endPage && region.wordIndices[0] > endWord) break;

      // grab the relevant start and end points in the Word array
      const start =
        pageIndex == startPage
          ? Math.max(startWord, region.wordIndices[0])
          : region.wordIndices[0];
      const end =
        pageIndex == endPage
          ? Math.min(endWord, region.wordIndices[1])
          : region.wordIndices[1];
      const words = page.words.slice(start, end + 1);

      // get excerpt from this region
      const contents = words.map((word) => word.content);
      if (summary.excerpt.length > 0 && contents.length > 0)
        summary.excerpt += " ";
      summary.excerpt += contents.join(" ");

      // get polygon(s) from this region
      const polygons = words.map((word) => word.polygon);
      const poly = combinePolygons(polygons as Polygon4[]);
      summary.polygons.push({
        polygon: poly,
        page: pageIndex + 1, // 1-indexed
      });
    }
  }
  return summary;
}

/**
 * Converts a cursor-based range selection into a `Summary` object.
 *
 * @param range - A `CursorRange` object specifying the start and end selection.
 * @param di - The document interpretation response containing the text analysis.
 * @returns A `Summary` object representing the selected range.
 *
 * - If the start and end points are the same, or if the start is found but the end is not,
 *   the summary will contain only the single start word.
 */
export function rangeToSummary(
  range: CursorRange,
  di: DocIntResponse
): Summary {
  // page numbers are 1-indexed, so adjust
  const startPage = range.start.page - 1;
  const endPage = range.end.page - 1;

  const startWord = findInPage(
    range.start.point,
    di.analyzeResult.pages[range.start.page - 1]
  ); // as always, page numbers are 1-indexed and need to be adjusted
  if (startWord == null) return {} as Summary;

  // if we just want a single point, return just the start
  if (comparePoints(range.start.point, range.end.point) == 0)
    return createSummary([startPage, startPage], [startWord, startWord], di);

  const endWord = findInPage(
    range.end.point,
    di.analyzeResult.pages[range.end.page - 1]
  ); // as always, page numbers are 1-indexed and need to be adjusted
  // if we can't find the end, return just the start
  if (endWord == null)
    return createSummary([startPage, startPage], [startWord, startWord], di);

  return createSummary([startPage, endPage], [startWord, endWord], di);
}

/**
 * Finds the first occurrence of an excerpt within the document and creates a `Summary` object.
 *
 * @param excerpt - The target text snippet to search for.
 * @param di - The document interpretation response containing the text analysis.
 * @returns A `Summary` object containing the first occurrence of the excerpt.
 *
 * - If the excerpt is not found, an empty `Summary` is returned.
 * - The search considers whitespace-separated words.
 */
export function excerptToSummary(excerpt: string, di: DocIntResponse): Summary {
  if (!excerpt || excerpt == "" || excerpt.length <= 1) return {} as Summary;
  console.log(`excerptToSummary | seeking '${excerpt}'`);

  const excerpts = excerpt.split(/\s+/); // all whitespace characters
  let currentWord = 0;

  for (
    let pageIndex = 0;
    pageIndex < di.analyzeResult.pages.length;
    pageIndex++
  ) {
    const page = di.analyzeResult.pages[pageIndex];

    for (let index = 0; index < page.words.length; index++) {
      // if this matches our current word, we can start looking for the next one
      if (page.words[index].content == excerpts[currentWord]) currentWord++;
      // if it doesn't match, and we thought we had some of our excerpt, reset
      else if (currentWord > 0) currentWord = 0;

      // if we've got the whole excerpt, it's time to make the summary
      if (currentWord == excerpts.length) {
        // if the excerpt uses less words than the current index, it's all on the
        // same page. otherwise, it started on last page (please be true)
        if (index >= excerpts.length - 1)
          return createSummary(
            [pageIndex, pageIndex],
            [index - (excerpts.length - 1), index],
            di
          );
        else {
          const wordsOnPrevPage = excerpts.length - (index + 1);
          const startIndex =
            di.analyzeResult.pages[pageIndex - 1].words.length -
            wordsOnPrevPage;

          return createSummary(
            [pageIndex - 1, pageIndex],
            [startIndex, index],
            di
          );
        }
      }
    }
  }
  return {} as Summary;
}
