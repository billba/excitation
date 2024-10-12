import { useAtom } from "jotai";
import { stateAtom } from "./State";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";

export const SidebarHeader = () => {
  const [state, _dispatch] = useAtom(stateAtom);
  const { questions, ux } = state;
  const { questionIndex } = ux;
  const { prefix, text } = questions[questionIndex];

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler(_dispatch);

  const disablePrev = isError || questionIndex === 0;
  const disableNext = isError || questionIndex === questions.length - 1;

  return (
    <div id="sidebar-header">
      <p>Please provide evidence for the following question:</p>
      <div id="sidebar-question-nav">
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
      </div>
      <br />
    </div>
  );
}