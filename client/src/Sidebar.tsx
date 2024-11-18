import { docs, useAppState, sortBy } from "./State";
import {
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { Citation } from "./Types";
import { CitationUX } from "./Citation";
import {
  DocumentRegular,
  DocumentOnePageRegular,
  DocumentOnePageMultipleRegular,
  DocumentOnePageAddRegular,
} from "@fluentui/react-icons";
import { useAsyncHelper, useDispatchHandler } from "./Hooks";

const maxPageNumber = 1000;
const unlocatedPage = maxPageNumber;

interface PageGroup {
  firstPage: number;
  lastPage: number;
  citationIndex: number;
}

const sortIndex = sortBy(
  ({ firstPage, lastPage }: PageGroup) => firstPage * maxPageNumber + lastPage
);

// const sortCitation = (questionCitations: Citation[]) => sortBy((citationIndex: number) => {
//   const { review } = questionCitations[citationIndex];
//   return review * 1000 + citationIndex;
// });

export function Sidebar() {
  const [state, dispatch] = useAppState();
  const { questions, ux } = state;
  const { questionIndex, selectedCitation, documentId } = ux;
  const question = questions[questionIndex];
  const { citations } = question;

  const { isAsyncing, isError } = useAsyncHelper();

  const groupedCitations = useMemo(
    () =>
      docs.map((doc) => {
        const docSelected = doc.documentId == documentId;

        const pageGroups = citations
          // we bind each citation to its index, because filter will change the index
          .map<[Citation, number]>((citation, citationIndex) => [
            citation,
            citationIndex,
          ])
          // one document at a time
          .filter(([citation]) => citation.documentId === doc.documentId)
          // some citations span pages, so we gather first and last pages
          .map(([citation, citationIndex]) => {
            const pageNumbers = (
              citation.bounds ?? [{ pageNumber: unlocatedPage }]
            )
              .map(({ pageNumber }) => pageNumber)
              .sort();
            return {
              firstPage: pageNumbers[0],
              lastPage: pageNumbers[pageNumbers.length - 1],
              citationIndex,
            };
          })
          .sort(sortIndex)
          // note whether a given page group is selected
          .map(({ firstPage, lastPage, citationIndex }) => {
            const pageGroupSelected =
              docSelected &&
              selectedCitation != undefined &&
              selectedCitation.citationIndex === citationIndex;
            return {
              firstPage,
              lastPage,
              citationIndex,
              pageGroupSelected,
            };
          });
        return {
          doc,
          docSelected,
          pageGroups: pageGroups.map((pageGroup, pageGroupIndex) => ({
            ...pageGroup,
            prevPageGroupSelected:
              pageGroups[pageGroupIndex - 1]?.pageGroupSelected,
            nextPageGroupSelected:
              pageGroups[pageGroupIndex + 1]?.pageGroupSelected,
          })),
          firstPageGroupSelected:
            docSelected && pageGroups[0]?.pageGroupSelected,
          lastPageGroupSelected:
            docSelected && pageGroups[pageGroups.length - 1]?.pageGroupSelected,
          noCitations: docSelected && !pageGroups.length,
        };
      }),
    [citations, documentId, selectedCitation]
  );

  const { dispatchHandler, dispatchUnlessError } = useDispatchHandler();

  const addSelection = useCallback(
    (event: React.MouseEvent) => {
      dispatch({ type: "addSelection" });
      document.getSelection()?.empty();
      event.stopPropagation();
    },
    [dispatch]
  );

  return (
    <div id="sidebar" onClick={dispatchUnlessError({ type: "selectCitation" })}>
      <div className="sidebar-divider" />
      <div className="sidebar-divider" />
      <div id="docs">
        {groupedCitations.map(
          ({
            doc: { documentId, pdfUrl, name },
            docSelected,
            pageGroups,
            firstPageGroupSelected,
            lastPageGroupSelected,
            noCitations,
          }) => {
            return (
              <div className="doc" key={documentId}>
                <DocSpacer docSelected={docSelected} className="prefix" />
                <div
                  className={`doc-main ${
                    docSelected ? "selected" : "unselected"
                  }`}
                >
                  <DocHeader
                    firstPageGroupSelected={firstPageGroupSelected}
                    docSelected={docSelected}
                    noCitations={noCitations}
                    documentId={documentId}
                    name={name ?? pdfUrl}
                  />
                  {pageGroups.map(
                    (
                      {
                        firstPage,
                        lastPage,
                        citationIndex,
                        pageGroupSelected,
                        prevPageGroupSelected,
                        nextPageGroupSelected,
                      },
                      key
                    ) => (
                      <PageGroupHeader
                        firstPage={firstPage}
                        lastPage={lastPage}
                        pageGroupSelected={pageGroupSelected}
                        prevPageGroupSelected={prevPageGroupSelected}
                        nextPageGroupSelected={nextPageGroupSelected}
                        key={key}
                        onClick={
                          pageGroupSelected
                            ? undefined
                            : dispatchUnlessError({
                                type: "selectCitation",
                                citationIndex,
                              })
                        }
                      >
                        <CitationUX
                          key={citationIndex}
                          citationIndex={citationIndex}
                          review={citations[citationIndex].review}
                          excerpt={citations[citationIndex].excerpt}
                          selected={
                            selectedCitation?.citationIndex == citationIndex
                          }
                        />
                      </PageGroupHeader>
                    )
                  )}
                  <div className="doc-footer">
                    <div
                      className={
                        docSelected
                          ? lastPageGroupSelected
                            ? "last-page-group-selected"
                            : "selected"
                          : "unselected"
                      }
                    />
                  </div>
                </div>
                {!docSelected && <div className="sidebar-divider" />}
                <DocSpacer docSelected={docSelected} className="suffix" />
              </div>
            );
          }
        )}
        <div className="buttons" key="buttons">
          {isError && (
            <div>
              &nbsp;
              <button onClick={dispatchHandler({ type: "asyncRetry" })}>
                Retry
              </button>
              &nbsp;
              <button onClick={dispatchHandler({ type: "asyncRevert" })}>
                Revert
              </button>
            </div>
          )}
          <div id="answer">
            <div className="answer-section">
              You can manually add additional citations by navigating the
              documents, selecting relevant text, and
              {isAsyncing || ux.range == undefined ? (
                " clicking here"
              ) : (
                <>
                  &nbsp;
                  <span className="action" onClick={addSelection}>
                    clicking here
                  </span>
                </>
              )}
            </div>
          </div>
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

const DocSpacer = ({
  docSelected,
  className,
}: {
  docSelected: boolean;
  className: string;
}) => (
  <div className="doc-spacer">
    <div className={docSelected ? className : ""} />
  </div>
);

const DocHeader = ({
  firstPageGroupSelected,
  docSelected,
  noCitations,
  documentId,
  name,
}: {
  firstPageGroupSelected: boolean;
  docSelected: boolean;
  noCitations: boolean;
  documentId: number;
  name: string;
}) => {
  const { dispatchUnlessError } = useDispatchHandler();

  return (
    <>
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
        {name}
      </div>
      {firstPageGroupSelected && (
        <div className="bottom-right">
          <div />
        </div>
      )}
      {noCitations && <div className="sidebar-divider" />}
    </>
  );
};

const PageGroupHeader = ({
  firstPage,
  lastPage,
  pageGroupSelected,
  prevPageGroupSelected,
  nextPageGroupSelected,
  onClick,
  children,
}: {
  firstPage: number;
  lastPage: number;
  pageGroupSelected: boolean;
  prevPageGroupSelected: boolean;
  nextPageGroupSelected: boolean;
  onClick?: (event: React.MouseEvent) => void;
  children: ReactNode;
}) => (
  <div
    className={`page-group ${pageGroupSelected ? "selected" : "unselected"}`}
    key={firstPage * maxPageNumber + lastPage}
    onClick={onClick}
  >
    <div
      className={`page-header ${pageGroupSelected ? "selected" : "unselected"}`}
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
    {prevPageGroupSelected && (
      <div className="top-right">
        <div />
      </div>
    )}
    {children}
    {nextPageGroupSelected && (
      <div className="bottom-right">
        <div />
      </div>
    )}
  </div>
);
