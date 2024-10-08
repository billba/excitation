import { useAtom } from "jotai";
import { stateAtom } from "./State";
import { useDispatchHandler } from "./Hooks";

export const NavBar = () => {
  const [state, _dispatch] = useAtom(stateAtom);
  const { ux } = state;
  const { pageNumber, selectedCitation, doc: document } = ux;
  const { name, pdfUrl, pages } = document;

  const dispatch = useDispatchHandler(_dispatch);

  const pageNumbers =
    selectedCitation == undefined
      ? []
      : selectedCitation.citationHighlights
          .map(({ pageNumber }) => pageNumber)
          .sort();

  const disablePrev = pageNumber === 1;
  const disableNext = pageNumber === pages - 1;

  const citationPrev = pageNumbers.includes(pageNumber - 1);
  const citationNext = pageNumbers.includes(pageNumber + 1);

  return (
    <div id="navbar">
      <div className="navbar-filename">{name ?? pdfUrl}</div>
      <div className="navbar-page">
        <div className="navbar-column">
          <span
            className={citationPrev ? "selected clickable" : "hidden"}
            onClick={citationPrev ? dispatch({ type: "prevPage" }) : undefined}
          >
            Citation continues from previous page
          </span>
        </div>
        <div className="navbar-column">
          <button
            onClick={dispatch({ type: "prevPage" })}
            disabled={disablePrev}
          >
            &lt;
          </button>
          <span
            className={
              pageNumbers.includes(pageNumber) ? "selected" : undefined
            }
          >
            {pageNumber}
          </span>{" "}
          / {pages}
          <button
            onClick={dispatch({ type: "nextPage" })}
            disabled={disableNext}
          >
            &gt;
          </button>
        </div>
        <div className="navbar-column">
          <span
            className={citationNext ? "selected clickable" : "hidden"}
            onClick={citationNext ? dispatch({ type: "nextPage" }) : undefined}
          >
            Citation continues on next page
          </span>
          {selectedCitation &&
            selectedCitation.citationHighlights.length == 0 && (
              <span className="selected">Unable to locate citation</span>
            )}
        </div>
      </div>
    </div>
  );
};
