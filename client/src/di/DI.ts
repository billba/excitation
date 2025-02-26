import {
  Bounds,
  CursorRange,
  DocIntResponse,
  Page,
  Point,
  Polygon4,
  PolygonOnPage,
  Range,
  Summary,
  Word,
} from "./Types";
import {
  comparePointToPolygon,
  comparePoints,
  combinePolygons,
  flattenPolygon4,
  isSameOrAdjacentParagraph,
} from "./Utility";
import { offsetSearch } from "./OffsetSearch";

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
 * Finds the index of the word whose bounding box contains the given point.
 *
 * Iterates through all words on the page and checks whether the specified point
 * is inside the bounding box of any word. If multiple words contain the point,
 * the function returns the first match.
 *
 * @param {Page} page - The page containing words with bounding boxes.
 * @param {Point} point - The point to check for containment within word boundaries.
 * @returns {number | null} The index of the first matching word, or `null` if none is found.
 */
function findContainedWordIndex(page: Page, point: Point): number | null {
  if (!page.words || page.words.length === 0) return null;

  for (let i = 0; i < page.words.length; i++) {
    const word = page.words[i];
    const poly = word.polygon as Polygon4;
    if (comparePointToPolygon(point, poly) === 0) {
      return i;
    }
  }
  return null;
}

/**
 * Calculates the squared distance between a point and the center of a word’s bounding box.
 *
 * @param {Point} point - The reference point.
 * @param {Word} word - The word whose bounding box center is used for distance calculation.
 * @returns {number} The squared distance between the point and the word’s center.
 */
function distanceToWordCenter(point: Point, word: Word): number {
  const poly = word.polygon as Polygon4;
  const left = Math.min(poly[0], poly[6]);
  const right = Math.max(poly[2], poly[4]);
  const top = Math.min(poly[1], poly[3]);
  const bottom = Math.max(poly[5], poly[7]);

  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return dx * dx + dy * dy;
}

/**
 * Finds the index of the word closest to the given point if no bounding box contains it.
 *
 * The function calculates the distance from the given point to the center of each
 * word's bounding box and returns the index of the word with the shortest distance.
 *
 * @param {Page} page - The page containing words with bounding boxes.
 * @param {Point} point - The point to compare against word centers.
 * @returns {number | null} The index of the closest word by center, or `null` if no words exist.
 */
