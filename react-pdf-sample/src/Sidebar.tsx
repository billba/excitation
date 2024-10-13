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
      docs.map((doc) => {
        const docSelected = doc.documentId == uxDocumentId;

        const pageGroups = citations
          // we bind each citation to its index, because filter will change the index
          // and since the reduce function will produce multiple indices, we just start that way
          .map<[Citation, number[]]>((citation, citationIndex) => [
            citation,
            [citationIndex],
          ])
          // one document at a time
          .filter(([{ documentId }]) => documentId === doc.documentId)
          // some citations span pages, so we gather first and alst pages
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
          // now we group citations that are on the same page
          .reduce<PageGroup[]>((pageGroups, pageGroup) => {
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
              pageGroups.push(pageGroup); // this is where it's handy to already be working with arrays of indices
            }
            return pageGroups;
          }, [])
          // sort the indices within each page group
          .map(({ firstPage, lastPage, citationIndices }) => ({
            firstPage,
            lastPage,
            citationIndices: citationIndices.sort(
              (a, b) => sortCitation(citations, a) - sortCitation(citations, b)
            ),
          }))
          // and sort the page groups themselves
          .sort((a, b) => sortIndex(a) - sortIndex(b))
          // note whether a given page group is selected
          .map(({ firstPage, lastPage, citationIndices }) => {
            const pageSelected =
              docSelected &&
              (selectedCitation
                ? citationIndices.includes(selectedCitation.citationIndex)
                : pageNumber >= firstPage && pageNumber <= lastPage);
            return {
              firstPage,
              lastPage,
              citationIndices,
              pageSelected,
            };
          });
        return {
          doc,
          docSelected,
          pageGroups,
          firstPageGroupSelected: docSelected && pageGroups[0].pageSelected,
          lastPageGroupSelected:
            docSelected && pageGroups[pageGroups.length - 1].pageSelected,
        };
      }),
    [citations, pageNumber, uxDocumentId, selectedCitation]
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
          ({
            doc: { documentId, pdfUrl, name },
            docSelected,
            pageGroups,
            firstPageGroupSelected,
            lastPageGroupSelected,
          }) => {
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
                      firstPageGroupSelected ? "first-page-selected" : ""
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
                  {firstPageGroupSelected && (
                    <div className="bottom-right">
                      <div />
                    </div>
                  )}
                  {pageGroups.map(
                    (
                      { firstPage, lastPage, citationIndices, pageSelected },
                      pageGroupIndex
                    ) => (
                      <div
                        className={`page-group ${
                          pageSelected
                            ? "selected"
                            : pageGroups[pageGroupIndex]?.pageSelected
                            ? "previous-page-group-selected"
                            : "unselected"
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
                        {pageGroups[pageGroupIndex - 1]?.pageSelected && (
                          <div className="top-right"><div/></div>
                        )}
                        {citationIndices.length > 0 ? (
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
                          })
                        ) : (
                          <div className="no-citations">
                            No citations currently exist on this page.
                            <br />
                            Select document text to manually add a citation
                          </div>
                        )}{" "}
                        {pageGroups[pageGroupIndex + 1]?.pageSelected && (
                          <div className="bottom-right"><div/></div>
                        )}
                      </div>
                    )
                  )}
                </div>
                {docSelected && (
                  <>
                    <div className="doc-group-suffix-top-left" />
                    <div className="doc-group-suffix-top-right">
                      <div
                        className={
                          lastPageGroupSelected
                            ? "last-page-group-selected"
                            : ""
                        }
                      />
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
