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
 * Searches the document's full content (`di.analyzeResult.content`) for a given `excerpt`.
 *
 * - If found, maps the character offsets to `[pageIndex, wordIndex]` and returns a summarized excerpt.
 * - If not found or if offsets cannot be mapped, returns an empty `Summary`.
 *
 * @param excerpt - The text snippet to search for.
 * @param di - The document interpretation response containing analyzed text.
 * @returns A `Summary` object containing the located excerpt, or an empty `Summary` if not found.
 */
function offsetBasedExcerpt(excerpt: string, di: DocIntResponse): Summary {
  const fullText = di.analyzeResult?.content;
  if (!fullText) return {} as Summary;

  // Locate the excerpt in the full text
  const offset = fullText.indexOf(excerpt);
  if (offset === -1) {
    console.log("offsetBasedExcerpt | excerpt not found in content");
    return {} as Summary;
  }

  // Map start and end positions to word indices
  const startOffset = offset;
  const endOffset = offset + excerpt.length - 1;

  const startLoc = findWordByOffset(startOffset, di);
  if (!startLoc) {
    console.log("offsetBasedExcerpt | could not map start offset to word");
    return {} as Summary;
  }
  const endLoc = findWordByOffset(endOffset, di);
  if (!endLoc) {
    console.log("offsetBasedExcerpt | could not map end offset to word");
    return {} as Summary;
  }

  const [startPage, startWord] = startLoc;
  const [endPage, endWord] = endLoc;
  return createSummary([startPage, endPage], [startWord, endWord], di);
}

/**
 * Maps a character offset within the document's text to a `[pageIndex, wordIndex]` location.
 *
 * - Iterates through document pages and searches for a word containing the given offset.
 * - Returns the first matching `[pageIndex, wordIndex]`, or `null` if no match is found.
 *
 * @param offset - The character offset to map.
 * @param di - The document interpretation response containing analyzed text.
 * @returns A tuple `[pageIndex, wordIndex]` if found, otherwise `null`.
 */
function findWordByOffset(
  offset: number,
  di: DocIntResponse
): [number, number] | null {
  const pages = di.analyzeResult.pages ?? [];
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    if (!page.words || page.words.length === 0) continue;

    const match = offsetSearch(page.words, [offset, offset]);
    if (match) {
      return [pageIndex, match[0]];
    }
  }
  return null;
}

/**
 * Searches for an excerpt by splitting it into individual words and scanning the document.
 *
 * - Matches the excerpt sequentially across pages and words.
 * - If found, maps its position to `[pageIndex, wordIndex]` and returns a `Summary`.
 * - If the excerpt is not found, returns an empty `Summary`.
 *
 * @param excerpt - The text snippet to search for.
 * @param di - The document interpretation response containing analyzed text.
 * @returns A `Summary` object containing the located excerpt, or an empty `Summary` if not found.
 */
function wordSplitExcerpt(excerpt: string, di: DocIntResponse): Summary {
  const excerpts = excerpt.split(/\s+/); // whitespace
  let currentWord = 0;

  for (
    let pageIndex = 0;
    pageIndex < di.analyzeResult.pages.length;
    pageIndex++
  ) {
    const page = di.analyzeResult.pages[pageIndex];
    if (!page.words) continue;

    for (let wordIndex = 0; wordIndex < page.words.length; wordIndex++) {
      if (page.words[wordIndex].content === excerpts[currentWord]) {
        currentWord++;
      } else if (currentWord > 0) {
        // Reset progress on mismatch
        currentWord = 0;
      }

      // If the entire excerpt has been matched
      if (currentWord === excerpts.length) {
        const offsetCount = excerpts.length - 1;
        if (wordIndex >= offsetCount) {
          // Entire excerpt found within a single page
          return createSummary(
            [pageIndex, pageIndex],
            [wordIndex - offsetCount, wordIndex],
            di
          );
        } else {
          // Excerpt might have started on the previous page
          const prevPage = pageIndex - 1;
          if (prevPage < 0) return {} as Summary; // Invalid case

          const wordsOnPrevPage = excerpts.length - (wordIndex + 1);
          const startIndex =
            di.analyzeResult.pages[prevPage].words.length - wordsOnPrevPage;
          return createSummary(
            [prevPage, pageIndex],
            [startIndex, wordIndex],
            di
          );
        }
      }
    }
  }
  return {} as Summary;
}

/**
 * Finds the first occurrence of an excerpt within the document and creates a `Summary` object.
 *
 * - First attempts an offset-based search (`offsetBasedExcerpt`).
 * - If unsuccessful, falls back to a word-based search (`wordSplitExcerpt`).
 * - The search considers whitespace-separated words.
 *
 * @param excerpt - The text snippet to search for.
 * @param di - The document interpretation response containing analyzed text.
 * @returns A `Summary` object containing the first occurrence of the excerpt, or an empty `Summary` if not found.
 */
export function excerptToSummary(excerpt: string, di: DocIntResponse): Summary {
  if (!excerpt || excerpt.trim().length < 2) return {} as Summary;

  console.log(`excerptToSummary | seeking '${excerpt}'`);

  // Attempt offset-based search
  if (di.analyzeResult?.content) {
    const offsetSummary = offsetBasedExcerpt(excerpt, di);
    if (offsetSummary.excerpt) {
      return offsetSummary;
    }
    console.log(
      "excerptToSummary | offset-based approach did not find excerpt. Falling back..."
    );
  } else {
    console.log(
      "excerptToSummary | no overall content. Using word-splitting approach."
    );
  }

  // Fallback to word-based search
  return wordSplitExcerpt(excerpt, di);
}
