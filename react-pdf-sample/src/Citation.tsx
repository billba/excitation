import { useSetAtom } from "jotai";
import { Action, ReviewStatus, ReviewIcon } from "./Types";
import { uxAtom } from "./State";

import {
  CircleRegular,
  CheckmarkCircleRegular,
  CheckmarkCircleFilled,
  DismissCircleRegular,
  DismissCircleFilled,
  bundleIcon,
  type FluentIcon,
} from "@fluentui/react-icons";
import { useCallback } from "react";

// not selected
//    unreviewed      CircleRegular (no hover) - black
//    approved        CheckmarkCircleFilled (no hover) - green
//    rejected        DismissCircleFilled (no hover) - red
// selected
//    approve button
//      unreviewed    CheckmarkCircleRegular (hover: CheckmarkCircleFilled) - green
//      approved      CircleFilled(hover: CircleRegular) - green
//    reject button
//      unreviewed    DismissCircleRegular(hover: DismissCircleFilled) - red
//      rejected      DismissCircleFilled (hover: CircleRegular) - red

const reviewIcon: ReviewIcon[] = [ReviewStatus.Approved, ReviewStatus.Rejected];

const citationClasses = {
  [ReviewStatus.Unreviewed]: "citation-icon-unreviewed",
  [ReviewStatus.Approved]: "citation-icon-approved",
  [ReviewStatus.Rejected]: "citation-icon-rejected",
};

const unselectedIcons = {
  [ReviewStatus.Unreviewed]: CircleRegular,
  [ReviewStatus.Approved]: CheckmarkCircleFilled,
  [ReviewStatus.Rejected]: DismissCircleFilled,
};

const selectedIcons = {
  [ReviewStatus.Approved]: [
    bundleIcon(CheckmarkCircleFilled, CheckmarkCircleRegular),
    bundleIcon(CircleRegular, CheckmarkCircleFilled),
  ],
  [ReviewStatus.Rejected]: [
    bundleIcon(DismissCircleFilled, DismissCircleRegular),
    bundleIcon(CircleRegular, DismissCircleFilled),
  ],
};

interface Props {
  citationIndex: number; // the citation to render
  excerpt: string;
  reviewStatus: ReviewStatus;
  selected: boolean; // is this citation currently selected?
  selectable: boolean; // can this citation be selected?
}

export const CitationUX = ({
  citationIndex,
  excerpt,
  reviewStatus,
  selected,
  selectable,
}: Props) => {
  const _dispatch = useSetAtom(uxAtom);

  const dispatch = useCallback(
    (action: Action) => () => _dispatch(action),
    [_dispatch]
  );

  const toggleReviewStatus = useCallback(
    (target: ReviewIcon, citationIndex: number) =>
      (event: React.MouseEvent<SVGElement>) => {
        _dispatch({
          type: "toggleReviewStatus",
          target,
          citationIndex,
        });
        event.stopPropagation();
      },
    [_dispatch]
  );

  const reviewStatusIcons: [FluentIcon, string][] = selected
    ? reviewIcon.map((reviewIcon) => [
        selectedIcons[reviewIcon][Number(reviewStatus == reviewIcon)],
        citationClasses[reviewIcon],
      ])
    : [[unselectedIcons[reviewStatus], citationClasses[reviewStatus]]];

  console.log(citationIndex, selected, reviewStatus, reviewStatusIcons);

  return (
    <div
      className="citation-row"
      key={citationIndex}
      onClick={
        selectable
          ? dispatch({ type: "gotoCitation", citationIndex })
          : undefined
      }
    >
      <div>
        {reviewStatusIcons.map(([Icon, className], i) => (
          <Icon
            key={i}
            className={"icon " + className}
            onClick={
              selected
                ? toggleReviewStatus(ReviewStatus.Approved, citationIndex)
                : undefined
            }
          />
        ))}
      </div>
      <div>
      {selected ? (
        <div className="citation-full">{excerpt}</div>
      ) : (
        <span className="citation-short">{excerpt.substring(0, 35)}...</span>
      )}
      </div>
      {/*}
      {/* <div className="citation">{excerpt}</div>
      <div className="buttons">
        {reviewStatus === ReviewStatus.Approved ||
        (!newCitation &&
          citationIndex === ux.citationIndex &&
          reviewStatus === ReviewStatus.Unreviewed) ? (
          <button
            className="cite-button"
            style={{
              backgroundColor:
                reviewStatus === ReviewStatus.Approved
                  ? "palegreen"
                  : "grey",
            }}
            onClick={
              newCitation || citationIndex !== ux.citationIndex
                ? undefined
                : toggleReviewStatus(
                    ReviewStatus.Approved,
                    citationIndex
                  )
            }
          >
            ✓
          </button>
        ) : null}
        {reviewStatus === ReviewStatus.Rejected ||
        (!newCitation &&
          citationIndex === ux.citationIndex &&
          reviewStatus === ReviewStatus.Unreviewed) ? (
          <button
            className="cite-button"
            style={{
              backgroundColor:
                reviewStatus === ReviewStatus.Rejected
                  ? "lightcoral"
                  : "grey",
            }}
            onClick={
              newCitation || citationIndex !== ux.citationIndex
                ? undefined
                : toggleReviewStatus(
                    ReviewStatus.Rejected,
                    citationIndex
                  )
            }
          >
            𐄂
          </button>
        ) : null} 
      </div> */}
    </div>
  );
};
