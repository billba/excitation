import { expect, test } from "vitest";
import { createPerPageRegions } from "../../Preprocess";
import { excerptToSummary, rangeToSummary } from "../../DI";
import { CursorRange, DocIntResponse, SearchResultSegment, Summary } from "../../Types";
import { exactMatchSearch } from "../../Utility";

import json0 from "../../../../../local-backend/files/PressReleaseFY24Q3.pdf.json";

const rangeToSummaryTest = (
  description: string,
  range: CursorRange,
  di: DocIntResponse,
  expected: Summary
) =>
  test(`rangeToSummaryTest  | ${description}`, () => {
    const actual = rangeToSummary(range, di);
    expect(actual).toEqual(expected);
  });

const excerptToSummaryTest = (
  description: string,
  excerpt: string,
  di: DocIntResponse,
  expected: Summary
) =>
  test(`excerptToSummaryTest | ${description}`, () => {
    const actual = excerptToSummary(excerpt, di);
    expect(actual).toEqual(expected);
  });

const di0 = json0 as DocIntResponse;
createPerPageRegions(di0);

const point0 = { x: 0, y: 0 };
const range0 = {
  start: { point: point0, page: 1 },
  end: { point: point0, page: 1 },
};
// TODO: this doesn't work because we have the get the nearest point... should we up the sensitivity?
const summary0 = {} as Summary;
const excerpt0a = "";
const excerpt0b = "sadjfksajdh";
excerptToSummaryTest(
  "summary should be empty (excerpt undefined)",
  summary0.excerpt,
  di0,
  summary0
);
excerptToSummaryTest(
  "summary should be empty (given empty string)",
  excerpt0a,
  di0,
  summary0
);
excerptToSummaryTest(
  "summary should be empty (not found in document)",
  excerpt0b,
  di0,
  summary0
);

