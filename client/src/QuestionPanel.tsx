import { useAppStateValue } from "./State";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
  ChevronRightRegular,
  ChevronRightFilled,
  ChevronDownRegular,
  ChevronDownFilled,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import { HoverableIcon } from "./Hooks.tsx";

export const QuestionPanel = () => {
  const {
    questions,
    ux: {
      questionIndex,
      largeQuestionPanel,
      largeAnswerPanel,
      largeReviewPanel,
    },
  } = useAppStateValue();
  const { prefix, text } = questions[questionIndex];

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler();

  const disablePrev = isError || questionIndex === 0;
  const disableNext = isError || questionIndex === questions.length - 1;

  const Chevron = () => (
    <HoverableIcon
      DefaultIcon={
        largeQuestionPanel ? ChevronDownRegular : ChevronRightRegular
      }
      HoverIcon={largeQuestionPanel ? ChevronDownFilled : ChevronRightFilled}
      key="chevron"
      classes="chevron"
      onClick={dispatchUnlessError({ type: "toggleQuestionPanel" })}
    />
  );

  return largeQuestionPanel ? (
    <div id="question-panel">
      <div id="sidebar-question-nav">
        <Chevron />
        Question
        <div />
        {/* <TriangleLeftFilled
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
        /> */}
      </div>
    </div>
  ) : (
    <div id="question-panel">
      <div id="sidebar-question-nav">
        <Chevron />
        Question
      </div>
    </div>
  );
};
