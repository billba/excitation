import "./App.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { pdfjs } from "react-pdf";
import { largeSmall, useAppStateValue, useAsyncStateMachine } from "./State";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerPanel } from "./AnswerPanel";
import { ReviewPanel } from "./ReviewPanel";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  useAsyncStateMachine();

  const { ux: { largeQuestionPanel, largeAnswerPanel, largeReviewPanel } } = useAppStateValue();
  return (
    <div id="app" className={`question-${largeSmall(largeQuestionPanel)} review-${largeSmall(largeReviewPanel)} answer-${largeSmall(largeAnswerPanel)}`}>
      <QuestionPanel />
      <ReviewPanel />
      <AnswerPanel />
    </div>
  )
}

export default App;
