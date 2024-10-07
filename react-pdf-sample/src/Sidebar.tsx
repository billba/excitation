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
          (a, b) =>
            sortCitation(citations, a) -
            sortCitation(citations, b)
        ),
      }))
      .sort((a, b) => sortIndex(a) - sortIndex(b)),
  }));

export function Sidebar() {
  const [state, _dispatch] = useAtom(stateAtom);
  const {
    documents,
    questions,
    ux,
    asyncState,
  } = state;
  const { questionIndex, selectedCitation } = ux;
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
          className={disablePrev ? "question-nav-disabled" : "question-nav"}
          onClick={disablePrev ? undefined : dispatch({ type: "prevQuestion" })}
        />
        <div className="question">
          <span className="question-prefix">{prefix ? <>{prefix}. </> : null}</span>
          <span className="question-text">{text}</span>
        </div>
        <TriangleRightFilled
          className={disableNext ? "question-nav-disabled" : "question-nav"}
          onClick={disableNext ? undefined : dispatch({ type: "nextQuestion" })}
        />
      </div>
      <div id="citation-groups">
        {groupedCitations.map(({ document, pageGroups }) => (
          <div id="document-group" key={document.documentId}>
            <div
              className="doc-header"
              onClick={
                document == ux.doc
                  ? undefined
                  : dispatch({ type: "gotoDoc", doc: document })
              }
            >
              <DocumentRegular className="icon" />
              {document.friendlyname ?? document.filename}
            </div>
            {pageGroups.map(({ firstPage, lastPage, citationIndices }) => (
              <div
                className="page-group"
                key={firstPage * maxPageNumber + lastPage}
              >
                <div className="page-header">
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
            ))}
          </div>
        ))}
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
