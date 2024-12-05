import { useDocFromId, useAppStateValue } from "./State";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";
import { LoadedState } from "./Types";

export const NavBar = () => {  
  const { ux: { pageNumber, selectedCitation, documentId } } = useAppStateValue() as LoadedState;
  const docFromId = useDocFromId();

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler();

  if (documentId === undefined) return (
    <div id="navbar">
      <div className="navbar-page">
      </div>
    </div>
  );

  const { pages } = docFromId[documentId];

  const pageNumbers =
    selectedCitation == undefined
      ? []
      : selectedCitation.citationHighlights
        .map(({ pageNumber }) => pageNumber);

  const enablePrev = !isError && pageNumber !== 1 || undefined;
  const enableNext = !isError && pageNumber !== pages || undefined;

  const citationPrev = enablePrev && pageNumbers.includes(pageNumber! - 1) || undefined;
  const citationNext = enableNext && pageNumbers.includes(pageNumber! + 1) || undefined;

  return (
    <div id="navbar" className="unselectable">
      <div className="navbar-page">
        <div className="navbar-column">
          <span
            className={citationPrev ? "visible" : "hidden"}
            onClick={citationPrev && dispatchUnlessError({ type: "prevPage" })}
          >
            Citation continues from previous page
          </span>
        </div>
        <TriangleLeftFilled
          className={`navbar-icon icon ${enablePrev ? "enabled" : "disabled"}`}
          onClick={enablePrev && dispatchUnlessError({ type: "prevPage" })}
        />
        <div className="navbar-change-page">
          {pageNumber}&nbsp;/&nbsp;{pages}
        </div>
        <TriangleRightFilled
          className={`navbar-icon icon ${enableNext ? "enabled" : "disabled"}`}
          onClick={enableNext && dispatchUnlessError({ type: "nextPage" })}
        />
        <div className="navbar-column">
          <span
            className={citationNext ? "visible" : "hidden"}
            onClick={citationNext && dispatchUnlessError({ type: "nextPage" })}
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
