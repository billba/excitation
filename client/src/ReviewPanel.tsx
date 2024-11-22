import { Sidebar } from "./Sidebar";
import { Viewer } from "./Viewer";
import { NavBar } from "./NavBar";
import { useAppStateValue } from "./State";
import { useDispatchHandler } from "./Hooks";
import { Review } from "./Types";

export const ReviewPanel = () => {
  const { dispatchHandler } = useDispatchHandler();

  const {
    ux: { questionIndex, largeReviewPanel },
    questions,
  } = useAppStateValue();

  const { citations } = questions[questionIndex];

  const unreviewedCitations = citations.filter(
    ({ review }) => review === Review.Unreviewed
  );

  return largeReviewPanel ? (
    <div id="review-panel" className="panel large">
      <Sidebar />
      <div id="viewer">
        <NavBar />
        <Viewer />
      </div>
    </div>
  ) : (
    <div
      id="review-panel"
      className="panel small"
      onClick={dispatchHandler({ type: "expandReviewPanel" })}
    >
      <div id="review-container">
        {unreviewedCitations.length
          ? `There are ${unreviewedCitations.length} suggested citations left to review.`
          : "All suggested citations have been reviewed. Click here to change your reviews and manually add citations."}
      </div>
    </div>
  );
};
