import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { Document, Page } from "react-pdf";

import {
  questionIndexAtom,
  citationIndexAtom,
  citationsAtom,
  docsAtom,
  pageNumbersAtom,
  highlightsForPageAtom,
} from "./State";

const pageMax = 3;
const pages = Array.from({ length: pageMax }, (e, i) => i);

export function Viewer() {
  const [docs] = useAtom(docsAtom);
  const [questionIndex] = useAtom(questionIndexAtom);
  const [citationIndex] = useAtom(citationIndexAtom);
  const [citations] = useAtom(citationsAtom);
  const [pageNumbers] = useAtom(pageNumbersAtom);
  const [highlightsForPage] = useAtom(highlightsForPageAtom);

  const { docIndex } = citations[questionIndex][citationIndex];
  const { filename } = docs[docIndex];

  console.assert(
    pageNumbers.length < pageMax,
    "Too many pages in the highlight"
  );

  // We bend the rules of hooks here a bit in order to display multiple pages.
  // We call useRef, useState, useCallback, and useEffect inside loops.
  // But it's okay because we always call them the same number of times.

  // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-unused-vars
  const canvasRefs = pages.map((_) => useRef<HTMLCanvasElement>(null));
  // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-unused-vars
  const renderCounters = pages.map((_) => useState(0)); // this is how we make highlighting responsive to page rendering

  const onDocumentLoadSuccess = useCallback(() => {}, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onRenders = renderCounters.map(([_, setRenderCounter], page) => {
    const canvasRef = canvasRefs[page];

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(() => {
      console.log("onRenderSuccess", page);
      const canvas = document.getElementsByClassName(
        "react-pdf__Page__canvas"
      )[0] as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const highlightCanvas = canvasRef.current!;

      highlightCanvas.style.top = rect.top.toString() + "px";
      highlightCanvas.style.left = rect.left.toString() + "px";
      highlightCanvas.style.width = rect.width.toString() + "px";
      highlightCanvas.style.height = rect.height.toString() + "px";

      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;
      setRenderCounter((c) => c + 1);
    }, [page, canvasRef, setRenderCounter]);
  });

  for (const page of pages) {
    const [renderCounter] = renderCounters[page];
    const canvasRef = canvasRefs[page];
    const highlights = highlightsForPage[page];

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      console.log("useEffect for highlighting", page);

      if (!highlights) return;

      const { polygons } = highlights;
      const highlightCanvas = canvasRef.current!;
      const context = highlightCanvas.getContext("2d")!;

      context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
      context.fillStyle = "yellow";

      for (const polygon of polygons) {
        context.beginPath();
        context.moveTo(polygon[0] * 144, polygon[1] * 144);
        context.lineTo(polygon[2] * 144, polygon[3] * 144);
        context.lineTo(polygon[4] * 144, polygon[5] * 144);
        context.lineTo(polygon[6] * 144, polygon[7] * 144);
        context.closePath();
        context.fill();
      }
    }, [
      page,
      canvasRef,
      renderCounter,
      highlights,
      docIndex,
      questionIndex,
      citationIndex,
    ]);
  }

  return (
    <div id="viewer">
      <div id="viewer-header">{filename} </div>
      <div>
        <Document file={filename} onLoadSuccess={onDocumentLoadSuccess}>
          {pageNumbers.map((pageNumber, page) => (
            <Page pageNumber={pageNumber} onRenderSuccess={onRenders[page]} />
          ))}
        </Document>
        {pageNumbers.map((_, page) => (
          <canvas
            ref={canvasRefs[page]}
            id="highlight-canvas"
            style={{ position: "absolute", zIndex: 1000, opacity: "0.5" }}
          />
        ))}
      </div>
    </div>
  );
}
