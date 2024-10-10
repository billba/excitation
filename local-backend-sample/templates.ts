import { Template } from "./excitation.ts";

export const templates: Template[] = [
  {
    name: "Microsoft Fiscal Quarterly",
    questions: [
      {
        prefix: "1",
        text: "What was the company’s revenue for the third quarter of Fiscal Year 2024?",
      },
      {
        prefix: "2a",
        text: "What are the earnings per share (EPS) for this quarter?",
      },
      {
        prefix: "3",
        text: "How much money did Microsoft return to shareholders in the form of share repurchases?",
      },
      {
        prefix: "4",
        text: "What are the total assets reported?",
      },
      {
        prefix: "5",
        text: "Are there any ongoing legal proceedings?",
      },
      {
        prefix: "6",
        text: "What is a quote that spans two pages",
      },
    ],
    formBootstraps: [
      {
        name: "Microsoft FY24Q3",
        citations: [
          [
            {
              excerpt: "Revenue was $61.9 billion and increased 17%.",
              documentId: 13,
              review: 0,
            },
            {
              excerpt: "61,858",
              documentId: 1967,
              review: 0,
            },
          ],
          [
            {
              excerpt: "$2.94",
              documentId: 13,
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.",
              documentId: 13,
              review: 0,
            },
          ],
          [
            {
              excerpt: "484,275",
              documentId: 13,
              review: 0,
            },
            {
              excerpt: "484,275",
              documentId: 1967,
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "Claims against us that may result in adverse outcomes in legal disputes.",
              documentId: 13,
              review: 0,
            },
            {
              excerpt:
                "Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused their brain tumors and other adverse health effects.",
              documentId: 1967,
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "· laws and regulations relating to the handling of personal data that may impede the adoption of our services or result in increased costs, legal claims, fines, or reputational damage;\n· claims against us that may result in adverse outcomes in legal disputes;",
              documentId: 13,
              review: 0,
            },
          ],
        ],
      },
    ],
  },
];
