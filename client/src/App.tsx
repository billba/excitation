import "./App.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { pdfjs } from "react-pdf";
import { useAppStateValue, useAsyncStateMachine } from "./State";
import { QuestionPanel } from "./QuestionPanel";
import { ReviewPanel } from "./ReviewPanel";
import { AnswerPanel } from "./AnswerPanel";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  useAsyncStateMachine();

  const { ux: { largeQuestionPanel, largeReviewPanel, largeAnswerPanel} } = useAppStateValue();

  return (
    <div id="app" className={`question-${largeQuestionPanel ? "large" : "small"} review-${largeReviewPanel ? "large" : "small"} answer-${largeAnswerPanel ? "large" : "small"}`}>
      <QuestionPanel/>
      <ReviewPanel />
      <AnswerPanel />
    </div>
  )
}

export default App;
