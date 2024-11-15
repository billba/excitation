import { Review } from "./Types";
import {
  CircleRegular,
  CheckmarkCircleFilled,
  DismissCircleFilled,
} from "@fluentui/react-icons";

import { useDispatchHandler } from "./Hooks";

interface Props {
  citationIndex: number; // the citation to render
  review: Review;
  selected: boolean; // is this citation currently selected?
}

export const CitationUX = ({ citationIndex, review, selected }: Props) => {
  const { dispatchUnlessAsyncing } = useDispatchHandler();

  const Unreviewed = () => (
    <div className="icon-container unreviewed">
      <CircleRegular className="icon" />
    </div>
  );

  const Approved = () => (
    <div className="icon-container approved on">
      <CheckmarkCircleFilled className="icon" />
    </div>
  );

  const Rejected = () => (
    <div className="icon-container rejected on">
      <DismissCircleFilled className="icon" />
    </div>
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
      {review === Review.Unreviewed ? (
        <Unreviewed />
      ) : review === Review.Approved ? (
        <Approved />
      ) : (
        <Rejected />
      )}
      <div className="citation-excerpt">stuff</div>
    </div>
  );
};
