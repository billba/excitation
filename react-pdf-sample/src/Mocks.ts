import { Doc, Citation, ReviewStatus } from './Types'

export const mockDocs: Doc[] = [
  { filename: './compressed.tracemonkey-pldi-09.pdf', pages: 2 },
  { filename: './compressed.tracemonkey-pldi-09.pdf', pages: 3 },
]

export const mockCitations: Citation[][] = [
  // "How much would could a wood chuck chuck if a wood chuck could chuck wood?"
  [
    {
      excerpt: "Woodchucks can chew up to 700 pounds of wood in a single day.",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 1,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "Beavers can chew through wood with their teeth.",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 2,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "What is the airspeed velocity of an unladen swallow?"
  [
    {
      excerpt: "An African swallow can fly at 11 meters per second.",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 1,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "Why is a raven like a writing desk?",
  [
    {
      excerpt: "Both are used to write things.",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 2,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
  ],

  // "What is the answer to the ultimate question of life, the universe, and everything?",
  [
    {
      excerpt: "42",
      docIndex: 0,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 1,
      region: { top: 0, left: 0, width: 100, height: 100 },
    },
    {
      excerpt: "Netflix and chill",
      docIndex: 1,
      reviewStatus: ReviewStatus.Unreviewed,
      page: 3,
      region: { top: 0, left: 0, width: 100, height: 100 },
    }
  ]
]