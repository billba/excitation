import { Review } from "./Types";
import {
  CircleRegular,
  CheckmarkCircleFilled,
  DismissCircleFilled,
} from "@fluentui/react-icons";
import { useDispatchHandler } from "./Hooks";

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
      "citation-icon unreviewed",
      "citation-icon unreviewed",
      "citation-icon unreviewed",
    ],
  ],
  [Review.Approved]: [
    CheckmarkCircleFilled,
    [
      "citation-icon approved on",
      "citation-icon approved off",
      "citation-icon approved on",
    ],
  ],
  [Review.Rejected]: [
    DismissCircleFilled,
    [
      "citation-icon rejected on",
      "citation-icon rejected off",
      "citation-icon rejected on",
    ],
  ],
} as const;

interface Props {
  citationIndex: number; // the citation to render
  excerpt: string;
  review: Review;
  selected: boolean; // is this citation currently selected?
}

export const CitationUX = ({
  citationIndex,
  excerpt,
  review,
  selected,
}: Props) => {
  const { dispatchUnlessAsyncing } = useDispatchHandler();

  const icons = (
    review == Review.Unreviewed && selected ? reviewIcons : [review]
  ).map((r) => {
    const [Icon, classNames] = citationIcons[r];
    const className = classNames[Number(selected) * (Number(review == r) + 1)];

    return (
      <Icon
        key={r}
        className={className + (selected ? " large-icon" : " icon")}
        onClick={dispatchUnlessAsyncing({ type: "toggleReview", target: r, citationIndex })}
      />
    );
  });

  return (
    <div
      className={`citation-group ${selected ? "selected" : "unselected"}`}
      key={citationIndex}
      onClick={dispatchUnlessAsyncing({ type: "selectCitation", citationIndex })}
    >
      {selected ? (
        <>
          {excerpt}
          <div>{icons}</div>
        </>
      ) : (
        <>
          {icons}
          <span>{excerpt}</span>
        </>
      )}
    </div>
  );
};
