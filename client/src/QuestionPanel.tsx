import { largeSmall, useAppStateValue } from "./State.ts";
import {
  ChevronUpRegular,
  ChevronUpFilled,
  ChevronDownRegular,
  ChevronDownFilled,
} from "@fluentui/react-icons";
import { useDispatchHandler } from "./Hooks.ts";
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
    metadata: { formId },
  } = useAppStateValue() as LoadedState;
  const { prefix, text } = questions[questionIndex];

  return (
    <div
      id="question-panel"
      className={`panel ${largeSmall(largeQuestionPanel)}`}
    >
      <Breadcrumbs
        breadcrumbs={[["Home", "/"], ["Form", `/${formId}`], ["Question"]]}
      />
      <div id="question-container">
        <div className="question">
        <span className="question-prefix">
          {prefix ? <>{prefix}. </> : null}
        </span>
          <span className="question-text">{text}</span>
        </div>
      </div>
    </div>
  );
};
