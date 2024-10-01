import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

import {
  docs,
  uxAtom,
} from "./State";

export function Viewer() {
  const [ux, dispatch] = useAtom(uxAtom);

  const { newCitation, docIndex, pageNumber } = ux;

  const { filename } = docs[docIndex];

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);

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
    if (ux.newCitation || ux.citationIndex == undefined || ux.citationHighlights.length == 0) return;

    const { polygons } = ux.citationHighlights.filter(({ pageNumber }) => pageNumber == ux.pageNumber)[0];

    const canvas = canvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;

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

    const multiplier = 72 * (window.devicePixelRatio || 1);

    for (const polygon of polygons) {
      context.beginPath();
      context.moveTo(polygon[0] * multiplier, polygon[1] * multiplier);
      context.lineTo(polygon[2] * multiplier, polygon[3] * multiplier);
      context.lineTo(polygon[4] * multiplier, polygon[5] * multiplier);
      context.lineTo(polygon[6] * multiplier, polygon[7] * multiplier);
      context.closePath();
      context.fill();
    }
  }, [
    canvasRef,
    highlightCanvasRef,
    ux,
    renderCounter, // the underlying PDF page canvas has changed
    resizeCounter, // the window has resized
  ]);

  return (
    <div ref={viewerRef}>
      <Document file={filename} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          canvasRef={canvasRef}
          pageNumber={pageNumber}
          onRenderSuccess={onRenderSuccess}
        />
      </Document>
      {!newCitation && ux.citationIndex != undefined && ux.citationHighlights.length &&
        <canvas
          ref={highlightCanvasRef}
          id="highlight-canvas"
          style={{
            position: "absolute",
            zIndex: 1000,
            opacity: 0.5,
          }}
        />
        }
    </div>
  );
}
