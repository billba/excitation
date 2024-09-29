import { atom } from "jotai";
import { create } from "mutative";

import {
  Doc,
  Citation,
  CitationHighlight,
  UXState,
  Action,
  ReviewStatus,
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

const citationIndexAtom = atom(bestCitationIndex(citations[0]));

// when questionIndex is updated we also want to automatically update citationIndex
// so we essentially make _questionIndex private and add getter/setters
const _questionIndexAtom = atom<number>(0);
export const questionIndexAtom = atom<number, [number | ((i: number) => number)], void>(
  (get) => get(_questionIndexAtom),
  (get, set, questionIndex) => {
    set(_questionIndexAtom, questionIndex);
    set(citationIndexAtom, bestCitationIndex(get(questionCitationsAtom)));
  }
);

export const questionCitationsAtom = atom(
  (get) => get(citationsAtom)[get(_questionIndexAtom)]
);

const newCitationAtom = atom(false);
const selectedTextAtom = atom("");

const docIndexAtom = atom<number>(0);
const pageNumberAtom = atom<number>(0);

const currentCitationAtom = atom<Citation | undefined>((get) => {
  const questionCitations = get(questionCitationsAtom);
  const citationIndex = get(citationIndexAtom);
  return questionCitations.length > 0 && citationIndex !== undefined
    ? questionCitations[citationIndex]
    : undefined;
});

const citationHighlightsAtom = atom<CitationHighlight[]>((get) => {
  const boundingRegions = get(currentCitationAtom)?.boundingRegions ?? [];

  return [...new Set(boundingRegions.map(({ pageNumber }) => pageNumber))].map(
    (pageNumber) => ({
      pageNumber,
      polygons: boundingRegions
        .filter((boundingRegion) => boundingRegion.pageNumber === pageNumber)
        .map(({ polygon }) => polygon),
    })
  );
});

export const uxAtom = atom<UXState>((get) => {
  const newCitation = get(newCitationAtom);

  if (newCitation) {
    return {
      explore: true,
      pageNumber: get(pageNumberAtom)!,
      docIndex: get(docIndexAtom)!,
      newCitation,
      selectedText: get(selectedTextAtom),
    };
  }

  const citationIndex = get(citationIndexAtom);

  if (citationIndex === undefined) {
    // no citations for this question
    return {
      newCitation,
      explore: true,
      pageNumber: get(pageNumberAtom)!,
      docIndex: get(docIndexAtom)!,
      citationIndex,
    };
  }

  const citationHighlights = get(citationHighlightsAtom);

  if (citationHighlights.length === 0) {
    // unlocated citation
    return {
      newCitation,
      explore: true,
      pageNumber: get(pageNumberAtom)!,
      docIndex: get(docIndexAtom)!,
      citationIndex,
    };
  }

  // located citation
  console.assert(citationIndex !== undefined);
  return {
    newCitation,
    explore: false,
    citationIndex,
    citationHighlights,
  };
});

function bestCitationIndex(
  citations: Citation[],
  currentCitationIndex?: number
) {
  if (citations.length === 0) {
    return undefined;
  }
  const index = citations.findIndex(
    (citation) => citation.reviewStatus === ReviewStatus.Unreviewed
  );
  return index == -1 ? currentCitationIndex ?? 0 : index;
}

export const dispatchAtom = atom(null, (get, set, action: Action) => {
  const ux = get(uxAtom);

  switch (action.type) {
    case "startNewCitation":
      console.assert(!ux.newCitation);
      set(newCitationAtom, true);
      set(selectedTextAtom, "");
      if (!ux.explore) {
        set(pageNumberAtom, ux.citationHighlights[0].pageNumber);
        set(docIndexAtom, get(currentCitationAtom)!.docIndex);
      }
      break;

    case "endNewCitation":
      console.assert(ux.newCitation && ux.explore);
      set(newCitationAtom, false);
      set(citationIndexAtom, bestCitationIndex(get(questionCitationsAtom)));
      break;

    case "gotoCitation":
      set(citationIndexAtom, action.citationIndex);
      break;

    case "prevQuestion":
      set(questionIndexAtom, (i) => i - 1);
      break;
      
    case "nextQuestion":
      set(questionIndexAtom, (i) => i + 1);
      break;

    case "prevPage":
      console.assert(ux.explore);
      set(pageNumberAtom, (n) => n! - 1);
      break;

    case "nextPage":
      console.assert(ux.explore);
      set(pageNumberAtom, (n) => n! + 1);
      break;

    case "gotoPage":
      console.assert(ux.explore);
      set(pageNumberAtom, action.pageNumber);
      break;

    case "selectDoc":
      console.assert(ux.explore);
      set(docIndexAtom, action.docIndex);
      set(pageNumberAtom, 1);
      break;

    case "setSelectedText":
      if (ux.newCitation) {
        set(selectedTextAtom, action.selectedText);
      }
      break;

    case "addSelection": {
      console.assert(ux.newCitation && ux.explore);
      const docIndex = get(docIndexAtom)!;
      set(
        citationsAtom,
        create(get(citationsAtom), (draft) => {
          draft[get(questionIndexAtom)].push({
            docIndex,
            boundingRegions: returnTextPolygonsFromDI(
              get(selectedTextAtom),
              docs[docIndex].response!
            ),
            excerpt: get(selectedTextAtom),
            reviewStatus: ReviewStatus.Approved,
          });
        })
      );
      break;
    }

    case "toggleReviewStatus": {
      const questionIndex = get(questionIndexAtom);
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

      const citationIndex = get(citationIndexAtom);
      if (updatedReviewStatus! === ReviewStatus.Unreviewed) {
        if (action.citationIndex !== citationIndex) {
          // if the user "unreviewed" a citation that wasn't the current one, move to that one
          set(citationIndexAtom, action.citationIndex);
        }
      } else {
        set(
          citationIndexAtom,
          bestCitationIndex(updatedCitations[questionIndex], citationIndex)
        );
      }

      break;
    }

    default:
      console.log("unhandled action", action);
  }
});
