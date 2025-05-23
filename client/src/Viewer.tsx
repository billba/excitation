import { useCallback, useRef, useState, MouseEvent } from "react";
import { Document, Page } from "react-pdf";
import polygonClipping from "polygon-clipping";
import { Point } from "./di";

import {
  CheckmarkCircleFilled,
  CheckmarkCircleRegular,
  DismissCircleFilled,
  DismissCircleRegular,
  MoreCircleRegular,
  MoreCircleFilled,
  CircleFilled,
  SubtractCircleFilled,
  SubtractCircleRegular,
} from "@fluentui/react-icons";

import { useDocFromId, useAppState, useAppStateValue } from "./State";
import { useDispatchHandler } from "./Hooks";
import { HoverableIcon } from "./Hooks.tsx";
import { LoadedState, Review, ApplicationMode } from "./Types";
import { getDocumentId, getPageNumber, getCitation } from "./StateUtils";

const colors = ["#00acdc", "#00ac00", "#f07070"];
const multiple = 72;

// this type is defined deep in react-pdf and I can't figure out how to import it
// so here I just define the parts I need
interface PageCallback {
  height: number;
  width: number;
}

const currentPoint = (e: MouseEvent, elem: HTMLDivElement) => {
  const rect = elem.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) / multiple,
    y: (e.clientY - rect.top) / multiple,
  } as Point;
}

export function Viewer() {
  const [state, dispatch] = useAppState();
  const { ux } = state as LoadedState;
  const documentId = getDocumentId(ux);
  const pageNumber = getPageNumber(ux);
  const docFromId = useDocFromId();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [mouseDown, setMouseDown] = useState<Point>();

  const mode = ux.mode;
  const viewerElem = viewerRef.current;
  const isReady = viewerElem !== null && documentId !== undefined;

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!isReady) return;

    // // Check if the event target is part of a citation control
    // if ((e.target as HTMLElement).closest('.citation-control, .icon-container')) {
    //   // Skip handling if the click is on a citation control
    //   console.log("mouseDown on citation control - ignoring");
    //   return;
    // }

    setMouseDown(currentPoint(e, viewerElem));
    if (mode === ApplicationMode.ViewingCitation) {
      dispatch({ type: "selectCitation" });
    }
  }, [isReady, viewerElem, mode, dispatch]);

  const handleMouseUp = useCallback(() => {
    if (mode === ApplicationMode.SelectingNewCitation) {
      dispatch({ type: "endSelection" });
    } else {
      setMouseDown(undefined);
    }
  }, [mode, dispatch]);

  const tolerance = 0.1;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isReady) return;

    const point = currentPoint(e, viewerElem);

    if (mode === ApplicationMode.ViewingDocument && mouseDown && (Math.abs(mouseDown.x - point.x) > tolerance || Math.abs(mouseDown.y - point.y) > tolerance)) {
      setMouseDown(undefined);
      dispatch({ type: "setSelectionStart", start: mouseDown, end: point });
    } else if (mode === ApplicationMode.SelectingNewCitation) {
      dispatch({ type: "setSelectionEnd", end: point, });
    }
  }, [isReady, viewerElem, mode, mouseDown, dispatch]);

  const onDocumentLoadSuccess = useCallback(() => { }, []);

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

  if (documentId !== undefined)
    console.log("pdf", docFromId[documentId].pdfUrl);

  return (
    <div ref={viewerRef} id="viewer-viewport" className="unselectable showtextselection"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
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
              renderTextLayer={false}
            />
          </Document>
          {mode === ApplicationMode.ViewingCitation && <ViewerCitations />}
          {mode === ApplicationMode.SelectingNewCitation && <AddSelection />}
        </>
      )}
    </div>
  );
}

interface HighlightSvgProps {
  polygons: number[][];
  width: number;
  height: number;
  color: string;
  className?: string;
}

