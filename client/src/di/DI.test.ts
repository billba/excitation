import { expect, test } from 'vitest'
import { createRegions } from './Preprocess'
import { rangeToSummary, excerptToSummary } from "./DI"
import { CursorRange, DocIntResponse, Summary } from './Types'

import json0 from "../../../local-backend/files/PressReleaseFY24Q3.pdf.json"

const rangeToSummaryTest = (
  description: string,
  range: CursorRange,
  di: DocIntResponse,
  expected: Summary
) => test(`rangeToSummaryTest | ${description}`, () => {
  let actual = rangeToSummary(range, di);
  expect(actual).toEqual(expected);
})

let di0 = json0 as DocIntResponse;
createRegions(di0);

let point0 = { x: 0, y: 0 };
let range0 = {
  start: { point: point0, page: 1 },
  end: { point: point0, page: 1 }
};
let summary0 = {} as Summary;
rangeToSummaryTest("summary should be empty", range0, di0, summary0);

let point1 = { x: 1, y: 1.1 }; // Within first word 'Microsoft'
let range1 = {
  start: { point: point1, page: 1 },
  end: { point: point1, page: 1 }
};
let summary1 = {
  excerpt: "Microsoft",
  polygons: [
    {
      polygon: [0.998, 1.0456,
                1.8337, 1.0408,
                1.8289, 1.2318,
                0.9933, 1.2174],
      page: 1
    }
  ]
}
rangeToSummaryTest("summary should be single word", range1, di0, summary1);

let point2 = { x: 5, y: 1.1 }; // within 7th word 'Results'
let range2 = {
  start: { point: point1, page: 1 },
  end: { point: point2, page: 1 }
};
let summary2 = {
  excerpt: "Microsoft Cloud Strength Fuels Third Quarter Results",
  polygons: [
    {
      polygon: [0.9933, 1.0408,
                5.4916, 1.0408,
                5.4916, 1.2413,
                0.9933, 1.2413],
      page: 1
    }
  ]
};
rangeToSummaryTest("summary should be multi-word string and 4-pt poly", range2, di0, summary2);
