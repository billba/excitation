import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

import { stateAtom } from "./State";
import {
  calculateRange,
  calculateSerializedRange,
  compareRanges,
  SerializedRange,
} from "./Range";
import { useAsyncHelper } from "./Hooks";

export function Viewer() {
  const [state, dispatch] = useAtom(stateAtom);
  const {
    ux,
  } = state;
  const { doc, pageNumber, range, selectedCitation } = ux;
  const { pdfUrl } = doc;

  const { isError } = useAsyncHelper();

  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.addEventListener("selectionchange", () => {
      const selection = document.getSelection();
      let range: SerializedRange | undefined;
      if (selection?.rangeCount) {
        const selectionRange = selection.getRangeAt(0);
        console.assert(viewerRef.current != undefined);
        if (!selectionRange.collapsed && viewerRef.current!.contains(selectionRange.commonAncestorContainer)) {
          range = calculateSerializedRange(selectionRange);
        }
      }
      dispatch({
        type: "setSelectedText",
        range,
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

  useEffect(() => {
    if (!range) return;

    console.log("rehydrating text selection", range);

    const selection = document.getSelection()!;
    const currentRange = selection.rangeCount && selection.getRangeAt(0);

    if (currentRange) {
      if (compareRanges(currentRange, range)) return;
      selection.empty();
    }

    const realRange = calculateRange(range);

    if (!realRange) return;

    selection.addRange(realRange);
  }, [renderCounter, range]);

  const [resizeCounter, setResizeCounter] = useState(0); // make highlighting responsive to window resizing
  useEffect(() => {
    window.addEventListener("resize", () => setResizeCounter((c) => c + 1));
  }, [setResizeCounter]);

  const polygons = selectedCitation?.citationHighlights.filter(
    (citationHighlight) => citationHighlight.pageNumber == pageNumber
  )[0]?.polygons;

  useEffect(() => {
    if (!polygons) return;

    const canvas = canvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;

    if (!canvas || !highlightCanvas) return;

    const rect = canvas.getBoundingClientRect();

    const { top, left, width, height } = rect;

    highlightCanvas.style.top = top + window.scrollY + "px";
    highlightCanvas.style.left = left + window.scrollX + "px";
    highlightCanvas.style.width = rect.width + "px";
    highlightCanvas.style.height = rect.height + "px";
    
    highlightCanvas.width = canvas.width;
    highlightCanvas.height = canvas.height;
    
    dispatch({ type: 'setViewerSize', top, left, width, height });
    
    const context = highlightCanvas.getContext("2d")!;
    
    context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    // context.fillStyle = "yellow";
    context.strokeStyle = "blue";
    context.lineWidth = 4;

    const multiplier = 72 * (window.devicePixelRatio || 1);
    const padding = 3;

    for (const polygon of polygons) {
      context.beginPath();
      context.moveTo(polygon[0] * multiplier - padding, polygon[1] * multiplier - padding);
      context.lineTo(polygon[2] * multiplier + padding, polygon[3] * multiplier - padding);
      context.lineTo(polygon[4] * multiplier + padding, polygon[5] * multiplier + padding);
      context.lineTo(polygon[6] * multiplier - padding, polygon[7] * multiplier + padding);
      context.closePath();
      context.stroke();
    }
  }, [
    dispatch,
    canvasRef,
    highlightCanvasRef,
    polygons,
    renderCounter, // the underlying PDF page canvas has changed
    resizeCounter, // the window has resized
  ]);

  return (
    <div ref={viewerRef}>
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          canvasRef={canvasRef}
          pageNumber={pageNumber}
          onRenderSuccess={onRenderSuccess}
        />
      </Document>
      {polygons && (
        <canvas
          ref={highlightCanvasRef}
          id="highlight-canvas"
          style={{
            position: "absolute",
            zIndex: isError ? 1000: 1,
            opacity: 1,
          }}
        />
      )}
    </div>
  );
}
