import { expect, test } from 'vitest'
import { createRegions } from './Preprocess'
import { excerptToSummary, rangeToSummary } from "./DI"
import { CursorRange, DocIntResponse, Summary } from './Types'

import json0 from "../../../local-backend/files/PressReleaseFY24Q3.pdf.json"

const rangeToSummaryTest = (
  description: string,
  range: CursorRange,
  di: DocIntResponse,
  expected: Summary
) => test(`rangeToSummaryTest  | ${description}`, () => {
  let actual = rangeToSummary(range, di);
  expect(actual).toEqual(expected);
})

const excerptToSummaryTest = (
  description: string,
  excerpt: string,
  di: DocIntResponse,
  expected: Summary
) => test(`excerptToSummaryTest | ${description}`, () => {
  let actual = excerptToSummary(excerpt, di);
  expect(actual).toEqual(expected);
})

const di0 = json0 as DocIntResponse;
createRegions(di0);

const point0 = { x: 0, y: 0 };
const range0 = {
  start: { point: point0, page: 1 },
  end: { point: point0, page: 1 }
};
const summary0 = {} as Summary;
rangeToSummaryTest("summary should be empty (bad start and end points)", range0, di0, summary0);
const excerpt0a = "";
const excerpt0b = "sadjfksajdh";
excerptToSummaryTest("summary should be empty (excerpt undefined)", summary0.excerpt, di0, summary0);
excerptToSummaryTest("summary should be empty (given empty string)", excerpt0a, di0, summary0);
excerptToSummaryTest("summary should be empty (not found in document)", excerpt0b, di0, summary0);

const point1 = { x: 1, y: 1.1 }; // Within first word 'Microsoft'
const range1a = {
  start: { point: point1, page: 1 },
  end: { point: point1, page: 1 }
};
const range1b = {
  start: { point: point1, page: 1 },
  end: { point: point0, page: 1 }
};
const summary1 = {
  excerpt: "Microsoft",
  polygons: [
    { polygon: 
      {
        type: "h",
        head: [0.998, 1.0456,
              1.8337, 1.0408,
              1.8289, 1.2318,
              0.9933, 1.2174]},
      page: 1 }
  ]
}
rangeToSummaryTest("summary should be single word (single point given)", range1a, di0, summary1);
rangeToSummaryTest("summary should be single word (bad end point given)", range1b, di0, summary1);
excerptToSummaryTest("summary should be single poly (given word)", summary1.excerpt, di0, summary1);

const point2 = { x: 5, y: 1.1 }; // within 7th word 'Results'
const range2 = {
  start: { point: point1, page: 1 },
  end: { point: point2, page: 1 }
};
const summary2 = {
  excerpt: "Microsoft Cloud Strength Fuels Third Quarter Results",
  polygons: [
    { polygon: {
        type: "h",
        head: [0.9933, 1.0408,
              5.4916, 1.0408,
              5.4916, 1.2413,
              0.9933, 1.2413]},
      page: 1 }
  ]
};
rangeToSummaryTest("summary should be multi-word string and 4-pt poly", range2, di0, summary2);
excerptToSummaryTest("summary should be single poly4 (given line)", summary2.excerpt, di0, summary2);

const point3a = { x: 6, y: 1.5 };
const point3b = { x: 1, y: 1.7 };
const range3 = {
  start: { point: point3a, page: 1 },
  end: { point: point3b, page: 1 }
};
const summary3 = {
	excerpt: "following results for the quarter",
	polygons: [
		{ polygon: {
        type: "ht",
        head: [5.8402, 1.4371,
              7.3253, 1.4371,
              7.3253, 1.6089,
              5.8402, 1.6089],
        tail: [0.9885, 1.6662,
              1.4326, 1.6615,
              1.4374,	1.819,
              0.9933,	1.819]},
			page: 1 }
	]
}
rangeToSummaryTest("summary should continue across line breaks", range3, di0, summary3);
excerptToSummaryTest("summary should continue across line breaks", summary3.excerpt, di0, summary3);

