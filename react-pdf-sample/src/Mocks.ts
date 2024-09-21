import { Doc, Citation } from './Types'

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
      reviewStatus: 0,
    },
    {
      excerpt: "61,858",
      docIndex: 1,
      reviewStatus: 0,
    },
  ],

  // "What are the earnings per share (EPS) for this quarter?"
  [
    {
      excerpt: "$2.94",
      docIndex: 0,
      reviewStatus: 0,
    },
  ],

  // "How much money did Microsoft return to shareholders in the form of share repurchases?",
  [
    {
      excerpt: "Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.",
      docIndex: 0,
      reviewStatus: 0,
    },
  ],

  // "What are the total assets reported?",
  [
    {
      excerpt: "484,275",
      docIndex: 0,
      reviewStatus: 0,
    },
    {
      excerpt: "484,275",
      docIndex: 1,
      reviewStatus: 0,
    }
  ],
       // "Are there any ongoing legal proceedings?",
  [
    {
      excerpt: "Claims against us that may result in adverse outcomes in legal disputes.",
      docIndex: 0,
      reviewStatus: 0,
    },
    {
      excerpt: "Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused their brain tumors and other adverse health effects.",
      docIndex: 1,
      reviewStatus: 0,
    }
  ]
]
