import { useAppState, sortBy } from "./State";
import {
  ReactNode,
  useMemo,
} from "react";
import { LoadedState, Citation } from "./Types";
import { CitationUX } from "./Citation";
import { getDocumentId, hasCitationContext } from "./StateUtils";
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
  citation: Citation;
}

const sortIndex = sortBy(
  ({ firstPage, lastPage }: PageGroup) => firstPage * maxPageNumber + lastPage
);

export function Sidebar() {
  const [state] = useAppState();
  const { questions, ux, docs } = state as LoadedState;
  const { questionIndex } = ux;
  const question = questions[questionIndex];

  const documentId = getDocumentId(ux);
  const selectedCitationId = hasCitationContext(ux) ? ux.citationId : undefined;
  const { citations } = question;

  const { isAsyncing, isError } = useAsyncHelper();

  const groupedCitations = useMemo(
    () =>
      docs.map((doc) => {
        const docSelected = doc.documentId == documentId;

        const pageGroups = citations
          // one document at a time
          .filter((citation) => citation.documentId === doc.documentId)
          // some citations span pages, so we gather first and last pages
          .map((citation) => {
            const pageNumbers = (
              citation.bounds ?? [{ pageNumber: unlocatedPage }]
            )
              .map(({ pageNumber }) => pageNumber)
              .sort();
            return {
              firstPage: pageNumbers[0],
              lastPage: pageNumbers[pageNumbers.length - 1],
              citation,
            };
          })
          .sort(sortIndex)
          // note whether a given page group is selected
          .map(({ firstPage, lastPage, citation }) => {
            const pageGroupSelected =
              docSelected &&
              selectedCitationId === citation.citationId;
            return {
              firstPage,
              lastPage,
              citation,
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
    [citations, documentId, selectedCitationId, docs]
  );

  const { dispatchHandler, dispatchUnlessError } = useDispatchHandler();

  return (
    <div id="sidebar" className="unselectable" onClick={dispatchUnlessError({ type: "selectCitation" })}>
      <h3 id="citations-label">Review Citations</h3>
      <div className="sidebar-divider" />
      <div id="disclaimer-section">
        Citation Tool is for demo purposes only. AI generated highlights
        may be incomplete or factually incorrect and should be reviewed.
      </div>
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
                  className={`doc-main ${docSelected ? "selected" : "unselected"
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
                        citation: { citationId, excerpt, review },
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
                              citationId,
                            })
                        }
                      >
                        <CitationUX
                          key={citationId}
                          citationId={citationId}
                          review={review}
                          excerpt={excerpt}
                          selected={
                            selectedCitationId === citationId
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
        <div className="answer-epilogue" key="answer-epilogue">
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
        className={`doc-header ${firstPageGroupSelected ? "first-page-selected" : ""
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
