import { docFromId, useAppStateValue } from "./State";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";

export const NavBar = () => {
  const { ux: { pageNumber, selectedCitation, documentId } }  = useAppStateValue();
  const { pages } = docFromId[documentId];

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler();

  const pageNumbers =
    selectedCitation == undefined
      ? []
      : selectedCitation.citationHighlights
          .map(({ pageNumber }) => pageNumber)
          .sort();

  const disablePrev = isError || pageNumber === 1;
  const disableNext = isError || pageNumber === pages - 1;

  const citationPrev = isError || pageNumbers.includes(pageNumber - 1);
  const citationNext = pageNumbers.includes(pageNumber + 1);

  return (
    <div id="navbar">
      <div className="navbar-page">
        <div className="navbar-column">
          <span
            className={citationPrev ? "visible" : "hidden"}
            onClick={citationPrev ? dispatchUnlessError({ type: "prevPage" }) : undefined}
          >
            Citation continues from previous page
          </span>
        </div>
        <TriangleLeftFilled
          className={`navbar-icon icon ${disablePrev ? "disabled" : "enabled"}`}
          onClick={dispatchUnlessError({ type: "prevPage" })}
        />
        <div className="navbar-change-page">
          {pageNumber}&nbsp;/&nbsp;{pages}
        </div>
        <TriangleRightFilled
          className={`navbar-icon icon ${disableNext ? "disabled" : "enabled"}`}
          onClick={dispatchUnlessError({ type: "nextPage" })}
        />
        <div className="navbar-column">
          <span
            className={citationNext ? "visible" : "hidden"}
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
