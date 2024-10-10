import { useAtom } from "jotai";
import { stateAtom } from "./State";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";

export const NavBar = () => {
  const [state, _dispatch] = useAtom(stateAtom);
  const { ux } = state;
  const { pageNumber, selectedCitation, doc: document } = ux;
  const { name, pdfUrl, pages } = document;
  const { isError } = useAsyncHelper();

  const { dispatchUnlessError } = useDispatchHandler(_dispatch);

  const pageNumbers =
    selectedCitation == undefined
      ? []
      : selectedCitation.citationHighlights
          .map(({ pageNumber }) => pageNumber)
          .sort();

  const disablePrev = isError || pageNumber === 1;
  const disableNext = isError || pageNumber === pages! - 1;

  const citationPrev = isError || pageNumbers.includes(pageNumber - 1);
  const citationNext = pageNumbers.includes(pageNumber + 1);

  return (
    <div id="navbar">
      <div className="navbar-filename">{name ?? pdfUrl}</div>
      <div className="navbar-page">
        <div className="navbar-column">
          <span
            className={citationPrev ? "selected clickable" : "hidden"}
            onClick={citationPrev ? dispatchUnlessError({ type: "prevPage" }) : undefined}
          >
            Citation continues from previous page
          </span>
        </div>
        <div className="navbar-column">
          <button
            onClick={dispatchUnlessError({ type: "prevPage" })}
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
            onClick={dispatchUnlessError({ type: "nextPage" })}
            disabled={disableNext}
          >
            &gt;
          </button>
        </div>
        <div className="navbar-column">
          <span
            className={citationNext ? "selected clickable" : "hidden"}
            onClick={citationNext ? dispatchUnlessError({ type: "nextPage" }) : undefined}
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
