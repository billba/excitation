import { docs, useAppState } from "./State";
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
  const [state, _dispatch] = useAppState();
  const { questions, ux } = state;
  const {
    pageNumber,
    questionIndex,
    selectedCitation,
    documentId: uxDocumentId,
  } = ux;

  const { citations } = questions[questionIndex];

  const { isAsyncing, isError } = useAsyncHelper();

  const groupedCitations = useMemo(
    () =>
      docs.map((doc) => ({
        doc,
        pageGroups: citations
          .map<[Citation, number[]]>((citation, citationIndex) => [
            citation,
            [citationIndex],
          ])
          .filter(([{ documentId }]) => documentId === doc.documentId)
          .map(([citation, citationIndices]) => {
            const pageNumbers = (
              citation.bounds ?? [{ pageNumber: unlocatedPage }]
            )
              .map(({ pageNumber }) => pageNumber)
              .sort();
            return {
              firstPage: pageNumbers[0],
              lastPage: pageNumbers[pageNumbers.length - 1],
              citationIndices,
            };
          })
          .reduce<PageGroup[]>(
            (pageGroups, pageGroup) => {
              const matchingPageGroup = pageGroups.find(
                ({ firstPage, lastPage }) =>
                  firstPage == pageGroup.firstPage &&
                  lastPage == pageGroup.lastPage
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
            doc.documentId == uxDocumentId
              ? [
                  {
                    firstPage: pageNumber,
                    lastPage: pageNumber,
                    citationIndices: [],
                  },
                ]
              : []
          )
          .map(({ firstPage, lastPage, citationIndices }) => ({
            firstPage,
            lastPage,
            citationIndices: citationIndices.sort(
              (a, b) => sortCitation(citations, a) - sortCitation(citations, b)
            ),
          }))
          .sort((a, b) => sortIndex(a) - sortIndex(b)),
      })),
    [citations, pageNumber, uxDocumentId]
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
      <SidebarHeader />
      <div className="sidebar-divider" />
      <div id="citation-groups">
        {groupedCitations.map(
          ({ doc: { documentId, pdfUrl, name }, pageGroups }) => {
            const docSelected = documentId == uxDocumentId;
            return (
              <div className="doc-group" key={documentId}>
                {docSelected && (
                  <div className="doc-group-prefix">
                    <div />
                  </div>
                )}
                <div
                  className={`doc-group-main ${
                    docSelected ? "selected" : "unselected"
                  }`}
                >
                  <div
                    className={`doc-header ${
                      docSelected ? "selected" : "unselected"
                    }`}
                    onClick={
                      docSelected
                        ? undefined
                        : dispatchUnlessError({ type: "goto", documentId })
                    }
                  >
                    <DocumentRegular className="icon" />
                    {name ?? pdfUrl}
                  </div>
                  {docSelected && (
                    <div className="doc-header-suffix">
                      <div />
                    </div>
                  )}
                  {pageGroups.map(
                    ({ firstPage, lastPage, citationIndices }) => {
                      const pageSelected =
                        docSelected &&
                        (selectedCitation
                          ? citationIndices.includes(
                              selectedCitation.citationIndex
                            )
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
                                    documentId,
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
                          {citationIndices.length > 0 ?
                          citationIndices.map((citationIndex) => {
                            const { excerpt, review } =
                              questions[questionIndex].citations[citationIndex];
                            return (
                              <CitationUX
                                key={citationIndex}
                                citationIndex={citationIndex}
                                excerpt={excerpt}
                                review={review}
                                selected={
                                  selectedCitation?.citationIndex ==
                                  citationIndex
                                }
                              />
                            );
                          }) : 
                          <div className="no-citations">No citations currently exist on this page.<br/>Select document text to manually add a citation</div>}
                        </div>
                      );
                    }
                  )}
                </div>
                {docSelected && (
                  <>
                    <div className="doc-group-suffix-top-left" />
                    <div className="doc-group-suffix-top-right">
                      <div />
                    </div>
                    <div className="doc-group-suffix-bottom">
                      <div />
                    </div>
                  </>
                )}
                <div className="sidebar-divider" />
              </div>
            );
          }
        )}
        <div className="doc-group-main unselected" key="buttons">
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
        </div>
        <div className="sidebar-divider" />
      </div>
    </div>
  );
}
