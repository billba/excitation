import { expect, test } from 'vitest'
import { createRegions, setDocumentDelta } from './Preprocess'
import { DocIntResponse } from './Types'

import json0 from "../../../local-backend/files/PressReleaseFY24Q3.pdf.json"
import json1 from "../../../local-backend/files/Microsoft 10Q FY24Q3 1.pdf.json"
import json2 from "../../../local-backend/files/compressed.tracemonkey-pldi-09.pdf.json"

const createRegionsTest = (
  di: DocIntResponse
) => test(`createRegionsTest`, () => {
  createRegions(di);

  for (const page of di.analyzeResult.pages)
    expect(page.regions).toBeDefined();
})

const setDocumentDeltaTest = (
  di: DocIntResponse
) => test(`setDocumentDeltaTest`, () => {
  setDocumentDelta(di);

  expect(di.analyzeResult.delta).toBeDefined();
})

let di0 = json0 as DocIntResponse;
let di1 = json1 as DocIntResponse;
let di2 = json2 as DocIntResponse;

createRegionsTest(di0);
createRegionsTest(di1);
createRegionsTest(di2);

setDocumentDeltaTest(di0);
setDocumentDeltaTest(di1);
setDocumentDeltaTest(di2);
