import { Review } from "./Types";
import {
  CircleRegular,
  CheckmarkCircleRegular,
  CheckmarkCircleFilled,
  DismissCircleFilled,
  DismissCircleRegular,
  EditFilled,
  EditRegular,
  CheckmarkRegular,
  DismissRegular,
  FluentIcon,
} from "@fluentui/react-icons";

import { useDispatchHandler, useStopProp } from "./Hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatchAppState } from "./State";

interface Props {
  citationIndex: number; // the citation to render
  excerpt: string;
  review: Review;
  selected: boolean; // is this citation currently selected?
  editing: true | undefined; // is this citation currently being edited?
}

export const CitationUX = ({
  citationIndex,
  excerpt,
  review,
  selected,
  editing,
}: Props) => {
  const excerptRef = useRef<HTMLDivElement>(null);
  const editExcerptRef = useRef<HTMLTextAreaElement>(null);

  const [height, setHeight] = useState(0);

  const dispatch = useDispatchAppState();
  const { dispatchUnlessAsyncing } = useDispatchHandler();

  const [editExcerpt, setEditExcerpt] = useState("");

  const startEditExcerpt = useCallback(
    (e: React.MouseEvent) => {
      setHeight(excerptRef.current!.getBoundingClientRect().height + 2);
      setEditExcerpt(excerpt);
      dispatch({ type: "startEditExcerpt" });
      e.stopPropagation();
    },
    [dispatch, excerpt]
  );

  const cancelEditExcerpt = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: "cancelEditExcerpt" });
      e.stopPropagation();
    },
    [dispatch]
  );

  const updateExcerpt = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: "updateExcerpt", excerpt: editExcerpt });
      e.stopPropagation();
    },
    [dispatch, editExcerpt]
  );

  const onChangeExcerpt = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditExcerpt(e.target.value);
      e.stopPropagation();
    },
    []
  );

  useEffect(() => {
    if (editing && editExcerptRef.current) {
      editExcerptRef.current.focus();
      editExcerptRef.current.select();
    }
  }, [editing]);

  const hoverableIcon = useCallback(
    (DefaultIcon: FluentIcon, HoverIcon: FluentIcon) => (
      <>
        <DefaultIcon className="icon default" />
        <HoverIcon className="icon hover" />
      </>
    ),
    []
  );

  const Approve = useMemo(
    () => () =>
      (
        <div
          key="approve"
          className="citation-icon approved off hoverable"
          onClick={dispatchUnlessAsyncing({
            type: "reviewCitation",
            review: Review.Approved,
            citationIndex,
          })}
        >
          {hoverableIcon(CheckmarkCircleRegular, CheckmarkCircleFilled)}
        </div>
      ),
    [citationIndex, dispatchUnlessAsyncing, hoverableIcon]
  );

  const Reject = useMemo(
    () => () =>
      (
        <div
          key="reject"
          className="citation-icon rejected off hoverable"
          onClick={dispatchUnlessAsyncing({
            type: "reviewCitation",
            review: Review.Rejected,
            citationIndex,
          })}
        >
          {hoverableIcon(DismissCircleRegular, DismissCircleFilled)}
        </div>
      ),
    [citationIndex, dispatchUnlessAsyncing, hoverableIcon]
  );

  const Edit = useMemo(
    () => () =>
      (
        <div
          key="edit"
          className="citation-icon edit-start hoverable"
          onClick={startEditExcerpt}
        >
          {hoverableIcon(EditRegular, EditFilled)}
        </div>
      ),
    [startEditExcerpt, hoverableIcon]
  );

  const Unreviewed = useMemo(
    () => () =>
      (
        <div className="icon citation-icon unreviewed">
          <CircleRegular className="icon" />
        </div>
      ),
    []
  );

  const Approved = useMemo(
    () => () =>
      (
        <div
          className="citation-icon approved on hoverable"
          onClick={dispatchUnlessAsyncing({
            type: "reviewCitation",
            review: Review.Unreviewed,
            citationIndex,
          })}
        >
          {hoverableIcon(CheckmarkCircleFilled, CheckmarkCircleRegular)}
        </div>
      ),
    [citationIndex, dispatchUnlessAsyncing, hoverableIcon]
  );

  const Rejected = useMemo(
    () => () =>
      (
        <div
          className="citation-icon rejected on hoverable"
          onClick={dispatchUnlessAsyncing({
            type: "reviewCitation",
            review: Review.Unreviewed,
            citationIndex,
          })}
        >
          {hoverableIcon(DismissCircleFilled, DismissCircleRegular)}
        </div>
      ),
    [citationIndex, dispatchUnlessAsyncing, hoverableIcon]
  );

  const stopProp = useStopProp();

  return (
    <div
      className={`citation ${selected ? "selected" : "unselected"}`}
      key={citationIndex}
      onClick={dispatchUnlessAsyncing({
        type: "selectCitation",
        citationIndex,
      })}
    >
      {selected ? (
        editing ? (
          <>
            <textarea
              ref={editExcerptRef}
              className="editor-excerpt"
              style={{ height }}
              value={editExcerpt}
              onChange={onChangeExcerpt}
              onClick={stopProp}
            />
            <div
              className="citation-icon edit-cancel"
              onClick={cancelEditExcerpt}
            >
              <DismissRegular className="icon" />
            </div>
            <div className="citation-icon edit-save" onClick={updateExcerpt}>
              <CheckmarkRegular className="icon" />
            </div>
          </>
        ) : (
          <>
            <div ref={excerptRef} className="citation-excerpt">
              {excerpt}
            </div>
            {review === Review.Unreviewed ? (
              <>
                <Approve />
                <Reject />
                <Edit />
              </>
            ) : review === Review.Approved ? (
              <Approved />
            ) : (
              <Rejected />
            )}
          </>
        )
      ) : (
        <>
          {review === Review.Unreviewed ? (
            <Unreviewed />
          ) : review === Review.Approved ? (
            <Approved />
          ) : (
            <Rejected />
          )}
          <div className="citation-excerpt">{excerpt}</div>
        </>
      )}
    </div>
  );
};
