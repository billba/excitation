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
  ],
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
  ],
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
  ],
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
       // "Are there any ongoing legal proceedings mentioned in the document? Please quote the exact text that answers this question.",
  [
    {
      excerpt: "Claims against us that may result in adverse outcomes in legal disputes.",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 5,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits
filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused
their brain tumors and other adverse health effects. We assumed responsibility for these claims in our agreement to acquire Nokia’s Devices
and Services business and have been substituted for the Nokia defendants. Twelve of these cases were consolidated for certain pre-trial
proceedings; the remaining cases are stayed. In a separate 2009 decision, the Court of Appeals for the District of Columbia held that adverse
health effect claims arising from the use of cellular handsets that operate within the U.S. Federal Communications Commission radio
frequency emission guidelines (“FCC Guidelines”) are pre-empted by federal law. The plaintiffs allege that their handsets either operated
outside the FCC Guidelines or were manufactured before the FCC Guidelines went into effect. The lawsuits also allege an industry-wide
conspiracy to manipulate the science and testing around emission guidelines.",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 25,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
]
