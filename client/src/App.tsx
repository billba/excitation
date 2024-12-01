import "./App.css";
import {
  largeSmall,
  useLoadForm,
  useAppStateValue,
  useAsyncStateMachine,
} from "./State";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerPanel } from "./AnswerPanel";
import { useParams } from "react-router";
import { FormStatus, LoadedState } from "./Types";

export function FormQuestion() {
  const { formId, questionId } = useParams();
  useLoadForm(Number(formId), Number(questionId));
  const { formStatus } = useAppStateValue();
  
  return formStatus == FormStatus.None ? (
    <div>NO FORM</div>
  ) : formStatus == FormStatus.Error ? (
    <div>ERROR</div>
  ) : formStatus == FormStatus.Loading ? (
    <div>LOADING</div>
  ) : (
    <QandA/>
  );
}

const QandA = () => {
  useAsyncStateMachine();
  const { ux: {largeQuestionPanel}} = useAppStateValue() as LoadedState;

  return (
    <div
      id="app"
      className={`question-${largeSmall(largeQuestionPanel)} `}
    >
      <QuestionPanel />
      <AnswerPanel />
    </div>
  );
}