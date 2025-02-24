import {
  DocIntResponse,
  Line,
  Paragraph,
  Polygon4,
  Range,
  Region,
} from "./Types";
import { combinePolygons4 } from "./Utility";

/**
 * Computes the character offset range for a given paragraph.
 *
 * This function iterates over the spans of the paragraph to determine the
 * minimum and maximum character offsets, effectively defining the paragraph's
 * position within the document's content.
 *
 * Edge cases:
 * - If the paragraph has no spans, returns `[-1, -1]`.
 *
 * @param paragraph - The paragraph for which to compute the offset range.
 * @returns A tuple `[minOffset, maxOffset]` representing the start and end
 *          character positions of the paragraph in the document.
 */
function getParagraphOffsetRange(paragraph: Paragraph): [number, number] {
  let minOffset = Number.MAX_SAFE_INTEGER;
  let maxOffset = -1;

  for (const sp of paragraph.spans) {
    if (sp.offset < minOffset) {
      minOffset = sp.offset;
    }
    const end = sp.offset + sp.length - 1;
    if (end > maxOffset) {
      maxOffset = end;
    }
  }

  // Handle paragraphs with no spans
  if (minOffset === Number.MAX_SAFE_INTEGER) {
    minOffset = -1;
    maxOffset = -1;
  }

  return [minOffset, maxOffset];
}

/**
 * Computes the character offset range for a given document line.
 *
 * This function determines the minimum and maximum character offsets
 * by iterating over the spans of the line, defining its position within
 * the document's content.
 *
 * Edge cases:
 * - If the line has no spans, returns `[-1, -1]`.
 *
 * @param line - The line for which to compute the offset range.
 * @returns A tuple `[minOffset, maxOffset]` representing the start and end
 *          character positions of the line in the document.
 */
function getLineOffsetRange(line: Line): [number, number] {
  let minOffset = Number.MAX_SAFE_INTEGER;
  let maxOffset = -1;

  for (const sp of line.spans) {
    if (sp.offset < minOffset) {
      minOffset = sp.offset;
    }
    const end = sp.offset + sp.length - 1;
    if (end > maxOffset) {
      maxOffset = end;
    }
  }

  // Handle lines with no spans
  if (minOffset === Number.MAX_SAFE_INTEGER) {
    minOffset = -1;
    maxOffset = -1;
  }

  return [minOffset, maxOffset];
}

/**
 * Creates a list of `Region` objects for each page in the document,
 * grouping content based on paragraph bounding regions rather than line adjacency.
 *
 * This function processes the document’s paragraphs and associates them with
 * their respective pages. Each paragraph is analyzed to compute its bounding
 * polygon, character offset range, and word index range. The resulting regions
 * provide a structured representation of paragraph-based segmentation.
 *
 * @param di - The Document Intelligence response containing analyzed paragraphs and pages.
 */
export function createPerPageRegions(di: DocIntResponse) {
  const paragraphs = di.analyzeResult.paragraphs ?? [];
  const pages = di.analyzeResult.pages ?? [];

  for (const page of pages) {
    const pageNumber = page.pageNumber;
    const lines = page.lines ?? [];
    const words = page.words ?? [];

    // Build up an array of Region objects
    const regions: Region[] = [];

    // Create an array of [paragraph, globalIndex]
    const paragraphPairs = paragraphs.map(
      (paragraph, i) => [paragraph, i] as const
    );

    // Filter paragraphs that mention this page
    const paragraphsInThisPage = paragraphPairs.filter(
      ([{ boundingRegions }]) => boundingRegions.some((br) => br.pageNumber === pageNumber)
    );

    // For each paragraph on this page, compute its region
    for (const [paragraph, paragraphIndex] of paragraphsInThisPage) {
      // Merge bounding polygons relevant to this page
      const pagePolygons = paragraph.boundingRegions
        .filter((br) => br.pageNumber === pageNumber)
        .map((br) => br.polygon as Polygon4);

      const paragraphPolygon = combinePolygons4(pagePolygons);

      // Determine paragraph offset range
      const [paraStartOffset, paraEndOffset] =
        getParagraphOffsetRange(paragraph);

      // Identify which lines overlap this paragraph’s offset range
      const includedLineIndices: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        const [lineStart, lineEnd] = getLineOffsetRange(lines[i]);
        if (
          lineStart !== -1 &&
          lineEnd !== -1 &&
          // If line and paragraph overlap in offset space
          paraEndOffset >= lineStart &&
          lineEnd >= paraStartOffset
        ) {
          includedLineIndices.push(i);
        }
      }

      // Convert that array to [startLineIndex, endLineIndex]
      let lineRange: Range = [-1, -1];
      if (includedLineIndices.length > 0) {
        lineRange = [
          includedLineIndices[0],
          includedLineIndices[includedLineIndices.length - 1],
        ];
      }

      // Compute [startWordIndex, endWordIndex] by offset-intersecting
      // each word with the paragraph range & included lines
      let minWordIndex = Number.MAX_SAFE_INTEGER;
      let maxWordIndex = -1;

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const wStart = word.span.offset;
        const wEnd = wStart + word.span.length - 1;

        // Must intersect paragraph offset range
        if (paraEndOffset >= wStart && wEnd >= paraStartOffset) {
          for (const lineIndex of includedLineIndices) {
            const [lStart, lEnd] = getLineOffsetRange(lines[lineIndex]);
            if (
              lStart !== -1 &&
              lEnd !== -1 &&
              lEnd >= wStart &&
              wEnd >= lStart
            ) {
              // Found a match => update min/max
              if (w < minWordIndex) minWordIndex = w;
              if (w > maxWordIndex) maxWordIndex = w;
              break; // No need to check more lines
            }
          }
        }
      }

      let wordRange: Range = [-1, -1];
      if (maxWordIndex !== -1 && minWordIndex !== Number.MAX_SAFE_INTEGER) {
        wordRange = [minWordIndex, maxWordIndex];
      }

      // Add the Region
      regions.push({
        polygon: paragraphPolygon,
        lineIndices: lineRange,
        wordIndices: wordRange,
        paragraphIndex,
      });
    }

    // Assign to page
    page.regions = regions;
  }
}