const point1 = { x: 1, y: 1.1 }; // Within first word 'Microsoft'
const range1a = {
  start: { point: point1, page: 1 },
  end: { point: point1, page: 1 },
};
const range1b = {
  start: { point: point1, page: 1 },
  end: { point: point0, page: 1 },
};
const summary1: Summary = {
  excerpt: "Microsoft",
  polygons: [
    {
      polygon: {
        head: [0.9867, 1.0329, 1.8167, 1.033, 1.8167, 1.2391, 0.9865, 1.2376],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest(
  "summary should be closest word, even if the point is not in a word (single point of 0,0 given)",
  range0,
  di0,
  summary1
);
rangeToSummaryTest(
  "summary should be single word (single point given)",
  range1a,
  di0,
  summary1
);
rangeToSummaryTest(
  "summary should be single word (bad end point given)",
  range1b,
  di0,
  summary1
);
excerptToSummaryTest(
  "summary should be single poly (given word)",
  summary1.excerpt,
  di0,
  summary1
);

const point2 = { x: 5, y: 1.1 }; // within 7th word 'Results'
const range2 = {
  start: { point: point1, page: 1 },
  end: { point: point2, page: 1 },
};
const summary2: Summary = {
  excerpt: "Microsoft Cloud Strength Fuels Third Quarter Results",
  polygons: [
    {
      polygon: {
        head: [0.9865, 1.0309, 5.5062, 1.0309, 5.5062, 1.2401, 0.9865, 1.2401],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest(
  "summary should be multi-word string and 4-pt poly",
  range2,
  di0,
  summary2
);
excerptToSummaryTest(
  "summary should be single poly4 (given line)",
  summary2.excerpt,
  di0,
  summary2
);

const point3a = { x: 6, y: 1.5 };
const point3b = { x: 1, y: 1.7 };
const range3 = {
  start: { point: point3a, page: 1 },
  end: { point: point3b, page: 1 },
};
const summary3: Summary = {
  excerpt: "following results for the quarter",
  polygons: [
    {
      polygon: {
        head: [5.8592, 1.4351, 7.3213, 1.4351, 7.3213, 1.611, 5.8592, 1.611],
        tail: [0.9861, 1.6485, 1.4455, 1.6483, 1.4462, 1.8246, 0.9869, 1.8267],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest(
  "summary should continue across line breaks",
  range3,
  di0,
  summary3
);
excerptToSummaryTest(
  "summary should continue across line breaks",
  summary3.excerpt,
  di0,
  summary3
);

const point4a = { x: 1.3, y: 9.8 };
const point4b = { x: 7.2, y: 1.1 };
const range4 = {
  start: { point: point4a, page: 1 },
  end: { point: point4b, page: 2 },
};
const summary4: Summary = {
  excerpt:
    ". Search and news advertising revenue excluding traffic acquisition costs increased 12% Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third",
  polygons: [
    {
      polygon: {
        head: [1.246, 9.7103, 6.7615, 9.7103, 6.7615, 9.8762, 1.246, 9.8762],
      },
      page: 1,
    },
    {
      polygon: {
        head: [0.9908, 1.0199, 7.4803, 1.0199, 7.4803, 1.1892, 0.9908, 1.1892],
      },
      page: 2,
    },
  ],
};
rangeToSummaryTest(
  "summary should continue across page breaks",
  range4,
  di0,
  summary4
);
excerptToSummaryTest(
  "summary should continue across page breaks",
  summary4.excerpt,
  di0,
  summary4
);

const point5a = { x: 1, y: 3.1 };
const point5b = { x: 4, y: 3.3 };
const range5 = {
  start: { point: point5a, page: 1 },
  end: { point: point5b, page: 1 },
};
const summary5: Summary = {
  excerpt: `"Microsoft Copilot and Copilot stack are orchestrating a new era of Al transformation, driving better business outcomes across every role and industry,"`,
  polygons: [
    {
      polygon: {
        head: [0.9935, 3.0123, 7.111, 3.0123, 7.111, 3.1887,0.9935, 3.1887],
        tail: [0.9877, 3.2282, 4.0989, 3.2282, 4.0989, 3.4046, 0.9877, 3.4046],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest("summary should be single poly6", range5, di0, summary5);
excerptToSummaryTest(
  "summary should be single poly6",
  summary5.excerpt,
  di0,
  summary5
);

const point6a = { x: 6, y: 3.9 };
const point6b = { x: 2, y: 4.3 };
const range6 = {
  start: { point: point6a, page: 1 },
  end: { point: point6b, page: 1 },
};
const summary6: Summary = {
  excerpt:
    'driven by strong execution by our sales teams and partners," said Amy Hood, executive vice president and chief financial officer of Microsoft.',
  polygons: [
    {
      polygon: {
        head: [5.9125, 3.8228, 6.9173, 3.8228, 6.9173, 4.0081, 5.9125, 4.0081],
        body: [0.9868, 4.0271, 7.3158, 4.0271, 7.3158, 4.2122, 0.9868, 4.2122],
        tail: [0.9865, 4.2418, 2.2025, 4.2418, 2.2025, 4.4096, 0.9865, 4.4096] ,
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest("summary should be single poly8", range6, di0, summary6);
excerptToSummaryTest(
  "summary should be single poly8",
  summary6.excerpt,
  di0,
  summary6
);

const point7a = { x: 1, y: 4.3 };
const point7b = { x: 2, y: 4.7 };
const range7 = {
  start: { point: point7a, page: 1 },
  end: { point: point7b, page: 1 },
};
const summary7: Summary = {
  excerpt: "officer of Microsoft. Business Highlights",
  polygons: [
    {
      polygon: {
        head: [0.9865, 4.2418, 2.2025, 4.2418, 2.2025, 4.4096, 0.9865, 4.4096],
      },
      page: 1,
    },
    {
      polygon: {
        head: [0.9897, 4.6234, 2.2799, 4.6234, 2.2799, 4.8052, 0.9897, 4.8052],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest(
  "summary should continue across regions",
  range7,
  di0,
  summary7
);
excerptToSummaryTest(
  "summary should continue across regions",
  summary7.excerpt,
  di0,
  summary7
);

const point8a = { x: 1.0, y: 3.1 };
const point8b = { x: 7.1, y: 3.3 };
const range8 = {
  start: { point: point8a, page: 1 },
  end: { point: point8b, page: 1 },
};
const summary8: Summary = {
  excerpt:
    "\"Microsoft Copilot and Copilot stack are orchestrating a new era of Al transformation, driving better business outcomes across every role and industry,\" said Satya Nadella, chairman and chief executive",
  polygons: [
    {
      polygon: {
        body: [0.9877, 3.0123, 7.1165, 3.0123, 7.1165, 3.4046, 0.9877, 3.4046],
      },
      page: 1,
    },
  ],
};
rangeToSummaryTest(
  "summary should be single poly4, not head + tail",
  range8,
  di0,
  summary8
);
excerptToSummaryTest(
  "summary should be single poly4, not head + tail",
  summary8.excerpt,
  di0,
  summary8
);



const exactMatchSearchTest = (
  description: string,
  input: string,
  di: DocIntResponse,
  expected: []
) =>
  test(`exactMatchSearchTest | ${description}`, () => {
    const actual = exactMatchSearch(input, di);
    expect(actual).toEqual(expected);
  });

  const input0 = "sadjfksajdh"
  // expected should be a empty array
  exactMatchSearchTest(
   "the input should not be found in the document",
    input0,
    di0,
    []
  );

  const input1 = "Microsoft Cloud Strength Fuels Third Quarter Results"
  const searchResult1: SearchResultSegment = {
    text: "Microsoft Cloud Strength Fuels Third Quarter Results",
    page: 1,
    boundingRegions: 
    {
      head: [0.9865, 1.0309, 5.5062, 1.0309, 5.5062, 1.2401, 0.9865, 1.2401],
    },
  };
  
  const expected1 = [{segments: [searchResult1], matchingRatio:1}];

  exactMatchSearchTest(
    "should find one exact match in the document",
    input1,
    di0,
    expected1 as []
  );

const input2 = "Revenue in"
const expected2 = [
  {
    segments: 
    [
      {
      text: "Revenue in",
      page: 1,
      boundingRegions:
      {
        head: [0.9898, 4.9695, 1.65, 4.9695, 1.65, 5.1483, 0.9898, 5.1483],
      }
    } as SearchResultSegment,
  ],
    matchingRatio: 1
  },
  {
    segments: 
    [
      {
      text: "Revenue in",
      page: 1,
      boundingRegions:{
        head: [0.9903, 7.1594, 1.6489, 7.1594, 1.6489, 7.3416, 0.9903, 7.3416],
      }
    } as SearchResultSegment,
  ],
    matchingRatio: 1
  },
  {
    segments: 
    [
      {
      text: "Revenue in",
      page: 1,
      boundingRegions:{
        head: [0.989, 8.0757, 1.6541, 8.0757, 1.6541, 8.253, 0.989, 8.253],
      }
    } as SearchResultSegment,
  ],
    matchingRatio: 1
  },
];


exactMatchSearchTest(
  "should multi exact matches in the document",
  input2,
  di0,
  expected2 as []
);
