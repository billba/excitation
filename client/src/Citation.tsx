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
} from "@fluentui/react-icons";

import { useDispatchHandler, useStopProp } from "./Hooks";
import { HoverableIcon } from "./Hooks.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const Approve = () => <HoverableIcon
    DefaultIcon={CheckmarkCircleRegular}
    HoverIcon={CheckmarkCircleFilled}
    key="approve"
    classes="approved off"
    onClick={dispatchUnlessAsyncing({
      type: "reviewCitation",
      review: Review.Approved,
      citationIndex,
    })}
  />;

  const Reject = () => <HoverableIcon
    DefaultIcon={DismissCircleRegular}
    HoverIcon={DismissCircleFilled}
    key="reject"
    classes="rejected off"
    onClick={dispatchUnlessAsyncing({
      type: "reviewCitation",
      review: Review.Rejected,
      citationIndex,
    })}
  />;

  const Edit = () => <HoverableIcon
    DefaultIcon={EditRegular}
    HoverIcon={EditFilled}
    key="edit"
    classes="edit-start"
    onClick={startEditExcerpt}
  />;

  const Unreviewed = () => (
    <div className="icon-container unreviewed">
      <CircleRegular className="icon" />
    </div>
  );

  const Approved = () => <HoverableIcon
    DefaultIcon={CheckmarkCircleFilled}
    HoverIcon={CheckmarkCircleRegular}
    key="approved"
    classes="approved on"
    onClick={dispatchUnlessAsyncing({
      type: "reviewCitation",
      review: Review.Unreviewed,
      citationIndex,
    })}
  />; 

  const Rejected = () => <HoverableIcon
    DefaultIcon={DismissCircleFilled}
    HoverIcon={DismissCircleRegular}
    key="rejected"
    classes="rejected on"
    onClick={dispatchUnlessAsyncing({
      type: "reviewCitation",
      review: Review.Unreviewed,
      citationIndex,
    })}
  />;

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
              className="icon-container edit-cancel"
              onClick={cancelEditExcerpt}
            >
              <DismissRegular className="icon" />
            </div>
            <div className="icon-container edit-save" onClick={updateExcerpt}>
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