function findNearestWordIndexByCenter(page: Page, point: Point): number | null {
  if (!page.words || page.words.length === 0) return null;

  let bestIndex = 0;
  let bestDistance = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < page.words.length; i++) {
    const dist = distanceToWordCenter(point, page.words[i]);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/**
 * Determines the best word index for a given selection point.
 *
 * The selection process follows these steps:
 * 1) If a word's bounding box contains the point, return its index.
 * 2) Otherwise, return the index of the nearest word by bounding-box center.
 *
 * @param {Page} page - The page containing words with bounding boxes.
 * @param {Point} point - The selection point.
 * @returns {number | null} The index of the best matching word, or `null` if no words are found.
 */
export function findClosestWordIndex(page: Page, point: Point): number | null {
  const contained = findContainedWordIndex(page, point);
  if (contained !== null) return contained;
  return findNearestWordIndexByCenter(page, point);
}

/**
 * Finds the paragraph index that a given word index belongs to.
 *
 * Each region on the page defines a range of word indices that belong to
 * a specific paragraph. This function iterates through the regions and
 * determines which paragraph the given word index falls into.
 *
 * @param {Page} page - The page containing regions with word index ranges.
 * @param {number} wordIndex - The index of the word to locate.
 * @returns {number} The paragraph index the word belongs to, or `-1` if not found.
 */
export function getParagraphIndexForWord(
  page: Page,
  wordIndex: number
): number {
  if (!page.regions) return -1;

  // Each region covers a range of word indices: region.wordIndices = [start, end]
  for (const region of page.regions) {
    const [start, end] = region.wordIndices;
    if (wordIndex >= start && wordIndex <= end) {
      return region.paragraphIndex;
    }
  }
  return -1;
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
  const startPageIdx = range.start.page - 1;
  const endPageIdx = range.end.page - 1;
  if (startPageIdx < 0 || startPageIdx >= di.analyzeResult.pages.length) {
    console.warn("rangeToSummary | invalid start page index");
    return {} as Summary;
  }
  if (endPageIdx < 0 || endPageIdx >= di.analyzeResult.pages.length) {
    console.warn("rangeToSummary | invalid end page index");
    return {} as Summary;
  }

  const startPage = di.analyzeResult.pages[startPageIdx];
  const endPage = di.analyzeResult.pages[endPageIdx];

  // Require that the start point is actually contained within a word.
  const startContained = findContainedWordIndex(startPage, range.start.point);
  if (startContained === null) {
    console.warn("rangeToSummary | start point not contained in any word");
    return {} as Summary;
  }
  const startWordIndex = startContained;

  // If the selection is a single point, return that word.
  if (comparePoints(range.start.point, range.end.point) === 0) {
    return createSummary(
      [startPageIdx, startPageIdx],
      [startWordIndex, startWordIndex],
      di
    );
  }

  // For the end point, try to find a containing word; if not, fall back to the nearest word.
  let endWordIndex = findContainedWordIndex(endPage, range.end.point);
  if (endWordIndex === null) {
    endWordIndex = findClosestWordIndex(endPage, range.end.point);
    if (endWordIndex === null) {
      return createSummary(
        [startPageIdx, startPageIdx],
        [startWordIndex, startWordIndex],
        di
      );
    }
  }

  // If the selection is on a single page, ensure the words belong to the same or an adjacent paragraph.
  if (startPageIdx === endPageIdx) {
    const startParaIdx = getParagraphIndexForWord(startPage, startWordIndex);
    const endParaIdx = getParagraphIndexForWord(startPage, endWordIndex);
    if (!isSameOrAdjacentParagraph(startParaIdx, endParaIdx)) {
      console.warn(
        `Selection crosses paragraphs [${startParaIdx}, ${endParaIdx}] that are not adjacent. Discarding.`
      );
      return {} as Summary;
    }
  }

  return createSummary(
    [startPageIdx, endPageIdx],
    [startWordIndex, endWordIndex],
    di
  );
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

/**
 * Converts a `Summary` object into an array of `Bounds` objects.
 *
 * The `Summary` consists of multiple polygons (`PolygonOnPage`), where each polygon
 * contains a complex shape (`PolygonC`) that may have up to three distinct parts:
 * `head`, `body`, and `tail`. Each part, if present, is represented as a `Polygon4`,
 * which is a simple quadrilateral described by an array of 8 numerical coordinates.
 *
 * @param summary - The `Summary` object containing polygons to convert.
 * @param forceOverlap - (Optional, default: `false`) If `true`, modifies the polygons
 *   to ensure vertical continuity between `head`, `body`, and `tail`.
 * @returns An array of `Bounds` objects, each containing a page number and a flattened `Polygon4`.
 */
export function summaryToBounds(
  summary: Summary,
  forceOverlap: boolean = false
): Bounds[] {
  const bounds: Bounds[] = [];

  summary.polygons.forEach(({ polygon, page }) => {
    const head = polygon.head ? ([...polygon.head] as Polygon4) : null;
    const body = polygon.body ? ([...polygon.body] as Polygon4) : null;
    const tail = polygon.tail ? ([...polygon.tail] as Polygon4) : null;

    if (forceOverlap) {
      // For head: if there is no body but a tail exists, extend the head's bottom edge.
      if (head && !body && tail) {
        const headBottom = Math.max(head[5], head[7]);
        const tailTop = Math.min(tail[1], tail[3]);
        if (headBottom < tailTop) {
          head[5] = tailTop;
          head[7] = tailTop;
        }
      }
      // For body: adjust the top edge to align with head and the bottom edge to align with tail.
      if (body) {
        if (head) {
          const headBottom = Math.max(head[5], head[7]);
          const bodyTop = Math.min(body[1], body[3]);
          if (headBottom < bodyTop) {
            body[1] = headBottom;
            body[3] = headBottom;
          }
        }
        if (tail) {
          const tailTop = Math.min(tail[1], tail[3]);
          const bodyBottom = Math.max(body[5], body[7]);
          if (bodyBottom < tailTop) {
            body[5] = tailTop;
            body[7] = tailTop;
          }
        }
      }
    }

    // Push flattened parts (if valid)
    if (head) {
      const flatHead = flattenPolygon4(head);
      if (flatHead.length === 8) {
        bounds.push({ pageNumber: page, polygon: flatHead });
      }
    }
    if (body) {
      const flatBody = flattenPolygon4(body);
      if (flatBody.length === 8) {
        bounds.push({ pageNumber: page, polygon: flatBody });
      }
    }
    if (tail) {
      const flatTail = flattenPolygon4(tail);
      if (flatTail.length === 8) {
        bounds.push({ pageNumber: page, polygon: flatTail });
      }
    }
  });

  return bounds;
}