const point4a = { x: 1.3, y: 9.8 };
const point4b = { x: 7.2, y: 1.1 };
const range4 = {
  start: { point: point4a, page: 1 },
  end: { point: point4b, page: 2 }
};
const summary4 = {
  excerpt: "· Search and news advertising revenue excluding traffic acquisition costs increased 12% Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third",
  polygons: [
    { polygon: {
        type: "h",
        head: [1.2368, 9.7109,
              6.7427, 9.7109,
              6.7427, 9.878,
              1.2368, 9.878]},
      page: 1 },
    { polygon: {
        type: "h",
        head: [0.9885, 1.0265,
              7.4685, 1.0265,
              7.4685, 1.1888,
              0.9885,1.1888]},
      page: 2 }
  ]
};
rangeToSummaryTest("summary should continue across page breaks", range4, di0, summary4);
excerptToSummaryTest("summary should continue across page breaks", summary4.excerpt, di0, summary4);

const point5a = { x: 1, y: 3.1 };
const point5b = { x: 4, y: 3.3 };
const range5 = {
  start: { point: point5a, page: 1 },
  end: { point: point5b, page: 1 }
};
const summary5 = {
  excerpt: `"Microsoft Copilot and Copilot stack are orchestrating a new era of Al transformation, driving better business outcomes across every role and industry,"`,
  polygons: [
    { polygon: {
        type: "ht",
        head: [0.998, 3.0221,
              7.1056, 3.0221,
              7.1056, 3.1892,
              0.998, 3.1892],
        tail: [0.998, 3.2322,
              4.1067, 3.2322,
              4.1067, 3.3993,
              0.998, 3.3993]},
      page: 1 }
  ]
}
rangeToSummaryTest("summary should be single poly6", range5, di0, summary5);
excerptToSummaryTest("summary should be single poly6", summary5.excerpt, di0, summary5);

const point6a = { x: 6, y: 3.9 };
const point6b = { x: 2, y: 4.3 };
const range6 = {
  start: { point: point6a, page: 1 },
  end: { point: point6b, page: 1 }
};
const summary6 = {
  excerpt: "driven by strong execution by our sales teams and partners,\" said Amy Hood, executive vice president and chief financial officer of Microsoft.",
  polygons: [
    { polygon: {
        type: "hbt",
        head: [5.8975, 3.8242,
              6.9098, 3.8242,
              6.9098, 4.0009,
              5.8975, 4.0009],
        body: [0.9885, 4.0343,
              7.3253, 4.0343,
              7.3253, 4.2109,
              0.9885, 4.2109],
        tail: [0.9933, 4.2491,
              2.2062, 4.2491,
              2.2062, 4.4067,
              0.9933, 4.4067]},
      page: 1 }
  ]
};
rangeToSummaryTest("summary should be single poly8", range6, di0, summary6);
excerptToSummaryTest("summary should be single poly8", summary6.excerpt, di0, summary6);

const point7a = { x: 1, y: 4.3 };
const point7b = { x: 2, y: 4.7 };
const range7 = {
  start: { point: point7a, page: 1 },
  end: { point: point7b, page: 1 }
};
const summary7 = {
  excerpt: "officer of Microsoft. Business Highlights",
  polygons: [
    { polygon: {
        type: "h",
        head: [0.9933, 4.2491,
                2.2062, 4.2491,
                2.2062, 4.4067,
                0.9933,4.4067]},
      page: 1 },
    { polygon: {
        type: "h",
        head: [0.998, 4.6311,
              2.2635, 4.6311,
              2.2635, 4.7982,
              0.998, 4.7982]},
      page: 1 }
  ]
};
rangeToSummaryTest("summary should continue across regions", range7, di0, summary7);
excerptToSummaryTest("summary should continue across regions", summary7.excerpt, di0, summary7);

const point8a = { x: 2, y: 8.7 };
const point8b = { x: 7, y: 8.9 };
const range8 = {
  start: { point: point8a, page: 1 },
  end: { point: point8b, page: 1 }
};
const summary8 = {
  excerpt: "Windows revenue increased 11% with Windows OEM revenue growth of 11% and Windows Commercial products and cloud services revenue growth of 13% (up 12% in constant currency)",
  polygons: [
    { polygon: {
        type: "b",
        body: [1.4899, 8.651,
              7.2871, 8.651,
              7.2871, 9.0282,
              1.4899, 9.0282]},
      page: 1 }
  ]
};
rangeToSummaryTest("summary should be single poly4, not head + tail", range8, di0, summary8);
excerptToSummaryTest("summary should be single poly4, not head + tail", summary8.excerpt, di0, summary8);