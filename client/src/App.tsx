import "./App.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { pdfjs } from "react-pdf";
import { largeSmall, useAppStateValue, useAsyncStateMachine } from "./State";
import { QuestionPanel } from "./QuestionPanel";
import { AnswerPanel } from "./AnswerPanel";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  useAsyncStateMachine();

  const { ux: { largeQuestionPanel } } = useAppStateValue();
  return (
    <div id="app" className={`question-${largeSmall(largeQuestionPanel)} `}>
      <QuestionPanel />
      <AnswerPanel />
    </div>
  )
}

export default App;
