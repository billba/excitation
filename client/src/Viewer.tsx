import { useCallback, useEffect, useRef } from "react";
import { Document, Page } from "react-pdf";
import {
  CheckmarkCircleFilled,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";

import { docFromId, useAppState } from "./State";
import {
  calculateRange,
  calculateSerializedRange,
  compareRanges,
  SerializedRange,
} from "./Range";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import { useHoverableIcon } from "./Hooks.tsx";
import { Review } from "./Types";

const colors = ["#00acdc", "#00ac00", "#f07070"];

export function Viewer() {
  const [{ ux, viewer, questions }, dispatch] = useAppState();

  const { documentId, questionIndex } = ux;
  const editing = ux.selectedCitation?.editing;

  const { isError } = useAsyncHelper();
  const { dispatchUnlessAsyncing } = useDispatchHandler();

  const viewerRef = useRef<HTMLDivElement>(null);

  const selectionChange = useCallback(() => {
    const selection = document.getSelection();
    let range: SerializedRange | undefined;
    if (selection?.rangeCount) {
      const selectionRange = selection.getRangeAt(0);
      console.assert(viewerRef.current != undefined);
      if (
        !selectionRange.collapsed &&
        viewerRef.current!.contains(selectionRange.commonAncestorContainer)
      ) {
        range = calculateSerializedRange(selectionRange);
      }
    }
    dispatch({
      type: "setSelectedText",
      range,
    });
  }, [dispatch]);

  useEffect(() => {
    if (editing) return;

    document.addEventListener("selectionchange", selectionChange);

    return () => {
      document.removeEventListener("selectionchange", selectionChange);
    };
  }, [selectionChange, editing]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDocumentLoadSuccess = useCallback(() => {}, []);

  const updateViewerSize = useCallback(() => {
    if (!canvasRef.current) return;

    const { top, left, width, height } =
      canvasRef.current.getBoundingClientRect();
    dispatch({ type: "setViewerSize", top, left, width, height });
  }, [dispatch]);

  useEffect(
    () => window.addEventListener("resize", updateViewerSize),
    [updateViewerSize]
  );

  const range = documentId == undefined ? undefined : ux.range;

  useEffect(() => {
    if (!range) return;

    const selection = document.getSelection()!;
    const currentRange = selection.rangeCount && selection.getRangeAt(0);

    if (currentRange) {
      if (compareRanges(currentRange, range)) return;
      selection.empty();
    }

    const realRange = calculateRange(range);

    if (!realRange) return;

    selection.addRange(realRange);
  }, [range]);

  const citation = ux.selectedCitation
    ? questions[questionIndex].citations[ux.selectedCitation.citationIndex]
    : undefined;

  const polygons = ux.selectedCitation?.citationHighlights.filter(
    (citationHighlight) => citationHighlight.pageNumber == ux.pageNumber
  )[0]?.polygons;

  const review = citation?.review;
  const color = colors[review || 0];

  const multiple = 72;
  const padding = 3;

  const citationIndex = ux.selectedCitation?.citationIndex;

  const Approved = useHoverableIcon(
    CheckmarkCircleFilled,
    CheckmarkCircleRegular,
    "approve",
    "approved on",
    citationIndex
      ? dispatchUnlessAsyncing({
          type: "reviewCitation",
          review: Review.Unreviewed,
          citationIndex,
        })
      : undefined
  );

  return (
    <div ref={viewerRef}>
      {documentId == undefined ? (
        <div>
          <p>You can select a document in the sidebar.</p>
        </div>
      ) : ux.pageNumber == undefined ? (
        <div>
          <p>
            The selected citation could not be found on the document. You may
            explore this document using the page navigation above.
          </p>
        </div>
      ) : (
        <Document
          file={docFromId[documentId].pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page
            canvasRef={canvasRef}
            pageNumber={ux.pageNumber}
            onRenderSuccess={updateViewerSize}
          />
        </Document>
      )}
      {polygons && (
        <div
          className="viewer-citations"
          style={{
            ... viewer,
            position: "absolute",
            zIndex: isError ? 1000 : 1,
          }}
        >
          {polygons.map((polygon, i) => (
            <div
              key={i}
              className="viewer-citation-highlight"
              style={{
                position: "absolute",
                color,
                top: polygon[1] * multiple - padding,
                left: polygon[0] * multiple - padding,
                width: (polygon[4] - polygon[0]) * multiple + padding,
                minHeight: (polygon[5] - polygon[1]) * multiple + padding,
              }}
            >
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
