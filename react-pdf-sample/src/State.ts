import { atom } from "jotai";
import { create } from "mutative";
import {
  Doc,
  Citation,
  CitationHighlight,
  UXState,
  Action,
  ReviewStatus,
  NewCitationState,
  CitationState,
  NoCitationsState,
} from "./Types";
import { mockCitations, mockDocs } from "./Mocks";
import { locateCitations, returnTextPolygonsFromDI } from "./Utility";

async function docsWithResponses(docs: Doc[]) {
  return await Promise.all(
    docs.map(async (doc) =>
      create(doc, async (draft) => {
        draft.response = await (await fetch(doc.filename + ".json")).json();
      })
    )
  );
}

export const docs = await docsWithResponses(mockDocs); // not an atom because they never change

const citations = locateCitations(docs, mockCitations);
export const citationsAtom = atom(citations);

export const currentCitationAtom = atom<Citation | undefined>((get) => {
  const ux = get(uxAtom);
  if (ux.newCitation || ux.citationIndex == undefined) return undefined;
  return get(citationsAtom)[ux.questionIndex][ux.citationIndex];
});

const citationHighlightsFor = (citation?: Citation) => {
  const boundingRegions = citation?.boundingRegions ?? [];

  return [
    ...new Set(boundingRegions.map(({ pageNumber }) => pageNumber)),
  ].map<CitationHighlight>((pageNumber) => ({
    pageNumber,
    polygons: boundingRegions
      .filter((boundingRegion) => boundingRegion.pageNumber === pageNumber)
      .map(({ polygon }) => polygon),
  }));
};

// when citationIndex !== undefined && keepCurrentCitation == false, we keep citationIndex if there are no unreviewed citations
// when citationIndex !== undefined && keepCurrentCitation == true, we keep citationIndex no matter what
function inferUXState(
  citations: Citation[][],
  questionIndex: number,
  citationIndex?: number,
  keepCurrentCitation = false
): UXState {
  const questionCitations = citations[questionIndex];

  if (!keepCurrentCitation) {
    if (questionCitations.length === 0) {
      citationIndex = undefined;
    } else {
      const index = questionCitations.findIndex(
        (citation) => citation.reviewStatus === ReviewStatus.Unreviewed
      );
      citationIndex = index == -1 ? citationIndex ?? 0 : index;
    }
  }

  const newCitation = false;
  let pageNumber = 1;
  let docIndex = 0;

  if (citationIndex == undefined)
    return {
      questionIndex,
      newCitation,
      pageNumber,
      docIndex,
      citationIndex,
    };

  const citationHighlights =
    citationIndex == undefined
      ? []
      : citationHighlightsFor(questionCitations[citationIndex]);

  if (citationHighlights.length) {
    [pageNumber] = citationHighlights
      .map(({ pageNumber }) => pageNumber)
      .sort();
    ({ docIndex } = questionCitations[citationIndex]);
  }

  return {
    questionIndex,
    newCitation,
    pageNumber,
    docIndex,
    citationIndex,
    citationHighlights,
  };
}

function locateUx(citations: Citation[][], ux: UXState) {
  let { docIndex, pageNumber } = ux;

  if (
    !ux.newCitation &&
    ux.citationIndex != undefined &&
    ux.citationHighlights.length
  ) {
    ({ docIndex } = citations[ux.questionIndex][ux.citationIndex]);
    [pageNumber] = ux.citationHighlights
      .map(({ pageNumber }) => pageNumber)
      .sort();
  }

  return { docIndex, pageNumber };
}

const _uxAtom = atom<UXState>(inferUXState(citations, 0));

