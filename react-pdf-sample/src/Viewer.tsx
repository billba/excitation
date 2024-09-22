import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { Document, Page } from "react-pdf";

import {
  currentCitationAtom,
  docsAtom,
  pageNumbersAtom,
  highlightsForPageAtom,
} from "./State";

const pageMax = 3;
const pages = Array.from({ length: pageMax }, (_, i) => i);

export function Viewer() {
  const [docs] = useAtom(docsAtom);
  const [citation] = useAtom(currentCitationAtom);
  const [pageNumbers] = useAtom(pageNumbersAtom);
  const [highlightsForPage] = useAtom(highlightsForPageAtom);

  const { docIndex } = citation;
  const { filename } = docs[docIndex];

  console.assert(
    pageNumbers.length < pageMax,
    "Too many pages in the highlight"
  );

  // We bend the rules of hooks here a bit in order to display multiple pages.
  // We call useRef inside loops, but it's okay because we always call it the same number of times.

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const canvasRefs = pages.map(() => useRef<HTMLCanvasElement>(null));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const highlightCanvasRefs = pages.map(() => useRef<HTMLCanvasElement>(null));

  const [renderCounter, setRenderCounter] = useState(0); // this is how we make highlighting responsive to page rendering

  const onDocumentLoadSuccess = useCallback(() => {}, []);

  const onRenderSuccess = useCallback(
    (page: number) => () => {
      console.log("onRenderSuccess for page", page);
      setRenderCounter((c) => c + 1);
    },
    [setRenderCounter]
  );

  // For multiple pages, the canvases keep moving around. We don't really know when we're done rendering pages,
  // so we just resort to resizing, clearing, and rendering all the highlight canvases every time any page rerenders.
  // Sorry for burning a little more electricity than is probably necessary.
  useEffect(() => {
    console.log("useEffect");
    for (const page of pages) {
      const canvas = canvasRefs[page].current;
      const highlightCanvas = highlightCanvasRefs[page].current;
      const highlights = highlightsForPage[page];
      
      if (!canvas || !highlightCanvas || !highlights) return;

      const rect = canvas.getBoundingClientRect();
      console.log(rect);

      highlightCanvas.style.top = rect.top + "px";
      highlightCanvas.style.left = rect.left + "px";
      highlightCanvas.style.width = rect.width + "px";
      highlightCanvas.style.height = rect.height + "px";

      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;

      const context = highlightCanvas.getContext("2d")!;

      context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
      context.fillStyle = "yellow";

      for (const polygon of highlights.polygons) {
        context.beginPath();
        context.moveTo(polygon[0] * 144, polygon[1] * 144);
        context.lineTo(polygon[2] * 144, polygon[3] * 144);
        context.lineTo(polygon[4] * 144, polygon[5] * 144);
        context.lineTo(polygon[6] * 144, polygon[7] * 144);
        context.closePath();
        context.fill();
      }
    }
  }, [canvasRefs, highlightCanvasRefs, renderCounter, highlightsForPage, docIndex]);

  console.log("rendering", filename, pageNumbers);

  return (
    <div id="viewer">
      <div id="viewer-header">
        <b>{filename}</b>
        &nbsp;
        {pageNumbers.length === 1
          ? `page ${pageNumbers[0]}`
          : `pages ${pageNumbers[0]} - ${
              pageNumbers[pageNumbers.length - 1]
            }`}{" "}
      </div>
      <div>
        <Document file={filename} onLoadSuccess={onDocumentLoadSuccess}>
          {pageNumbers.map((pageNumber, page) => (
            <Page
              key={page}
              canvasRef={canvasRefs[page]}
              pageNumber={pageNumber}
              onRenderSuccess={onRenderSuccess(page)}
            />
          ))}
        </Document>
        {pageNumbers.map((_, page) => (
          <canvas
            key={page}
            ref={highlightCanvasRefs[page]}
            id="highlight-canvas"
            style={{ position: "absolute", zIndex: 1000, opacity: "0.5" }}
          />
        ))}
      </div>
    </div>
  );
}
