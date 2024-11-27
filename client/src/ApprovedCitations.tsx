import { docFromId, useAppStateValue } from "./State.ts";
import { useDispatchHandler } from "./Hooks.ts";
import { HoverableIcon } from "./Hooks.tsx";
import { Review } from "./Types.ts";
import {
  // DismissCircleFilled,
  // DismissCircleRegular,
  AddCircleRegular,
  AddCircleFilled,
} from "@fluentui/react-icons";
import { useCallback } from "react";

interface Props {
  addExcerptToAnswer: (excerpt: string) => void;
}

export const ApprovedCitations = ({ addExcerptToAnswer }: Props) => {
  const { dispatchHandler } = useDispatchHandler();

  const {
    ux: { questionIndex },
    questions,
  } = useAppStateValue();

  const { citations } = questions[questionIndex];

  const maxPageNumber = 1000;
  const unlocatedPage = maxPageNumber;

  const _addExcerptToAnswer = useCallback(
    (parent: string, excerpt: string) => () => {
      const selection = document.getSelection();
      if (selection?.rangeCount) {
        const selectionRange = selection.getRangeAt(0);
        const parentElement = document.getElementById(parent);
        console.log("parent", parent, parentElement);
        console.assert(parentElement != null);
        if (
          !selectionRange.collapsed &&
          parentElement != null &&
          parentElement.contains(selectionRange.commonAncestorContainer)
        ) {
          const selectedText = selection.toString();
          selection.empty();
          return addExcerptToAnswer(selectedText);
        }
      }

      return addExcerptToAnswer(excerpt);
    },
    [addExcerptToAnswer]
  );

  const AddExcerptToAnswer = ({
    parent,
    excerpt,
  }: {
    parent: string;
    excerpt: string;
  }) => (
    <HoverableIcon
      DefaultIcon={AddCircleRegular}
      HoverIcon={AddCircleFilled}
      classes="large-icon add-excerpt-to-answer"
      onClick={_addExcerptToAnswer(parent, excerpt)}
      floating={true}
    />
  );

  // const Reject = ({ citationIndex }: { citationIndex: number }) => (
  //   <HoverableIcon
  //     DefaultIcon={DismissCircleRegular}
  //     HoverIcon={DismissCircleFilled}
  //     key="reject"
  //     classes="rejected on large-icon"
  //     onClick={dispatchHandler({
  //       type: "reviewCitation",
  //       citationIndex,
  //       review: Review.Rejected,
  //     })}
  //     floating={true}
  //   />
  // );

  return (
    <div id="approved-citations" className="unselectable">
      <h3>Approved Citations</h3>
      {citations.map(
        ({ excerpt, documentId, bounds, review }, citationIndex) => {
          if (review !== Review.Approved) return <div key={citationIndex} />;

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
            <div id={`citation-${citationIndex}`} key={citationIndex} className="approved-citation-container">
              <AddExcerptToAnswer
                parent={`citation-${citationIndex}`}
                excerpt={excerpt}
              />
              <div className="approved-citation selectable">
                {excerpt}
                <div>
                  (
                  <span
                    className="action"
                    onClick={dispatchHandler({
                      type: "selectCitation",
                      citationIndex,
                      reviewCitation: true,
                    })}
                  >
                    {docFromId[documentId].name}, {range}
                  </span>
                  )
                </div>
              </div>
            </div>
          );
        }
      )}
      <h4
        className="action"
        onClick={dispatchHandler({ type: "contractAnswerPanel" })}
      >
        Review citations
      </h4>
    </div>
  );
};
