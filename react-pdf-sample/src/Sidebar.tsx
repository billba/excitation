import { useAtom } from "jotai";
import { stateAtom } from "./State";
import { useCallback, useMemo } from "react";
import { Citation, FormDocument } from "./Types";
import { CitationUX } from "./Citation";
import {
  DocumentRegular,
  DocumentOnePageRegular,
  DocumentOnePageMultipleRegular,
  DocumentOnePageAddRegular,
  TriangleLeftFilled,
  TriangleRightFilled,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";

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

const groupCitations = (
  docs: FormDocument[],
  citations: Citation[],
  docCurrent: FormDocument,
  pageNumber: number
) =>
  docs.map((doc) => ({
    doc,
    pageGroups: citations
      .map<[Citation, number[]]>((citation, citationIndex) => [
        citation,
        [citationIndex],
      ])
      .filter(([citation]) => citation.doc!.documentId === doc.documentId)
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
        doc === docCurrent
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
  }));

export function Sidebar() {
  const [state, _dispatch] = useAtom(stateAtom);
  const { documents, questions, ux, asyncState } = state;
  const { pageNumber, doc, questionIndex, selectedCitation } = ux;
  const { prefix, text } = questions[questionIndex];

  const { isAsyncing, isError } = useAsyncHelper();

  const groupedCitations = useMemo(
    () =>
      groupCitations(
        documents,
        questions[questionIndex].citations,
        doc,
        pageNumber
      ),
    [documents, questions, questionIndex, doc, pageNumber]
  );

  const { dispatch, dispatchUnlessError } = useDispatchHandler(_dispatch);

  const disablePrev = isError || questionIndex === 0;
  const disableNext = isError || questionIndex === questions.length - 1;

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
      <div id="sidebar-header">
        <p>Please provide evidence for the following question:</p>
        <div id="sidebar-question-nav">
          <TriangleLeftFilled
            className={`question-nav ${disablePrev ? "disabled" : "enabled"}`}
            onClick={
              disablePrev
                ? undefined
                : dispatchUnlessError({ type: "prevQuestion" })
            }
          />
          <div className="question">
            <span className="question-prefix">
              {prefix ? <>{prefix}. </> : null}
            </span>
            <span className="question-text">{text}</span>
          </div>
          <TriangleRightFilled
            className={`question-nav ${disableNext ? "disabled" : "enabled"}`}
            onClick={
              disableNext
                ? undefined
                : dispatchUnlessError({ type: "nextQuestion" })
            }
          />
        </div>
        <br />
      </div>
      <div className="sidebar-divider" />
      <div id="citation-groups">
        {groupedCitations.map(({ doc, pageGroups }) => {
          const docSelected = doc == ux.doc;
          return (
            <>
              {docSelected && (
                <div className="doc-group-prefix-outer">
                  <div className="doc-group-prefix-inner" />
                </div>
              )}
              <div
                className={`doc-group ${
                  docSelected ? "selected" : "unselected"
                }`}
                key={doc.documentId}
              >
                <div
                  className={`doc-header ${
                    docSelected ? "selected" : "unselected"
                  }`}
                  onClick={
                    docSelected
                      ? undefined
                      : dispatchUnlessError({ type: "goto", doc })
                  }
                >
                  <DocumentRegular className="icon" />
                  {doc.name ?? doc.pdfUrl}
                </div>
                {docSelected && (
                  <div className="doc-header-suffix-outer">
                    <div className="doc-header-suffix-inner" />
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
                                doc,
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
                <div className="doc-group-suffix-left" />
                <div className="doc-group-suffix-right">
                  <div className="doc-group-suffix-right-inner" />
                </div>
                </>)}
              {!docSelected && <div className="sidebar-divider" />}
            </>
          );
        })}
        <div className="doc-group unselected" key="buttons">
          {/* <button
            onClick={addSelection}
            disabled={isAsyncing || ux.range == undefined}
            >
            add selection
          </button> */}
          {asyncState.status == "error" && (
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
          <br />
          <br />
          <br />
        </div>
        <div className="sidebar-divider" />
      </div>
    </div>
  );
}
