import { useDocFromId, useAppStateValue } from "./State";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import {
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";
import { LoadedState,  } from "./Types";
import { hasCitationContext, getDocumentId, getPageNumber } from "./StateUtils";

export const NavBar = () => {  
  const { ux } = useAppStateValue() as LoadedState;
  const docFromId = useDocFromId();

  const { isError } = useAsyncHelper();
  const { dispatchUnlessError } = useDispatchHandler();
  
  const documentId = getDocumentId(ux);
  
  if (documentId === undefined) return (
    <div id="navbar">
      <div className="navbar-page">
      </div>
    </div>
  );

  const pageNumber = getPageNumber(ux)!;

  const { pages } = docFromId[documentId];

  const citationHighlights = hasCitationContext(ux) ? ux.citationHighlights : [];
  
  // Get the page numbers from the citation highlights
  const pageNumbers = citationHighlights.map((highlight: { pageNumber: number }) => highlight.pageNumber);
  
  const enablePrev = !isError && pageNumber !== 1 || undefined;
  const enableNext = !isError && pageNumber !== pages || undefined;
  
  const citationOnThisPage = pageNumbers.includes(pageNumber) 
  
  const citationPrev = enablePrev && citationOnThisPage && pageNumbers.includes(pageNumber - 1) || undefined;
  const citationNext = enableNext && citationOnThisPage && pageNumbers.includes(pageNumber + 1) || undefined;
  
  console.log("pageNumbers", pageNumber, pageNumbers, citationPrev, citationNext);

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
          {hasCitationContext(ux) && citationHighlights.length === 0 && (
              <span className="selected">Unable to locate citation</span>
            )}
        </div>
      </div>
    </div>
  );
};
