import { useCallback, useRef, useState } from "react";
import { useAppState, largeSmall } from "./State.ts";
import { HoverableIcon } from "./Hooks.tsx";
import {
  DismissRegular,
  DismissFilled,
  CheckmarkRegular,
  CheckmarkFilled,
} from "@fluentui/react-icons";
import { LoadedState, Review } from "./Types.ts";
import { ReviewPanel } from "./ReviewCitations.tsx";
import { ApprovedCitations } from "./ApprovedCitations.tsx";
import { Breadcrumbs } from "./Breadcrumbs.tsx";

export const AnswerPanel = () => {
  const [state, dispatch] = useAppState();
  const {
    ux: { questionIndex, largeAnswerPanel },
    questions,
    metadata: { formId },
  } = state as LoadedState;
  const question = questions[questionIndex];
  const { answer, citations, prefix, text } = question;


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
      if (!unreviewedCitations) {
        dispatch({ type: "expandAnswerPanel" });
        e.stopPropagation();
      }
    },
    [dispatch, unreviewedCitations]
  );

  const addExcerptToAnswer = (excerpt: string) => setEditAnswer((prev) => (prev ?? answer ?? "") + excerpt);

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
    <div id="answer-panel" className={largeSmall(largeAnswerPanel)}>
      <Breadcrumbs
        breadcrumbs={[["Home", "/"], ["Form", `/${formId}`], ["Question"]]}
      />
      <div
        id="answer-container"
        onClick={largeAnswerPanel ? undefined : onClickOnSmallAnswer}
      >
        <div id="answer-and-buttons">
          <div className="question">
            <span className="question-prefix">
              {prefix ? <>{prefix}. </> : null}
            </span>
            <span className="question-text">{text}</span>
          </div>
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
      {largeAnswerPanel ? <ApprovedCitations answer={answer}  addExcerptToAnswer={addExcerptToAnswer} /> : <ReviewPanel />}
    </div>
  );
};
