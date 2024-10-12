import { useAtom } from "jotai";
import { stateAtom } from "./State";
import { useCallback, useMemo } from "react";
import { Citation } from "./Types";
import { CitationUX } from "./Citation";
import {
  DocumentRegular,
  DocumentOnePageRegular,
  DocumentOnePageMultipleRegular,
  DocumentOnePageAddRegular,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";
import { SidebarHeader } from "./SidebarHeader";

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

export function Sidebar() {
  const [state, _dispatch] = useAtom(stateAtom);
  const { documents, questions, ux } = state;
  const { doc, pageNumber, questionIndex, selectedCitation } = ux;

  const { citations }  = questions[questionIndex];

  const { isAsyncing, isError } = useAsyncHelper();

  const groupedCitations = useMemo(
    () => documents.map((document) => ({
      document,
      pageGroups: citations
        .map<[Citation, number[]]>((citation, citationIndex) => [
          citation,
          [citationIndex],
        ])
        .filter(([citation]) => citation.documentId === document.documentId)
        .map(([citation, citationIndices]) => {
          const pageNumbers = (citation.bounds ?? [{ pageNumber: unlocatedPage }])
            .map(({ pageNumber }) => pageNumber)
            .sort();
          return {
            firstPage: pageNumbers[0],
            lastPage: pageNumbers[pageNumbers.length - 1],
            citationIndices,
          };
        })
        .reduce(
          (pageGroups, pageGroup) => {
            const matchingPageGroup = pageGroups.find(
              ({ firstPage, lastPage }) =>
                firstPage == pageGroup.firstPage && lastPage == pageGroup.lastPage
            );
            if (matchingPageGroup) {
              matchingPageGroup.citationIndices.push(
                pageGroup.citationIndices[0]
              );
            } else {
              pageGroups.push(pageGroup);
            }
            return pageGroups;
          },
          document === doc
            ? [
                {
                  firstPage: pageNumber,
                  lastPage: pageNumber,
                  citationIndices: [],
                },
              ]
            : ([] as PageGroup[])
        )
        .map(({ firstPage, lastPage, citationIndices }) => ({
          firstPage,
          lastPage,
          citationIndices: citationIndices.sort(
            (a, b) => sortCitation(citations, a) - sortCitation(citations, b)
          ),
        }))
        .sort((a, b) => sortIndex(a) - sortIndex(b)),
      }))
    ,
    [documents, citations, doc, pageNumber]
  );

  const { dispatch, dispatchUnlessError } = useDispatchHandler(_dispatch);

  const addSelection = useCallback(
    (event: React.MouseEvent) => {
      _dispatch({ type: "addSelection" });
      document.getSelection()?.empty();
      event.stopPropagation();
    },
    [_dispatch]
  );

  return (
    <div id="sidebar" onClick={dispatchUnlessError({ type: "selectCitation" })}>
      <SidebarHeader/>
      <div className="sidebar-divider" />
      <div id="citation-groups">
        {groupedCitations.map(({ document, pageGroups }) => {
          const docSelected = document == ux.doc;
          return (
            <>
              {docSelected && (
                <div className="doc-group-prefix">
                  <div/>
                </div>
              )}
              <div
                className={`doc-group ${
                  docSelected ? "selected" : "unselected"
                }`}
                key={document.documentId}
              >
                <div
                  className={`doc-header ${
                    docSelected ? "selected" : "unselected"
                  }`}
                  onClick={
                    docSelected
                      ? undefined
                      : dispatchUnlessError({ type: "goto", doc: document })
                  }
                >
                  <DocumentRegular className="icon" />
                  {document.name ?? document.pdfUrl}
                </div>
                {docSelected && (
                  <div className="doc-header-suffix">
                    <div />
                  </div>
                )}
                {pageGroups.map(({ firstPage, lastPage, citationIndices }) => {
                  const pageSelected =
                    docSelected &&
                    (selectedCitation
                      ? citationIndices.includes(selectedCitation.citationIndex)
                      : pageNumber >= firstPage && pageNumber <= lastPage);
                  return (
                    <div
                      className={`page-group ${
                        pageSelected ? "selected" : "unselected"
                      }`}
                      key={firstPage * maxPageNumber + lastPage}
                    >
                      <div
                        className={`page-header ${
                          pageSelected ? "selected" : "unselected"
                        }`}
                        onClick={
                          pageSelected
                            ? undefined
                            : dispatchUnlessError({
                                type: "goto",
                                pageNumber: firstPage,
                                doc: document,
                              })
                        }
                      >
                        {firstPage == lastPage ? (
                          firstPage == unlocatedPage ? (
                            <>
                              <DocumentOnePageAddRegular className="icon" />
                              Unable to locate citation
                            </>
                          ) : (
                            <>
                              <DocumentOnePageRegular className="icon" />
                              Page {firstPage}
                            </>
                          )
                        ) : (
                          <>
                            <DocumentOnePageMultipleRegular className="icon" />
                            Pages {firstPage}-{lastPage}
                          </>
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
              {docSelected && (<>
                <div className="doc-group-suffix-top-left" />
                <div className="doc-group-suffix-top-right">
                  <div />
                </div>
                <div className="doc-group-suffix-bottom">
                  <div />
                </div>
                <div className="sidebar-divider" />
                </>)}
              {!docSelected && <div className="sidebar-divider" />}
            </>
          );
        })}
        <div className="doc-group unselected" key="buttons">
          <button
            onClick={addSelection}
            disabled={isAsyncing || ux.range == undefined}
            >
            add selection
          </button>
          {isError && (
            <div>
              &nbsp;
              <button onClick={dispatch({ type: "asyncRetry" })}>Retry</button>
              &nbsp;
              <button onClick={dispatch({ type: "asyncRevert" })}>
                Revert
              </button>
            </div>
          )}
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
        <div className="sidebar-divider" />
      </div>
    </div>
  );
}
