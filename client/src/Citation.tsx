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

import { useDispatchHandler } from "./Hooks";
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
      dispatch({ type: "updateExcerpt", excerpt: editExcerpt, citationIndex });
      e.stopPropagation();
    },
    [dispatch, editExcerpt, citationIndex]
  );

  const onChangeExcerpt = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditExcerpt(e.target.value);
      e.stopPropagation();
    },
    [setEditExcerpt]
  );

  useEffect(() => {
    if (editing && editExcerptRef.current) {
      editExcerptRef.current.focus();
      editExcerptRef.current.select();
    }
  }, [editing, excerpt]);

  const hoverableIcon = (FilledIcon: FluentIcon, RegularIcon: FluentIcon) => (
    <>
      <FilledIcon className="icon filled" />
      <RegularIcon className="icon regular" />
    </>
  );

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
              onClick={(e) => e.stopPropagation()}
            />
            <div className="citation-icon edit-cancel" onClick={cancelEditExcerpt}>
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
                <div
                  key="approve"
                  className="citation-icon approved off hoverable"
                  onClick={dispatchUnlessAsyncing({
                    type: "reviewCitation",
                    review: Review.Approved,
                    citationIndex,
                  })}
                >
                  {hoverableIcon(CheckmarkCircleFilled, CheckmarkCircleRegular)}
                </div>
                <div
                  key="reject"
                  className="citation-icon rejected off hoverable"
                  onClick={dispatchUnlessAsyncing({
                    type: "reviewCitation",
                    review: Review.Rejected,
                    citationIndex,
                  })}
                >
                  {hoverableIcon(DismissCircleFilled, DismissCircleRegular)}
                </div>
                <div
                  key="edit"
                  className="citation-icon edit-start hoverable"
                  onClick={startEditExcerpt}
                >
                  {hoverableIcon(EditFilled, EditRegular)}
                </div>
              </>
            ) : review === Review.Approved ? (
              <div>
                <CheckmarkCircleFilled
                  className="icon citation-icon approved on"
                  onClick={dispatchUnlessAsyncing({
                    type: "reviewCitation",
                    review: Review.Unreviewed,
                    citationIndex,
                  })}
                />
              </div>
            ) : (
              <div>
                <DismissCircleFilled
                  className="icon citation-icon rejected on"
                  onClick={dispatchUnlessAsyncing({
                    type: "reviewCitation",
                    review: Review.Unreviewed,
                    citationIndex,
                  })}
                />
              </div>
            )}
          </>
        )
      ) : (
        <>
          <div>
            {review === Review.Unreviewed ? (
              <CircleRegular className="icon citation-icon unreviewed" />
            ) : review === Review.Approved ? (
              <CheckmarkCircleFilled
                className="icon citation-icon approved on"
                onClick={dispatchUnlessAsyncing({
                  type: "reviewCitation",
                  review: Review.Unreviewed,
                  citationIndex,
                })}
              />
            ) : (
              <DismissCircleFilled
                className="icon citation-icon rejected on"
                onClick={dispatchUnlessAsyncing({
                  type: "reviewCitation",
                  review: Review.Unreviewed,
                  citationIndex,
                })}
              />
            )}
          </div>
          <div className="citation-excerpt">{excerpt}</div>
        </>
      )}
    </div>
  );
};
