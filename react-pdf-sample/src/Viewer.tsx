import { useAtomValue, useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

import {
  docs,
  citationsAtom,
  uxAtom,
} from "./State";

const pageMax = 3;
const pages = Array.from({ length: pageMax }, (_, i) => i);

export function Viewer() {
  const citations = useAtomValue(citationsAtom);
  const [ux, dispatch] = useAtom(uxAtom);

  const { questionIndex, explore } = ux;

  const viewerDocIndex = explore
    ? ux.docIndex
    : citations[questionIndex][ux.citationIndex].docIndex;
  const { filename } = docs[viewerDocIndex];
  const viewerPageNumbers = explore
    ? [ux.pageNumber]
    : ux.citationHighlights.map(({ pageNumber }) => pageNumber);

  console.assert(
    viewerPageNumbers.length < pageMax,
    "Too many pages in the highlight"
  );

  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.addEventListener("selectionchange", () => {
      const selection = document.getSelection();
      const ancestor = selection?.rangeCount && selection?.getRangeAt(0).commonAncestorContainer;
      dispatch({
        type: "setSelectedText",
        selectedText:
          ancestor && viewerRef.current!.contains(ancestor)
            ? selection.toString()
            : "",
      });
    });
  }, [dispatch]);

  // We bend the rules of hooks here a bit in order to display multiple pages.
  // We call useRef inside loops, but it's okay because we always call it the same number of times.

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const canvasRefs = pages.map(() => useRef<HTMLCanvasElement>(null));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const highlightCanvasRefs = pages.map(() => useRef<HTMLCanvasElement>(null));

  const onDocumentLoadSuccess = useCallback(() => {}, []);

  const [renderCounter, setRenderCounter] = useState(0); // make highlighting responsive to page rendering
  const onRenderSuccess = useCallback(
    () => setRenderCounter((c) => c + 1),
    [setRenderCounter]
  );

  const [resizeCounter, setResizeCounter] = useState(0); // make highlighting responsive to window resizing
  useEffect(() => {
    window.addEventListener("resize", () => setResizeCounter((c) => c + 1));
  }, [setResizeCounter]);

  // For multiple pages, the canvases keep moving around. We don't really know when we're done rendering pages,
  // so we just resort to resizing, clearing, and rendering all the highlight canvases every time any page rerenders.
  // Sorry for burning a little more electricity than is probably necessary.

  useEffect(() => {
    if (ux.explore) return;

    ux.citationHighlights.forEach((citationHighlight, page) => {
      const canvas = canvasRefs[page].current;
      const highlightCanvas = highlightCanvasRefs[page].current;

      if (!canvas || !highlightCanvas) return;

      const rect = canvas.getBoundingClientRect();

      highlightCanvas.style.top = rect.top + window.scrollY + "px";
      highlightCanvas.style.left = rect.left + window.scrollX + "px";
      highlightCanvas.style.width = rect.width + "px";
      highlightCanvas.style.height = rect.height + "px";

      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;

      const context = highlightCanvas.getContext("2d")!;

      context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
      context.fillStyle = "yellow";

      for (const polygon of citationHighlight.polygons) {
        context.beginPath();
        context.moveTo(polygon[0] * 144, polygon[1] * 144);
        context.lineTo(polygon[2] * 144, polygon[3] * 144);
        context.lineTo(polygon[4] * 144, polygon[5] * 144);
        context.lineTo(polygon[6] * 144, polygon[7] * 144);
        context.closePath();
        context.fill();
      }
    });
  }, [
    canvasRefs,
    highlightCanvasRefs,
    ux,
    renderCounter, // the underlying PDF page canvas has changed
    resizeCounter, // the window has resized
  ]);

  return (
    <div ref={viewerRef}>
      <Document file={filename} onLoadSuccess={onDocumentLoadSuccess}>
        {viewerPageNumbers.map((pageNumber, page) => (
          <Page
            key={page}
            canvasRef={canvasRefs[page]}
            pageNumber={pageNumber}
            onRenderSuccess={onRenderSuccess}
          />
        ))}
      </Document>
      {!explore &&
        viewerPageNumbers.map((_, page) => (
          <canvas
            key={page}
            ref={highlightCanvasRefs[page]}
            id="highlight-canvas"
            style={{
              position: "absolute",
              zIndex: 1000,
              opacity: 0.5,
            }}
          />
        ))}
    </div>
  );
}
