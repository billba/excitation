import { DocIntResponse, Page, Polygon4, Region } from "./Types"
import { adjacent, combinePolygons4 } from "./Utility"

// returns a number that models the spacing of the document (scale of 0-1?)
export function setDocumentDelta(
  di: DocIntResponse
): number {
  return 0.2;
}

function createPerPageRegions(
  page: Page,
  delta: number
): Region[] {
  const lines = page.lines;
  let regions = [] as Region[];
  if (lines.length == 0) return regions;

  let startLine = 0;
  let startWord = 0;
  let wordIndex = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    wordIndex += lines[lineIndex].content.split(' ').length - 1;
    // if this is the end of the page, OR
    // the next polygon is non-adjacent
    if (lineIndex == lines.length - 1 ||
        !adjacent(lines[lineIndex].polygon as Polygon4, lines[lineIndex + 1].polygon as Polygon4, delta)) {
      // let's wrap up the current section
      let polygon = combinePolygons4(lines.slice(startLine, lineIndex + 1).map((line) => line.polygon as Polygon4));
      regions.push({
        lineIndices: [startLine, lineIndex],
        wordIndices: [startWord, wordIndex],
        polygon: polygon
      });

      startLine = lineIndex + 1;
      startWord = wordIndex + 1;
    }
  }
  return regions;
}
// in place change to di, adds a `Region[]` field to each page
export function createRegions(
  di: DocIntResponse
) {
  if (!di.analyzeResult.delta) di.analyzeResult.delta = setDocumentDelta(di);

  for (let index = 0; index < di.analyzeResult.pages.length; index++)
    di.analyzeResult.pages[index].regions = createPerPageRegions(di.analyzeResult.pages[index], di.analyzeResult.delta);
}