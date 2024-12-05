import { Sidebar } from "./Sidebar";
import { Viewer } from "./Viewer";
import { NavBar } from "./NavBar";
import { pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export const ReviewPanel = () => {
  return (
    <div id="review-panel">
      <Sidebar />
      <div id="viewer">
        <NavBar />
        <Viewer />
      </div>
    </div>
  );
}