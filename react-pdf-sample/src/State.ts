import { atom } from "jotai";
import { create } from "mutative";

import { Doc } from "./Types";
import { mockCitations, mockDocs } from "./Mocks";

import { locateCitations } from "./Utility";

async function docsWithResponses(docs: Doc[]) {
  return await Promise.all(
    docs.map(async (doc) =>
      create(doc, async (draft) => {
        draft.response = await (await fetch(doc.filename + ".json")).json();
      })
    )
  );
}

const docs = await docsWithResponses(mockDocs);

console.log(docs);

const citations = locateCitations(docs, mockCitations);

console.log(citations);

export const docsAtom = atom(docs);
export const citationsAtom = atom(citations);
export const questionIndexAtom = atom(0);
export const citationIndexAtom = atom(0);

// derived atoms

export const currentCitationAtom = atom(
  (get) => get(citationsAtom)[get(questionIndexAtom)][get(citationIndexAtom)]
);

export const pageNumbersAtom = atom((get) => {
  const { boundingRegions } = get(currentCitationAtom);

  return [...new Set(boundingRegions?.map(({ pageNumber }) => pageNumber))];
});

// it would be nice if boundingRegions came in this convenient format

export const highlightsForPageAtom = atom((get) => {
  const { boundingRegions } = get(currentCitationAtom);

  return boundingRegions
    ? get(pageNumbersAtom).map((pageNumber) => {
        return {
          pageNumber,
          polygons: boundingRegions
            .filter(
              (boundingRegion) => boundingRegion.pageNumber === pageNumber
            )
            .map(({ polygon }) => polygon),
        };
      })
    : [];
});
