import { useAtom } from "jotai";
import { Action } from "./Types";
import { docs, uxAtom } from "./State";
import { useCallback } from "react";

export const NavBar = () => {
  const [ux, _dispatch] = useAtom(uxAtom);

  const { docIndex, pageNumber, newCitation } = ux;

  const onChange = useCallback(
    (event: React.SyntheticEvent<HTMLSelectElement, Event>) => {
      _dispatch({
        type: "gotoDoc",
        docIndex: event.currentTarget.selectedIndex,
      });
    },
    [_dispatch]
  );

  const dispatch = useCallback(
    (action: Action) => () => _dispatch(action),
    [_dispatch]
  );

  const pages = docs[docIndex].pages;
  const pageNumbers = newCitation || ux.citationIndex == undefined ? [] : ux.citationHighlights.map(({ pageNumber }) => pageNumber).sort();

  const disablePrev = pageNumber === 1;
  const disableNext = pageNumber === pages - 1;

  return (
    <div id="navbar">
      <button onClick={dispatch({ type: "prevPage" })} disabled={disablePrev} className={pageNumbers.includes(pageNumber - 1) ? 'selected' : undefined}>
        &lt;
      </button>
      <span className={pageNumbers.includes(pageNumber) ? 'selected' : undefined}>{pageNumber}</span> / {pages}
      <button onClick={dispatch({ type: "nextPage" })} disabled={disableNext} className={pageNumbers.includes(pageNumber + 1) ? 'selected' : undefined}>
        &gt;
      </button>
      {!newCitation && ux.citationIndex !== undefined && ux.citationHighlights.length == 0 && (
        <span className="selected">Unable to locate citation</span>
      )}
    </div>
  );
};
