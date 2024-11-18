import "./App.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { pdfjs } from "react-pdf";
import { useAppStateValue, useAsyncStateMachine } from "./State";
import { AnswerQuestion } from "./AnswerQuestion";
import { ReviewCitations } from "./ReviewCitations";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  useAsyncStateMachine();

  const {
    ux: { answeringQuestion },
  } = useAppStateValue();

  return answeringQuestion ? <AnswerQuestion /> : <ReviewCitations />;
}

export default App;
