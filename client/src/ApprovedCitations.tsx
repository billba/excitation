import { docFromId, useAppStateValue } from "./State.ts";
import { useDispatchHandler } from "./Hooks.ts";
import { HoverableIcon } from "./Hooks.tsx";
import { Review } from "./Types.ts";
import { TextAddFilled, TextAddRegular } from "@fluentui/react-icons";

interface Props {
  addExcerptToAnswer: (excerpt: string) => () => void;
}

export const ApprovedCitations = ({addExcerptToAnswer}: Props) => {
  const { dispatchHandler } = useDispatchHandler();

  const {
    ux: { questionIndex },
    questions,
  } = useAppStateValue();

  const { citations } = questions[questionIndex];

  // const unreviewedCitations = citations.filter(
  //   ({ review }) => review === Review.Unreviewed
  // );

  const maxPageNumber = 1000;
  const unlocatedPage = maxPageNumber;

  const AddExcerptToAnswer = ({ excerpt }: { excerpt: string }) => (
    <HoverableIcon
      DefaultIcon={TextAddRegular}
      HoverIcon={TextAddFilled}
      key="copy"
      classes="large-icon"
      onClick={addExcerptToAnswer(excerpt)}
    />
  );

  return (
    // <div id="review-container">
    //     {unreviewedCitations.length
    //       ? `There are ${unreviewedCitations.length} suggested citations left to review.`
    //       : "All suggested citations have been reviewed. Click here to change your reviews and manually add citations."}
    //   </div>

    <div>
      <span
        onClick={dispatchHandler({ type: "expandReviewPanel" })}
      >
        Expando
      </span>
      <h2>Approved Citations</h2>
      {citations.map(({ excerpt, documentId, bounds, review }, i) => {
        if (review !== Review.Approved) return <div key={i} />;

        const pageNumbers = (bounds ?? [{ pageNumber: unlocatedPage }])
          .map(({ pageNumber }) => pageNumber)
          .sort();

        const firstPage = pageNumbers[0];
        const lastPage = pageNumbers[pageNumbers.length - 1];

        const range =
          firstPage == lastPage
            ? firstPage == unlocatedPage
              ? "Unable to locate citation"
              : `Page ${firstPage}`
            : `Pages ${firstPage}-${lastPage}`;

        return (
          <div key={i}>
            <AddExcerptToAnswer excerpt={excerpt} />
            <p>
              {excerpt}&nbsp;({docFromId[documentId].name}, {range})
            </p>
          </div>
        );
      })}
    </div>
  );
};
