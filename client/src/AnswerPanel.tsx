import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatchHandler, useStopProp } from "./Hooks.ts";
import { useAppState, docFromId, largeSmall } from "./State.ts";
import { HoverableIcon } from "./Hooks.tsx";
import {
  DismissRegular,
  DismissFilled,
  CheckmarkRegular,
  CheckmarkFilled,
} from "@fluentui/react-icons";
import { Review } from "./Types.ts";

const maxPageNumber = 1000;
const unlocatedPage = maxPageNumber;

export const AnswerPanel = () => {
  const { dispatchHandler } = useDispatchHandler();
  const stopProp = useStopProp();
  const [
    {
      ux: { questionIndex, largeAnswerPanel },
      questions,
    },
    dispatch,
  ] = useAppState();

  const { answer, citations } = questions[questionIndex];

  const unreviewedCitations =
  citations.filter(({ review }) => review === Review.Unreviewed).length > 0;
  
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [editAnswer, setEditAnswer] = useState<string | undefined>(undefined);
  
  const cancelEditAnswer = useCallback((e: React.MouseEvent) => {
    setEditAnswer(undefined);
    e.stopPropagation();
  }, []);

  const onChangeAnswer = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const targetAnswer = e.target.value;
      setEditAnswer(answer === targetAnswer ? undefined : targetAnswer);
      e.stopPropagation();
    },
    [answer]
  );

  const updateAnswer = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: "updateAnswer", answer: editAnswer! });
      setEditAnswer(undefined);
      e.stopPropagation();
    },
    [dispatch, editAnswer]
  );

  const onClickOnSmallAnswer = useCallback(
    (e: React.MouseEvent) => {
      console.log("clicking");
      if (!unreviewedCitations) {
        dispatch({ type: "expandAnswerPanel" });
        e.stopPropagation();
      }
    },
    [dispatch, unreviewedCitations]
  );

  const Cancel = () => (
    <HoverableIcon
      DefaultIcon={DismissRegular}
      HoverIcon={DismissFilled}
      key="cancel"
      classes="edit-cancel"
      onClick={cancelEditAnswer}
    />
  );

  const Save = () => (
    <HoverableIcon
      DefaultIcon={CheckmarkRegular}
      HoverIcon={CheckmarkFilled}
      key="save"
      classes="edit-save"
      onClick={updateAnswer}
    />
  );

  return (
    <div
      id="answer-panel"
      className={`panel ${largeSmall(largeAnswerPanel)}`}
      onClick={onClickOnSmallAnswer}
    >
      <div id="answer-container">
        <textarea
          ref={answerRef}
          className="answer-text"
          id="edit-answer"
          value={editAnswer ?? answer ?? ""}
          onChange={onChangeAnswer}
          onClick={onClickOnSmallAnswer}
          placeholder={
            unreviewedCitations
              ? "Before you can answer this question you must review all the suggested citations."
              : "Type your answer here..."
          }
          disabled={unreviewedCitations}
        />
        {editAnswer && (
          <>
            <Cancel />
            <Save />
          </>
        )}
      </div>
      <div>
      <h2>Approved Citations</h2>
      {citations.map(({ excerpt, documentId, bounds, review }, i) => {
        if (review !== Review.Approved) return <div key={i}/>;

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
            <p>
              {excerpt}&nbsp;({docFromId[documentId].name}, {range})
            </p>
          </div>
        );
      })}
      </div>
    </div>
  );
};
