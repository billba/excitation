import "./App.css";
import { useLoadForm, useAppStateValue, useAsyncStateMachine } from "./State";
import { AnswerPanel } from "./AnswerPanel";
import { useParams } from "react-router";
import { FormStatus } from "./Types";

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
    <QandA />
  );
}

const QandA = () => {
  useAsyncStateMachine();

  return (
    <div id="app">
      <AnswerPanel />
    </div>
  );
};
