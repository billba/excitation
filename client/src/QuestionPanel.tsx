import { largeSmall, useAppStateValue } from "./State.ts";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
  ChevronUpRegular,
  ChevronUpFilled,
  ChevronDownRegular,
  ChevronDownFilled,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks.ts";
import { HoverableIcon } from "./Hooks.tsx";
import { LoadedState, PseudoBoolean } from "./Types.ts";
import { Breadcrumbs } from "./Breadcrumbs.tsx";

export const ChevronIcon = (large: PseudoBoolean) => {
  const { dispatchUnlessError } = useDispatchHandler();

  return (
    <HoverableIcon
      DefaultIcon={large ? ChevronUpRegular : ChevronDownRegular}
      HoverIcon={large ? ChevronUpFilled : ChevronDownFilled}
      key="chevron"
      classes="chevron large-icon"
      onClick={dispatchUnlessError({ type: "toggleQuestionPanel" })}
    />
  );
};

export const QuestionPanel = () => {
  const {
    questions,
    ux: { questionIndex, largeQuestionPanel },
    metadata: { formId }
  } = useAppStateValue() as LoadedState;
  const { prefix, text } = questions[questionIndex];

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler();

  const disablePrev = isError || questionIndex === 0;
  const disableNext = isError || questionIndex === questions.length - 1;

  const Chevron = () => ChevronIcon(largeQuestionPanel);

  return (
    <div
      id="question-panel"
      className={`panel ${largeSmall(largeQuestionPanel)}`}
    >
      <Breadcrumbs breadcrumbs={[["Home", "/"], ["Form", `/${formId}`], ["Question"]]} />
      <div id="question-container">
        <div id="question-nav">
          <TriangleLeftFilled
            className={`question-nav ${disablePrev ? "disabled" : "enabled"}`}
            onClick={
              disablePrev
                ? undefined
                : dispatchUnlessError({ type: "prevQuestion" })
            }
          />
          <div className="question">
            <span className="question-prefix">
              {prefix ? <>{prefix}. </> : null}
            </span>
            <span className="question-text">{text}</span>
          </div>
          <TriangleRightFilled
            className={`question-nav ${disableNext ? "disabled" : "enabled"}`}
            onClick={
              disableNext
                ? undefined
                : dispatchUnlessError({ type: "nextQuestion" })
            }
          />
          <Chevron />
        </div>
        {largeQuestionPanel && (
          <div id="question-guidance">
            <h4>Guidance</h4>
            <p>
              Many customers have questionaires or forms where the fields have a
              concise label of question, but there are significant supplementary
              materials, sometimes described as "guidelines".
            </p>
            <ul>
              <li>These are often bulleted</li>
              <li>There may be links to other documents</li>
              <li>They may be quite long indeed.</li>
              <li>There may be a lot of guidelines.</li>
              <li>
                And so there has to be a way for users to access said guidance,
                both when reviewing citations and answering the question.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
