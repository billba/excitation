import { useCallback, useEffect, useRef } from "react";
import { Document, Page } from "react-pdf";
import {
  CheckmarkCircleFilled,
  CheckmarkCircleRegular,
  DismissCircleFilled,
  DismissCircleRegular,
  TextFieldFilled,
  TextFieldRegular,
} from "@fluentui/react-icons";

import { docFromId, useAppState } from "./State";
import {
  calculateRange,
  calculateSerializedRange,
  compareRanges,
  SerializedRange,
} from "./Range";
import { useDispatchHandler } from "./Hooks";
import { HoverableIcon } from "./Hooks.tsx";
import { Review } from "./Types";

const colors = ["#00acdc", "#00ac00", "#f07070"];
const multiple = 72;
const padding = 3;

export function Viewer() {
  const [{ ux }, dispatch] = useAppState();
  const { documentId } = ux;
  const editing = ux.selectedCitation?.editing;

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

  return (
    <div ref={viewerRef} id="viewer">
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
        <>
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
          <ViewerCitations />
        </>
      )}
    </div>
  );
}

const ViewerCitations = () => {
  const { dispatchUnlessAsyncing } = useDispatchHandler();
  const [{ ux, questions, viewer }] = useAppState();

  if (!ux.selectedCitation) return null;

  const { questionIndex } = ux;
  const { citationIndex } = ux.selectedCitation;

  const citation = questions[questionIndex].citations[citationIndex];
  const { review } = citation;
  const color = colors[review || 0];

  const polygons = ux.selectedCitation.citationHighlights.filter(
    (citationHighlight) => citationHighlight.pageNumber == ux.pageNumber
  )[0]?.polygons;

  if (!polygons) return null;

  const polygon = polygons[0];

  // for now we'll center the floater on top of the top polygon
  const height = 40;
  const top = polygon[1] * multiple - height;
  const left = polygon[0] * multiple;
  const width = (polygon[4] - polygon[0]) * multiple;

  // const Unreviewed = () => (
  //   <div className="icon icon-container unreviewed">
  //     <CircleRegular className="icon" />
  //   </div>
  // );

  const Approved = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleFilled}
      HoverIcon={CheckmarkCircleRegular}
      key="approved"
      classes="approved on"
      onClick={dispatchUnlessAsyncing({
        type: "reviewCitation",
        review: Review.Unreviewed,
        citationIndex,
      })}
      floating={true}
    />
  );

  const Rejected = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleFilled}
      HoverIcon={DismissCircleRegular}
      key="rejected"
      classes="rejected on"
      onClick={dispatchUnlessAsyncing({
        type: "reviewCitation",
        review: Review.Unreviewed,
        citationIndex,
      })}
      floating={true}
    />
  );

  const Approve = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkCircleRegular}
      HoverIcon={CheckmarkCircleFilled}
      key="approve"
      classes="approved off"
      onClick={dispatchUnlessAsyncing({
        type: "reviewCitation",
        review: Review.Approved,
        citationIndex,
      })}
    />
  );

  const Reject = () => (
    <HoverableIcon
      DefaultIcon={DismissCircleRegular}
      HoverIcon={DismissCircleFilled}
      key="reject"
      classes="rejected off"
      onClick={dispatchUnlessAsyncing({
        type: "reviewCitation",
        review: Review.Rejected,
        citationIndex,
      })}
    />
  );

  const Edit = () => (
    <HoverableIcon
      DefaultIcon={TextFieldRegular}
      HoverIcon={TextFieldFilled}
      key="edit"
      classes="edit-start"
      onClick={() => {}}
    />
  );

  return (
    <div
      className="viewer-citations"
      style={{
        ...viewer,
        zIndex: 1000, //isError ? 1000 : 1,
      }}
    >
      {polygons.map((polygon, i) => (
        <div
          key={i}
          className="viewer-citation-highlight"
          style={{
            color,
            top: polygon[1] * multiple - padding,
            left: polygon[0] * multiple - padding,
            width: (polygon[4] - polygon[0]) * multiple + padding,
            minHeight: (polygon[5] - polygon[1]) * multiple + padding,
          }}
        ></div>
      ))}
      <div
        className="floater-container"
        style={{ top, left, width, height, color }}
      >
        {review === Review.Unreviewed ? (
          <div className="floater-review">
            <Approve /> <Reject /> <Edit />
          </div>
        ) : (
          <div className="floater-reviewed">
            {review === Review.Approved ? <Approved /> : <Rejected />}
          </div>
        )}
      </div>
    </div>
  );
};
