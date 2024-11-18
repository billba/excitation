import { Sidebar } from "./Sidebar";
import { Viewer } from "./Viewer";
import { NavBar } from "./NavBar";

export const ReviewCitations = () => {
  return (
    <div id="review-citations">
      <Sidebar />
      <div id="viewer">
        <NavBar />
        <Viewer />
      </div>
    </div>
  );
};