export const uxAtom = atom<UXState, [Action], void>(
  (get) => get(_uxAtom),

  (get, set, action: Action) => {
    const ux = get(_uxAtom);
    const { questionIndex } = ux;

    const deselectCitation = (draft: UXState) => {
      // because UXState is a discriminated union, the we have to brute-force update these properties
      // in order to move the state from whatever it was to a NoCitationState
      (draft as NoCitationsState).citationIndex = undefined;
      delete (draft as Partial<CitationState>).citationHighlights;
    }

    const gotoPage = (draft: UXState, pageNumber: number, alwaysDeselectCitation = false) => {
      draft.pageNumber = pageNumber;
      // Deselect the current citation, unless moving to
      // a different page of the same multi-page citation.
      if (
        alwaysDeselectCitation ||
        draft.newCitation ||
        draft.citationIndex == undefined ||
        !draft.citationHighlights.find(
          ({ pageNumber }) => pageNumber == draft.pageNumber
        )
      ) {
        deselectCitation(draft);
      }
    };

    switch (action.type) {
      case "startNewCitation": {
        console.assert(!ux.newCitation);
        const { docIndex, pageNumber } = locateUx(get(citationsAtom), ux);
        set(_uxAtom, {
          questionIndex,
          newCitation: true,
          pageNumber,
          docIndex,
          selectedText: "",
        });
        break;
      }

      case "endNewCitation":
        console.assert(ux.newCitation);
        set(_uxAtom, inferUXState(get(citationsAtom), questionIndex));
        break;

      case "gotoCitation":
        set(
          _uxAtom,
          inferUXState(
            get(citationsAtom),
            questionIndex,
            action.citationIndex,
            true
          )
        );
        break;

      case "prevQuestion":
        set(_uxAtom, inferUXState(get(citationsAtom), questionIndex - 1));
        break;

      case "nextQuestion":
        set(_uxAtom, inferUXState(get(citationsAtom), questionIndex + 1));
        break;

      case "prevPage":
        set(
          _uxAtom,
          create(ux, (draft) => {
            gotoPage(draft, draft.pageNumber - 1);
          })
        );
        break;

      case "nextPage":
        set(
          _uxAtom,
          create(ux, (draft) => {
            gotoPage(draft, draft.pageNumber + 1);
          })
        );
        break;

      case "gotoPage":
        set(
          _uxAtom,
          create(ux, (draft) => {
            gotoPage(draft, action.pageNumber);
          })
        );
        break;

      case "gotoDoc":
        console.assert(ux.docIndex != action.docIndex);
        set(
          _uxAtom,
          create(ux, (draft) => {
            draft.docIndex = action.docIndex;
            gotoPage(draft, 1, true);
          })
        );
        break;

      case "setSelectedText":
        if (ux.newCitation) {
          set(
            _uxAtom,
            create(ux, (draft) => {
              draft.selectedText = action.selectedText;
            })
          );
        }
        break;

      case "addSelection": {
        console.assert(ux.newCitation);
        const { docIndex, selectedText } = ux as NewCitationState;
        set(
          citationsAtom,
          create(get(citationsAtom), (draft) => {
            draft[questionIndex].push({
              docIndex,
              boundingRegions: returnTextPolygonsFromDI(
                selectedText,
                docs[docIndex].response!
              ),
              excerpt: selectedText,
              reviewStatus: ReviewStatus.Approved,
            });
          })
        );
        break;
      }

      case "toggleReviewStatus": {
        const { questionIndex } = ux;
        let updatedReviewStatus: ReviewStatus;

        const updatedCitations = create(get(citationsAtom), (draft) => {
          const targetCitation = draft[questionIndex][action.citationIndex];
          updatedReviewStatus =
            targetCitation.reviewStatus === action.target
              ? ReviewStatus.Unreviewed
              : action.target;
          targetCitation.reviewStatus = updatedReviewStatus;
        });

        set(citationsAtom, updatedCitations);

        // After approving or rejecting the current citation, if there's still a citation that's unreviewed, go to it
        if (updatedReviewStatus! != ReviewStatus.Unreviewed) {
          set(
            _uxAtom,
            inferUXState(updatedCitations, questionIndex, action.citationIndex)
          );
        }
        break;
      }

      default:
        console.log("unhandled action", action);
    }
  }
);
