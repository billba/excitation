import { useAtom } from "jotai";
import { stateAtom } from "./State";
import { useCallback, useMemo } from "react";
import { Citation, FormDocument } from "./Types";
import { CitationUX } from "./Citation";
import {
  DocumentRegular,
  DocumentFilled,
  DocumentOnePageRegular,
  DocumentOnePageFilled,
  DocumentOnePageMultipleRegular,
  DocumentOnePageMultipleFilled,
  DocumentOnePageAddRegular,
  DocumentOnePageAddFilled,
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";
import { useDispatchHandler } from "./Hooks";

const maxPageNumber = 1000;
const unlocatedPage = maxPageNumber;

interface PageGroup {
  firstPage: number;
  lastPage: number;
  citationIndices: number[];
}

const sortIndex = ({ firstPage, lastPage }: PageGroup) =>
  firstPage * maxPageNumber + lastPage;

const sortCitation = (questionCitations: Citation[], citationIndex: number) => {
  const { review } = questionCitations[citationIndex];
  return review * 1000 + citationIndex;
};

const groupCitations = (docs: FormDocument[], citations: Citation[]) =>
  docs.map((doc) => ({
    document: doc,
    pageGroups: citations
      .map<[Citation, number[]]>((citation, citationIndex) => [
        citation,
        [citationIndex],
      ])
      .filter(([citation]) => citation.doc === doc)
      .map(([citation, citationIndices]) => {
        const pageNumbers = (
          citation.boundingRegions ?? [{ pageNumber: unlocatedPage }]
        )
          .map(({ pageNumber }) => pageNumber)
          .sort();
        return {
          firstPage: pageNumbers[0],
          lastPage: pageNumbers[pageNumbers.length - 1],
          citationIndices,
        };
      })
      .reduce((pageGroups, pageGroup) => {
        const matchingPageGroup = pageGroups.find(
          ({ firstPage, lastPage }) =>
            firstPage == pageGroup.firstPage && lastPage == pageGroup.lastPage
        );
        if (matchingPageGroup) {
          matchingPageGroup.citationIndices.push(pageGroup.citationIndices[0]);
        } else {
          pageGroups.push(pageGroup);
        }
        return pageGroups;
      }, [] as PageGroup[])
      .map(({ firstPage, lastPage, citationIndices }) => ({
        firstPage,
        lastPage,
        citationIndices: citationIndices.sort(
          (a, b) => sortCitation(citations, a) - sortCitation(citations, b)
        ),
      }))
      .sort((a, b) => sortIndex(a) - sortIndex(b)),
  }));

export function Sidebar() {
  const [state, _dispatch] = useAtom(stateAtom);
  const { documents, questions, ux, asyncState } = state;
  const { pageNumber, questionIndex, selectedCitation } = ux;
  const { prefix, text } = questions[questionIndex];

  const groupedCitations = useMemo(
    () => groupCitations(documents, questions[questionIndex].citations),
    [documents, questions, questionIndex]
  );

  const dispatch = useDispatchHandler(_dispatch);

  const disablePrev = questionIndex === 0;
  const disableNext = questionIndex === questions.length - 1;

  const addSelection = useCallback(
    (event: React.MouseEvent) => {
      _dispatch({ type: "addSelection" });
      document.getSelection()?.empty();
      event.stopPropagation();
    },
    [_dispatch]
  );

  console.log("rendering");

  return (
    <div id="sidebar" onClick={dispatch({ type: "selectCitation" })}>
      <div className="sidebar-header">
        <TriangleLeftFilled
          className={`question-nav ${disablePrev ? "disabled" : "enabled"}`}
          onClick={disablePrev ? undefined : dispatch({ type: "prevQuestion" })}
        />
        <div className="question">
          <span className="question-prefix">
            {prefix ? <>{prefix}. </> : null}
          </span>
          <span className="question-text">{text}</span>
        </div>
        <TriangleRightFilled
          className={`question-nav ${disableNext ? "disabled" : "enabled"}`}
          onClick={disableNext ? undefined : dispatch({ type: "nextQuestion" })}
        />
      </div>
      <div id="citation-groups">
        {groupedCitations.map(({ document: doc, pageGroups }) => {
          const docSelected = doc == ux.doc;
          return (
            <div className="doc-group" key={doc.documentId}>
              <div
                className={`doc-header ${
                  docSelected ? "selected" : "unselected"
                }`}
                onClick={
                  docSelected ? undefined : dispatch({ type: "goto", doc })
                }
              >
                <div>
                  {docSelected ? (
                    <DocumentFilled className="icon" />
                  ) : (
                    <DocumentRegular className="icon" />
                  )}
                  {doc.friendlyname ?? doc.filename}
                </div>
              </div>
              {pageGroups.map(({ firstPage, lastPage, citationIndices }) => {
                const pageSelected =
                  docSelected &&
                  (selectedCitation
                    ? citationIndices.includes(selectedCitation.citationIndex)
                    : pageNumber >= firstPage && pageNumber <= lastPage);
                return (
                  <div
                    className="page-group"
                    key={firstPage * maxPageNumber + lastPage}
                  >
                    <div
                      className={`page-header ${
                        pageSelected ? "selected" : "unselected"
                      }`}
                      onClick={
                        pageSelected
                          ? undefined
                          : dispatch({
                              type: "goto",
                              pageNumber: firstPage,
                              doc,
                            })
                      }
                    >
                      {firstPage == lastPage ? (
                        firstPage == unlocatedPage ? (
                          <div>
                            {pageSelected ? (
                              <DocumentOnePageAddFilled className="icon" />
                            ) : (
                              <DocumentOnePageAddRegular className="icon" />
                            )}
                            Unable to locate citation
                          </div>
                        ) : (
                          <div>
                            {pageSelected ? (
                              <DocumentOnePageFilled className="icon" />
                            ) : (
                              <DocumentOnePageRegular className="icon" />
                            )}
                            Page {firstPage}
                          </div>
                        )
                      ) : (
                        <div>
                          {pageSelected ? (
                            <DocumentOnePageMultipleFilled className="icon" />
                          ) : (
                            <DocumentOnePageMultipleRegular className="icon" />
                          )}
                          Pages {firstPage}-{lastPage}
                        </div>
                      )}
                    </div>
                    {citationIndices.map((citationIndex) => {
                      const { excerpt, review } =
                        questions[questionIndex].citations[citationIndex];
                      return (
                        <CitationUX
                          key={citationIndex}
                          citationIndex={citationIndex}
                          excerpt={excerpt}
                          review={review}
                          selected={
                            selectedCitation?.citationIndex == citationIndex
                          }
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
        <br />
        &nbsp;
        <button
          onClick={addSelection}
          disabled={asyncState.status != "idle" || ux.range == undefined}
        >
          add selection
        </button>
        {asyncState.status == "error" && (
          <div>
            &nbsp;
            <button onClick={dispatch({ type: "asyncRetry" })}>Retry</button>
            &nbsp;
            <button onClick={dispatch({ type: "asyncRevert" })}>Revert</button>
          </div>
        )}
      </div>
    </div>
  );
}
