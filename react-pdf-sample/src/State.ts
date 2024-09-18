import { atom } from 'jotai';

import { mockCitations, mockDocs } from "./Mocks";

export const docsAtom = atom(mockDocs)
export const citationsAtom = atom(mockCitations);
export const questionIndexAtom = atom<number>(0);
export const citationIndexAtom = atom<number>(0);
