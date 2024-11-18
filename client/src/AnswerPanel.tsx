import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatchHandler, useStopProp } from "./Hooks.ts";
import { useAppState, docFromId } from "./State.ts";
import { HoverableIcon } from "./Hooks.tsx";
import {
  EditRegular,
  EditFilled,
  DismissRegular,
  CheckmarkRegular,
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

  const { text, answer, citations } = questions[questionIndex];

  const unreviewedCitations = citations.filter(
    ({ review }) => review === Review.Unreviewed
  );

  useEffect(() => {
    // console.log("ue", answerRef.current, answer);
    // if (answerRef.current && answer == undefined) {
    //   setEditAnswer("");
    //   answerRef.current.focus();
    //   answerRef.current.select();
    // }
  }, [answer]);

  const Edit = () => (
    <HoverableIcon
      DefaultIcon={EditRegular}
      HoverIcon={EditFilled}
      key="edit"
      classes="edit-start"
      onClick={startEditAnswer}
    />
  );

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [editAnswer, setEditAnswer] = useState<string | undefined>(answer);

  const startEditAnswer = useCallback(
    (e: React.MouseEvent) => {
      setEditAnswer(answer);
      answerRef.current!.focus();
      answerRef.current!.select();
      e.stopPropagation();
    },
    [answer]
  );

  const cancelEditAnswer = useCallback((e: React.MouseEvent) => {
    setEditAnswer(undefined);
    e.stopPropagation();
  }, []);

  const onChangeAnswer = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditAnswer(e.target.value);
      e.stopPropagation();
    },
    []
  );

  const updateAnswer = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: "updateAnswer", answer: editAnswer! });
      setEditAnswer(undefined);
      e.stopPropagation();
    },
    [dispatch, editAnswer]
  );

  return largeAnswerPanel ? (
    <div id="answer-panel" className="small">
      <h1>Answer Mode</h1>
      <h2>{text}</h2>
      <div id="answer-container">
        <textarea
          ref={answerRef}
          className="answer-text"
          id="edit-answer"
          value={editAnswer}
          placeholder="If you have an answer, please enter it here."
          onChange={onChangeAnswer}
          onClick={stopProp}
          disabled={editAnswer == undefined}
        />
        {editAnswer != undefined ? (
          <>
            <div
              className="icon-container edit-cancel"
              onClick={cancelEditAnswer}
            >
              <DismissRegular className="icon" />
            </div>
            <div className="icon-container edit-save" onClick={updateAnswer}>
              <CheckmarkRegular className="icon" />
            </div>
          </>
        ) : (
          <>
            <Edit />
          </>
        )}
      </div>
      <h2>Approved Citations</h2>
      {citations.map(({ excerpt, documentId, bounds }, i) => {
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
  ) : (
    <div id="answer-panel" className="large">
      <div id="answer-text-small">{answer}</div>
    </div>
  );
};
