import { Doc, Citation, ReviewStatus } from './Types'

export const mockDocs: Doc[] = [
  { filename: './PressReleaseFY24Q3.pdf', pages: 10 },
  { filename: './Microsoft 10Q FY24Q3 1.pdf', pages: 73 },
]

export const mockCitations: Citation[][] = [
  // "What was the company’s revenue for the third quarter of Fiscal Year 2024?"
  [
    {
      excerpt: "Revenue was $61.9 billion and increased 17%.",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 1,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "61,858",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 29,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "What are the earnings per share (EPS) for this quarter?"
  [
    {
      excerpt: "$2.94",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 1,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "How much money did Microsoft return to shareholders in the form of share repurchases?",
  [
    {
      excerpt: "Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 2,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "What are the total assets reported?",
  [
    {
      excerpt: "484,275",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 8,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "484,275",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 5,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
    // "What are the total liabilities reported?",
  [
    {
      excerpt: "231,123",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 8,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "231,123",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 5,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
    // "What is the net cash provided by operating activities?",
  [
    {
      excerpt: "31,917",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 9,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "31,917",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 6,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
     // "What is the net cash used in financing activities?",
  [
    {
      excerpt: "18,808",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 9,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "18,808",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 6,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
]
