import { expect, test } from 'vitest'
import { createRegions, setDocumentDelta } from './Preprocess'
import { DocIntResponse } from './Types'

import json0 from "../../../local-backend/files/PressReleaseFY24Q3.pdf.json"
import json1 from "../../../local-backend/files/Microsoft 10Q FY24Q3 1.pdf.json"
import json2 from "../../../local-backend/files/compressed.tracemonkey-pldi-09.pdf.json"

const createRegionsTest = (
  description: string,
  di: DocIntResponse
) => test(`createRegionsTest | ${description}`, () => {
  createRegions(di);

  expect(di.analyzeResult.delta).toBeDefined();

  for (const page of di.analyzeResult.pages)
    expect(page.regions).toBeDefined();
})

const setDocumentDeltaTest = (
  description: string,
  di: DocIntResponse,
  expected: number
) => test(`setDocumentDeltaTest | ${description}`, () => {
  setDocumentDelta(di);

  expect(di.analyzeResult.delta).toBeDefined();
  expect(di.analyzeResult.delta).toBe(expected);
})

let di0 = json0 as DocIntResponse;
let di1 = json1 as DocIntResponse;
let di2 = json2 as DocIntResponse;

createRegionsTest("PressReleaseFY24Q3.pdf.json", di0);
createRegionsTest("Microsoft 10Q FY24Q3 1.pdf.json", di1);
createRegionsTest("compressed.tracemonkey-pldi-09.pdf.json", di2);

setDocumentDeltaTest("PressReleaseFY24Q3.pdf.json", di0, 0.2);
setDocumentDeltaTest("Microsoft 10Q FY24Q3 1.pdf.json", di1, 0.2);
setDocumentDeltaTest("compressed.tracemonkey-pldi-09.pdf.json", di2, 0.2);