const HighlightSvg = ({ polygons, width, height, color, className }: HighlightSvgProps) => {

  className = className || "highlight-svg";

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

  return (
    <svg
      className={className}
      style={{
        width,
        height,
      }}
    // data-citation-index={citationIndex}
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

}

const AddSelection = () => {
  const { ux, viewer } = useAppStateValue() as LoadedState;

  if (ux.mode !== ApplicationMode.SelectingNewCitation) return null;

  const { pageNumber, bounds } = ux;

  let highlightSvg: JSX.Element;

  if (bounds === undefined || bounds.length === 0) {
    highlightSvg = (<></>);
  } else {
    const polygons = bounds
      .filter((bounds) => bounds.pageNumber === pageNumber)
      .map(({ polygon }) => polygon);

    highlightSvg = <HighlightSvg polygons={polygons} width={viewer.width} height={viewer.height} color={colors[Review.Unreviewed]} className={"select-highlight-svg"} />;
  }

  return (
    <div
      className="viewer-citations"
      style={{
        ...viewer,
        zIndex: 1000,
      }}
    >
      {highlightSvg}
    </div>
  )
}

const ViewerCitations = () => {
  const { dispatchUnlessAsyncing } = useDispatchHandler();
  const state = useAppStateValue() as LoadedState;
  const { ux, viewer } = state;

  // In ViewingCitation mode, these properties are directly on the ux object
  if (ux.mode !== ApplicationMode.ViewingCitation) return null;

  // We only access these properties after confirming we're in ViewingCitation mode
  const { citationHighlights, pageNumber } = ux;

  const citation = getCitation(state)!;
  const { review, userAdded, citationId } = citation;
  const color = colors[review || 0];

  // Get the highlight for current page - use strict equality for comparing page numbers
  const highlightForCurrentPage = citationHighlights.find(
    (citationHighlight) => citationHighlight.pageNumber === pageNumber
  );

  // Get the polygons for highlighting
  const polygons = highlightForCurrentPage?.polygons;

  if (!polygons || polygons.length === 0) return;

  // Prepare SVG highlighting and floater positioning
  const highlightSvg = <HighlightSvg polygons={polygons} width={viewer.width} height={viewer.height} color={color} />;
  let top = 20;
  let left = 20;
  let width = 160;
  let height = 32;

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
      citationId,
    });

  const Approved = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleFilled}
      HoverIcon={CheckmarkCircleRegular}
      MaskIcon={CircleFilled}
      key="approved"
      classes="approved on"
      onClick={reviewCitation(Review.Unreviewed)}
    />
  );

  const Rejected = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleFilled}
      HoverIcon={DismissCircleRegular}
      MaskIcon={CircleFilled}
      key="rejected"
      classes="rejected on"
      onClick={reviewCitation(Review.Unreviewed)}
    />
  );

  const Approve = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleRegular}
      HoverIcon={CheckmarkCircleFilled}
      MaskIcon={CircleFilled}
      key="approve"
      classes="approved off citation-control"
      onClick={reviewCitation(Review.Approved)}
    />
  );

  const Reject = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleRegular}
      HoverIcon={DismissCircleFilled}
      MaskIcon={CircleFilled}
      key="reject"
      classes="rejected off citation-control"
      onClick={reviewCitation(Review.Rejected)}
    />
  );

  const Delete = () => (
    <HoverableIcon
      DefaultIcon={SubtractCircleRegular}
      HoverIcon={SubtractCircleFilled}
      MaskIcon={CircleFilled}
      key="delete"
      classes="rejected off citation-control"
      onClick={dispatchUnlessAsyncing({ type: "deleteCitation" })}
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
      MaskIcon={CircleFilled}
      key="prev"
      classes="prev"
      onClick={dispatchUnlessAsyncing({ type: "prevPage" })}
    />
  );

  const Next = () => (
    <HoverableIcon
      DefaultIcon={MoreCircleRegular}
      HoverIcon={MoreCircleFilled}
      MaskIcon={CircleFilled}
      key="next"
      classes="next"
      onClick={dispatchUnlessAsyncing({ type: "nextPage" })}
    />
  );

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
            <Approve /> {userAdded ? <Delete /> : <Reject />}
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
