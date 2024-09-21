import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { Document, Page } from "react-pdf";

import {
  questionIndexAtom,
  citationIndexAtom,
  citationsAtom,
  docsAtom,
} from "./State";

export function Viewer() {
  const [docs] = useAtom(docsAtom);
  const [questionIndex] = useAtom(questionIndexAtom);
  const [citationIndex] = useAtom(citationIndexAtom);
  const [citations] = useAtom(citationsAtom);

  const { docIndex, boundingRegions } = citations[questionIndex][citationIndex];
  let pageNumber: number | undefined = undefined;
  if (boundingRegions && boundingRegions.length > 0) {
    pageNumber = boundingRegions[0].pageNumber;
  }

  const doc = docs[docIndex];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderCounter, setRenderCounter] = useState(0); // this is how we make the highlight responsive to page renders

  const onDocumentLoadSuccess = useCallback(() => {}, []);

  const onRenderSuccess = useCallback(() => {
    console.log("onRenderSuccess");
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
  }, []);

  useEffect(() => {
    const highlightCanvas = canvasRef.current!;
    const context = highlightCanvas.getContext("2d")!;

    context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

    if (boundingRegions && boundingRegions.length > 0) {
      for (const { polygon } of boundingRegions) {
        console.log(polygon);
        context.fillStyle = "yellow";
        context.beginPath();
        context.moveTo(polygon[0] * 144, polygon[1] * 144);
        context.lineTo(polygon[2] * 144, polygon[3] * 144);
        context.lineTo(polygon[4] * 144, polygon[5] * 144);
        context.lineTo(polygon[6] * 144, polygon[7] * 144);
        context.closePath();
        context.fill();
      }
    }
  }, [renderCounter, boundingRegions, docIndex, questionIndex, citationIndex]);

  console.log("rendering", doc.filename, pageNumber);

  return (
    <div id="viewer">
      <div id="viewer-header">
        {doc.filename}{" "}
        {pageNumber === undefined
          ? "CITATION NOT FOUND"
          : pageNumber.toString()}
      </div>
      <div>
        <Document file={doc.filename} onLoadSuccess={onDocumentLoadSuccess}>
          {pageNumber && (
            <Page pageNumber={pageNumber} onRenderSuccess={onRenderSuccess} />
          )}
        </Document>
        <canvas
          ref={canvasRef}
          id="highlight-canvas"
          style={{ position: "absolute", zIndex: 1000, opacity: "0.5" }}
        />
      </div>
    </div>
  );
}
