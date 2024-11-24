import { useCallback, useRef, useState } from "react";
import { useAppState, largeSmall } from "./State.ts";
import { HoverableIcon } from "./Hooks.tsx";
import {
  DismissRegular,
  DismissFilled,
  CheckmarkRegular,
  CheckmarkFilled,
} from "@fluentui/react-icons";
import { Review } from "./Types.ts";
import { ReviewPanel } from "./ReviewPanel.tsx";
import { ApprovedCitations } from "./ApprovedCitations.tsx";


export const AnswerPanel = () => {
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

  const addExcerptToAnswer = (excerpt: string) => () => setEditAnswer((prev) => (prev ?? "") + excerpt);

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
      className={largeSmall(largeAnswerPanel)}
      onClick={onClickOnSmallAnswer}
    >
      <div id="answer-container">
        <div id="answer-and-buttons">
          <textarea
            ref={answerRef}
            className={`answer-text ${largeSmall(largeAnswerPanel)}`}
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
          {(editAnswer !== undefined) && (
            <>
              <Cancel />
              <Save />
            </>
          )}
        </div>
      </div>
      {largeAnswerPanel ? <ApprovedCitations addExcerptToAnswer={addExcerptToAnswer} /> : <ReviewPanel />}
    </div>
  );
};
