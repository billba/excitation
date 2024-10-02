import { useSetAtom } from "jotai";
import { Action, ReviewStatus } from "./Types";
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

// We kind of abuse the ReviewStatus enum here by overloading its values to refer both
// to the type of the citation icon (unreviewed, approved, rejected) and to the status of
// said citation, reflected in said icon.

type ReviewIcon = ReviewStatus.Approved | ReviewStatus.Rejected;
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

  // const toggleReviewStatus = useCallback(
  //   (
  //     target: ReviewStatus.Approved | ReviewStatus.Rejected,
  //     citationIndex: number
  //   ) =>
  //     (event: React.MouseEvent<HTMLButtonElement>) => {
  //       _dispatch({
  //         type: "toggleReviewStatus",
  //         target,
  //         citationIndex,
  //       });
  //       event.stopPropagation();
  //     },
  //   [_dispatch]
  // );

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
          <Icon key={i} className={"icon " + className} />
        ))}
      </div>
      <div>
        <span className="citation-short">{excerpt.substring(0, 35)}...</span>
      </div>
      {/*}
      {newCitation || citationIndex != ux.citationIndex ? (
        <span className="citation-short">{excerpt.substring(0, 35)}...</span>
      ) : (
        <div className="citation-full">{excerpt}</div>
      )} */}
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
