import { useSetAtom } from "jotai";
import { Action, Review } from "./Types";
import { stateAtom } from "./State";
import {
  CircleRegular,
  CheckmarkCircleFilled,
  DismissCircleFilled,
} from "@fluentui/react-icons";
import { useCallback } from "react";

// not selected
//    unreviewed  CircleRegular (no hover) - grey
//    approved    CheckmarkCircleFilled (no hover) - green
//    rejected    DismissCircleFilled (no hover) - red
// selected
//    approved
//      CheckmarkCircleFilled - green (hover: grey)
//    rejected
//      DismissCircleFilled - red (hover: grey)
//    unreviewed
//      approve button  CheckmarkCircleFilled - grey (hover: green)
//      reject button   DismissCircleFilled - grey (hover: red)

const reviewIcons = [Review.Approved, Review.Rejected];

const citationIcons = {
  [Review.Unreviewed]: [
    CircleRegular,
    [
      "citation-icon-unreviewed",
      "citation-icon-unreviewed",
      "citation-icon-unreviewed",
    ],
  ],
  [Review.Approved]: [
    CheckmarkCircleFilled,
    [
      "citation-icon-approved",
      "citation-icon-approved-off",
      "citation-icon-approved-on",
    ],
  ],
  [Review.Rejected]: [
    DismissCircleFilled,
    [
      "citation-icon-rejected",
      "citation-icon-rejected-off",
      "citation-icon-rejected-on",
    ],
  ],
} as const;

interface Props {
  citationIndex: number; // the citation to render
  excerpt: string;
  review: Review;
  selected: boolean; // is this citation currently selected?
  selectable: boolean; // can this citation be selected?
}

export const CitationUX = ({
  citationIndex,
  excerpt,
  review,
  selected,
  selectable,
}: Props) => {
  const _dispatch = useSetAtom(stateAtom);

  const dispatch = useCallback(
    (action: Action) => () => _dispatch(action),
    [_dispatch]
  );

  const toggleReview = useCallback(
    (target: Review, citationIndex: number) =>
      (event: React.MouseEvent<SVGElement>) => {
        _dispatch({
          type: "toggleReview",
          target,
          citationIndex,
        });
        event.stopPropagation();
      },
    [_dispatch]
  );

  const icons = (
    review == Review.Unreviewed && selected ? reviewIcons : [review]
  ).map((r) => {
    const [Icon, classNames] = citationIcons[r];
    const className = classNames[Number(selected) * (Number(review == r) + 1)];

    return (
      <Icon
        key={r}
        className={className + (selected ? " large-icon" : " icon")}
        onClick={selected ? toggleReview(r, citationIndex) : undefined}
      />
    );
  });

  return (
    <div
      className={selected ? "citation-selected" : "citation-unselected"}
      key={citationIndex}
      onClick={
        selectable
          ? dispatch({ type: "gotoCitation", citationIndex })
          : undefined
      }
    >
      {selected ? (
        <>
          <div className="citation-full">{excerpt}</div>
          {icons}
        </>
      ) : (
        <>
          {icons}
          <div className="citation-short">{excerpt.substring(0, 35)}...</div>
        </>
      )}
    </div>
  );
};
