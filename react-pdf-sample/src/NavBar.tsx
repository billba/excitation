import { useAtomValue, useSetAtom } from "jotai";
import { Action } from "./Types";
import { docs, uxAtom, dispatchAtom, currentCitationAtom } from "./State";
import { useCallback } from "react";

export const NavBar = () => {
  const currentCitation = useAtomValue(currentCitationAtom);
  const ux = useAtomValue(uxAtom);
  const _dispatch = useSetAtom(dispatchAtom);

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

  const docIndex = ux.explore ? ux.docIndex : currentCitation!.docIndex;
  const pages = docs[docIndex].pages;

  const disablePrev = !ux.explore || ux.pageNumber === 0;
  const disableNext = !ux.explore || ux.pageNumber === pages - 1;

  return (
    <div id="navbar">
      &nbsp;
      <select onChange={onChange} value={docIndex} disabled={!ux.explore}>
        {docs.map(({ filename }, i) => (
          <option key={i} value={i}>
            {filename}
          </option>
        ))}
      </select>
      &nbsp;
      <button onClick={dispatch({ type: "prevPage" })} disabled={disablePrev}>
        &lt;
      </button>
      {ux.explore
        ? `${ux.pageNumber} / ${docs[docIndex].pages}`
        : ux.citationHighlights.length === 1
        ? `page ${ux.citationHighlights[0].pageNumber}`
        : `pages ${ux.citationHighlights[0].pageNumber} - ${
            ux.citationHighlights[ux.citationHighlights.length - 1].pageNumber
          }`}
      <button onClick={dispatch({ type: "nextPage" })} disabled={disableNext}>
        &gt;
      </button>
      {ux.explore && !ux.newCitation && ux.citationIndex !== undefined && (
        <span className="selected">Unable to locate citation</span>
      )}
    </div>
  );
};
