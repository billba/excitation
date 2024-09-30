import { atom } from "jotai";
import { create } from "mutative";
import {
  Doc,
  Citation,
  CitationHighlight,
  UXState,
  Action,
  ReviewStatus,
  ExploreStates,
  NewCitationState,
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
function inferUXState(citations: Citation[][], questionIndex: number, citationIndex?: number, keepCurrentCitation = false): UXState {
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

  const citationHighlights =
    citationIndex == undefined
      ? []
      : citationHighlightsFor(questionCitations[citationIndex]);

  return citationIndex == undefined || citationHighlights.length === 0
    ? {
        questionIndex,
        newCitation: false,
        explore: true,
        pageNumber: 1,
        docIndex: 0,
        citationIndex,
      }
    : {
        questionIndex,
        newCitation: false,
        explore: false,
        citationIndex,
        citationHighlights,
      };
}

const _uxAtom = atom<UXState>(inferUXState(citations, 0));

export const uxAtom = atom<UXState, [Action], void>(
  (get) => get(_uxAtom),

  (get, set, action: Action) => {
    const ux = get(_uxAtom);

    switch (action.type) {
      case "startNewCitation":
        console.assert(!ux.newCitation);
        set(_uxAtom, {
          questionIndex: ux.questionIndex,
          newCitation: true,
          explore: true,
          pageNumber: ux.explore
            ? ux.pageNumber
            : ux.citationHighlights[0].pageNumber,
          docIndex: ux.explore
            ? ux.docIndex
            : get(citationsAtom)[ux.questionIndex][ux.citationIndex].docIndex,
          selectedText: "",
        });
        break;

      case "endNewCitation":
        console.assert(ux.newCitation && ux.explore);
        set(_uxAtom, inferUXState(get(citationsAtom), ux.questionIndex));
        break;

      case "gotoCitation":
        set(_uxAtom, inferUXState(get(citationsAtom), ux.questionIndex, action.citationIndex, true));
        break;

      case "prevQuestion":
        set(_uxAtom, inferUXState(get(citationsAtom), ux.questionIndex - 1));
        break;

      case "nextQuestion":
        set(_uxAtom, inferUXState(get(citationsAtom), ux.questionIndex + 1));
        break;

      case "prevPage":
        console.assert(ux.explore);
        set(
          _uxAtom,
          create(ux as ExploreStates, (draft) => {
            draft.pageNumber--;
          })
        );
        break;

      case "nextPage":
        console.assert(ux.explore);
        set(
          _uxAtom,
          create(ux, (draft) => {
            (draft as ExploreStates).pageNumber++;
          })
        );
        break;

      case "gotoPage":
        console.assert(ux.explore);
        set(
          _uxAtom,
          create(ux as ExploreStates, (draft) => {
            draft.pageNumber = action.pageNumber;
          })
        );
        break;

      case "gotoDoc":
        console.assert(ux.explore);
        set(
          _uxAtom,
          create(ux as ExploreStates, (draft) => {
            draft.docIndex = action.docIndex;
            draft.pageNumber = 1;
          })
        );
        break;

      case "setSelectedText":
        if (ux.newCitation) {
          set(
            _uxAtom,
            create(ux as NewCitationState, (draft) => {
              draft.selectedText = action.selectedText;
            })
          );
        }
        break;

      case "addSelection": {
        console.assert(ux.newCitation && ux.explore);
        const { docIndex, selectedText } = ux as NewCitationState;
        set(
          citationsAtom,
          create(get(citationsAtom), (draft) => {
            draft[ux.questionIndex].push({
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
          set(_uxAtom, inferUXState(updatedCitations, questionIndex, action.citationIndex));
        };
        break;
      }

      default:
        console.log("unhandled action", action);
    }
  }
);
