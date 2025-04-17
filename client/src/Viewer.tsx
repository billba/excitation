import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page } from "react-pdf";
import { TextContent } from "pdfjs-dist/types/src/display/api";
import polygonClipping from "polygon-clipping";
import { CursorRange, Point } from "./di";

import {
  CheckmarkCircleFilled,
  CheckmarkCircleRegular,
  DismissCircleFilled,
  DismissCircleRegular,
  MoreCircleRegular,
  MoreCircleFilled,
} from "@fluentui/react-icons";

import { useDocFromId, useAppState, useAppStateValue } from "./State";
import {
  calculateRange,
  calculateSerializedRange,
  compareRanges,
  SerializedRange,
} from "./Range";
import { useDispatchHandler } from "./Hooks";
import { HoverableIcon } from "./Hooks.tsx";
import { LoadedState, Review, ApplicationMode } from "./Types";
import { getDocumentId, getPageNumber } from "./StateUtils";

const colors = ["#00acdc", "#00ac00", "#f07070"];
const multiple = 72;

// this type is defined deep in react-pdf and I can't figure out how to import it
// so here I just define the parts I need
interface PageCallback {
  height: number;
  width: number;
}

export function Viewer() {
  const [state, dispatch] = useAppState();
  const { ux } = state as LoadedState;
  const documentId = getDocumentId(ux);
  const pageNumber = getPageNumber(ux);
  const docFromId = useDocFromId();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [cursorStart, setCursorStart] = useState<Point | null>(null);

  useEffect(() => {
    const viewerElem = viewerRef.current;
    if (!viewerElem) return;

    // Helper to check if the event target is inside a citation control element.
    const isCitationControl = (e: Event) => {
      return (e.target as HTMLElement).closest(".citation-control");
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If not in SelectingNewCitation mode, do nothing
      if (ux.mode !== ApplicationMode.SelectingNewCitation) {
        return;
      }

      // If the event target is part of a citation control, do nothing.
      if (isCitationControl(e)) return;

      // Otherwise, handle the event as before.
      const rect = viewerElem.getBoundingClientRect();
      const startPoint: Point = {
        x: (e.clientX - rect.left) / multiple,
        y: (e.clientY - rect.top) / multiple,
      };
      setCursorStart(startPoint);
    };

    const handleMouseUp = (e: MouseEvent) => {
      // If not in SelectingNewCitation mode, do nothing
      if (ux.mode !== ApplicationMode.SelectingNewCitation) {
        return;
      }

      // If the event target is part of a citation control, ignore it.
      if (isCitationControl(e)) return;
      if (!cursorStart || ux.pageNumber === undefined) return;
      const rect = viewerElem.getBoundingClientRect();
      const endPoint: Point = {
        x: (e.clientX - rect.left) / multiple,
        y: (e.clientY - rect.top) / multiple,
      };

      // Build a CursorRange from the captured points.
      const cursorRange: CursorRange = {
        start: { page: ux.pageNumber, point: cursorStart },
        end: { page: ux.pageNumber, point: endPoint },
      };

      // Dispatch the action to store the new cursorRange.
      dispatch({ type: "setCursorRange", cursorRange });
    };

    viewerElem.addEventListener("mousedown", handleMouseDown);
    viewerElem.addEventListener("mouseup", handleMouseUp);

    return () => {
      viewerElem.removeEventListener("mousedown", handleMouseDown);
      viewerElem.removeEventListener("mouseup", handleMouseUp);
    };
  }, [cursorStart, pageNumber, ux.mode, dispatch]);

  const selectionChange = useCallback(() => {
    // Only process selection changes when in SelectingNewCitation mode
    if (ux.mode !== ApplicationMode.SelectingNewCitation) {
      return;
    }

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
  }, [dispatch, ux.mode]);

  useEffect(() => {
    // Don't listen for selection changes when not in SelectingNewCitation mode
    if (ux.mode !== ApplicationMode.SelectingNewCitation) return;

    document.addEventListener("selectionchange", selectionChange);

    return () => {
      document.removeEventListener("selectionchange", selectionChange);
    };
  }, [selectionChange, ux.mode]);

  const onDocumentLoadSuccess = useCallback(() => { }, []);

  const onTextLayerRender = useCallback(
    (text: TextContent) => {
      dispatch({
        type: "emptyTextLayer",
        isTextLayerEmpty: text.items.length == 0,
      });
    },
    [dispatch]
  );

  const updateViewerSize = useCallback(
    ({ height, width }: PageCallback) => {
      dispatch({
        type: "setViewerSize",
        width,
        height,
      });
    },
    [dispatch]
  );

  // Safely access range property only when in SelectingNewCitation mode
  const range = documentId == undefined ? undefined :
    (ux.mode === ApplicationMode.SelectingNewCitation) ? ux.range : undefined;

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

  if (documentId !== undefined)
    console.log("pdf", docFromId[documentId].pdfUrl);

  return (
    <div ref={viewerRef} id="viewer-viewport">
      {documentId == undefined ? (
        <div>
          <p>You can select a document in the sidebar.</p>
        </div>
      ) : pageNumber == undefined ? (
        <div>
          <p>
            The selected citation could not be found on the document. You may
            explore this document using the page navigation above.
          </p>
        </div>
      ) : (
        <>
          <Document
            file={docFromId[documentId].pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page
              pageNumber={pageNumber}
              onRenderSuccess={updateViewerSize}
              className="viewer-page"
              renderAnnotationLayer={false}
              onGetTextSuccess={onTextLayerRender}
            />
          </Document>
          {ux.mode === ApplicationMode.ViewingCitation && <ViewerCitations />}
        </>
      )}
    </div>
  );
}

const ViewerCitations = () => {
  const { dispatchUnlessAsyncing } = useDispatchHandler();
  const { ux, questions, viewer } = useAppStateValue() as LoadedState;
  const { questionIndex } = ux;

  // In ViewingCitation mode, these properties are directly on the ux object
  if (ux.mode !== ApplicationMode.ViewingCitation) return null;

  // We only access these properties after confirming we're in ViewingCitation mode
  const { citationIndex, citationHighlights, pageNumber } = ux;

  const citation = questions[questionIndex].citations[citationIndex];
  const { review } = citation;
  const color = colors[review || 0];

  // Get the highlight for current page - use strict equality for comparing page numbers
  const highlightForCurrentPage = citationHighlights.find(
    (citationHighlight) => citationHighlight.pageNumber === pageNumber
  );

  // Get the polygons for highlighting
  const polygons = highlightForCurrentPage?.polygons;

  if (!polygons || polygons.length === 0) return;

  // Prepare SVG highlighting and floater positioning
  let highlightSvg = null;
  let top = 20;
  let left = 20;
  let width = 160;
  let height = 32;

  const rectsForUnion: [number, number][][][] = polygons.map((poly) => {
    const x1 = poly[0];
    const y1 = poly[1];
    const x2 = poly[4];
    const y2 = poly[5];
    return [
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
    ];
  });
  const unioned = polygonClipping.union(rectsForUnion);
  const ringToPath = (ring: number[][]) => {
    return (
      ring
        .map(
          (coords, i) =>
            `${i === 0 ? "M" : "L"} ${coords[0] * multiple},${coords[1] * multiple
            }`
        )
        .join(" ") + " Z"
    );
  };
  const allPaths: string[] = [];
  unioned.forEach((polygon) => {
    polygon.forEach((ring) => {
      allPaths.push(ringToPath(ring));
    });
  });

  highlightSvg = (
    <svg
      className="highlight-svg"
      style={{
        width: viewer.width,
        height: viewer.height,
      }}
      data-citation-index={citationIndex}
    >
      <g className="citation-group">
        {/* First render all the fill areas that capture hover events */}
        {allPaths.map((d, i) => (
          <path
            key={`area-${i}`}
            d={d}
            fill={color}
            fillOpacity={0.01}
            stroke="none"
            className="citation-area-highlight"
          />
        ))}
        {/* Then render all the visible outlines */}
        {allPaths.map((d, i) => (
          <path
            key={`outline-${i}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            className="citation-path-highlight"
            pointerEvents="none"
          />
        ))}
      </g>
    </svg>
  );

  const polygon = polygons[0];

  // for now we'll center the floater on top of the top polygon
  height = 32;
  const highlightWidth = (polygon[4] - polygon[0]) * multiple;
  const highlightMiddle = polygon[0] * multiple + highlightWidth / 2;
  width = Math.max(160, highlightWidth);
  top = polygon[1] * multiple - height;
  left = highlightMiddle - width / 2;

  const reviewCitation = (review: Review) =>
    dispatchUnlessAsyncing({
      type: "reviewCitation",
      review,
      citationIndex,
    });

  const Approved = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleFilled}
      HoverIcon={CheckmarkCircleRegular}
      key="approved"
      classes="approved on"
      onClick={reviewCitation(Review.Unreviewed)}
      floating={true}
    />
  );

  const Rejected = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleFilled}
      HoverIcon={DismissCircleRegular}
      key="rejected"
      classes="rejected on"
      onClick={reviewCitation(Review.Unreviewed)}
      floating={true}
    />
  );

  const Approve = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleRegular}
      HoverIcon={CheckmarkCircleFilled}
      key="approve"
      classes="approved off citation-control"
      onClick={reviewCitation(Review.Approved)}
      floating={true}
    />
  );

  const Reject = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleRegular}
      HoverIcon={DismissCircleFilled}
      key="reject"
      classes="rejected off citation-control"
      onClick={reviewCitation(Review.Rejected)}
      floating={true}
    />
  );

  // Define navigation controls
  const pageNumbers = citationHighlights.map(({ pageNumber }) => pageNumber);
  const citationPrev = pageNumbers.includes(pageNumber - 1);
  const citationNext = pageNumbers.includes(pageNumber + 1);

  const Prev = () => (
    <HoverableIcon
      DefaultIcon={MoreCircleRegular}
      HoverIcon={MoreCircleFilled}
      key="prev"
      classes="prev"
      onClick={dispatchUnlessAsyncing({ type: "prevPage" })}
      floating={true}
    />
  );

  const Next = () => (
    <HoverableIcon
      DefaultIcon={MoreCircleRegular}
      HoverIcon={MoreCircleFilled}
      key="next"
      classes="next"
      onClick={dispatchUnlessAsyncing({ type: "nextPage" })}
      floating={true}
    />
  );

  // Single return statement handles both cases (with and without polygons)
  return (
    <div
      className="viewer-citations"
      style={{
        ...viewer,
        zIndex: 1000,
      }}
    >
      {highlightSvg}
      <div
        id="floater"
        className={review === Review.Unreviewed ? "review" : "reviewed"}
        style={{ top, left, width, height, color }}
      >
        <div />
        {citationPrev ? <Prev /> : <div />}
        {review === Review.Unreviewed ? (
          <>
            <Approve /> <Reject />
          </>
        ) : review === Review.Approved ? (
          <Approved />
        ) : (
          <Rejected />
        )}
        {citationNext ? <Next /> : <div />}
        <div />
      </div>
    </div>
  );
};
