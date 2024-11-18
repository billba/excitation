import { Sidebar } from "./Sidebar";
import { Viewer } from "./Viewer";
import { NavBar } from "./NavBar";

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
};
