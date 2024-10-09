interface Template {
  name: string;
  questions: Question[];
  formBootstraps: { name: string; citations: Citation[][] }[];
}

interface Form {
  name: string;
  templateId: number;
  citations: Citation[][];
}

interface FormMetadata {
  templateName: string;
  formName: string;
  formId: number;
}

interface FormDocument {
  name: string;
  diUrl: string;
  pdfUrl: string;
  documentId: number;
}

enum Review {
  Unreviewed,
  Approved,
  Rejected,
}

interface Bounds {
  pageNumber: number;
  polygon: number[];
}

interface Citation {
  excerpt: string;
  documentId: number;
  citationId: string;
  review: Review;
  bounds?: Bounds[];
}

interface Question {
  prefix?: string;
  text: string;
}

interface ClientQuestion extends Question {
  citations: Citation[];
}

interface ClientForm {
  metadata: FormMetadata;
  documents: FormDocument[];
  questions: ClientQuestion[];
}

export type Event =
  | {
      type: "mockEvent";
      delay: number;
      error?: {
        count: number;
        description: string;
      };
    }
  | {
      type: "addCitation";
      formId: number;
      questionId: number;
      documentId: number;
      citationId: string;
      excerpt: string;
      bounds: Bounds[];
      review: Review;
      creator: string;
    }
  | {
      type: "updateReview";
      citationId: string;
      review: Review;
      creator: string;
    }
  | {
      type: "updateBounds";
      citationId: string;
      bounds: Bounds[];
      creator: string;
    };

const documents: FormDocument[] = [
  {
    pdfUrl: "PressReleaseFY24Q3.pdf",
    name: "Microsoft Press Release FY24Q3",
    diUrl: "http://localhost:8000/file/PressReleaseFY24Q3.pdf.json",
    documentId: 13,
  },
  {
    pdfUrl: "Microsoft 10Q FY24Q3 1.pdf",
    name: "Microsoft Form 10Q FY24Q3",
    diUrl: "http://localhost:8000/file/Microsoft 10Q FY24Q3 1.pdf.json",
    documentId: 1967,
  },
];

const templates: Template[] = [
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
              citationId: "123",
              review: 0,
            },
            {
              excerpt: "61,858",
              documentId: 1967,
              citationId: "987",
              review: 0,
            },
          ],
          [
            {
              excerpt: "$2.94",
              documentId: 13,
              citationId: "224-13",
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.",
              documentId: 13,
              citationId: "abc",
              review: 0,
            },
          ],
          [
            {
              excerpt: "484,275",
              documentId: 13,
              citationId: "98-43-12",
              review: 0,
            },
            {
              excerpt: "484,275",
              documentId: 1967,
              citationId: "1",
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "Claims against us that may result in adverse outcomes in legal disputes.",
              documentId: 13,
              citationId: "96",
              review: 0,
            },
            {
              excerpt:
                "Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused their brain tumors and other adverse health effects.",
              documentId: 1967,
              citationId: "0",
              review: 0,
            },
          ],
          [
            {
              excerpt:
                "· laws and regulations relating to the handling of personal data that may impede the adoption of our services or result in increased costs, legal claims, fines, or reputational damage;\n· claims against us that may result in adverse outcomes in legal disputes;",
              documentId: 13,
              citationId: "dog",
              review: 0,
            },
          ],
        ],
      },
    ],
  },
];

export const createCitationId = (formId: number, creator: string) => {
  return formId + "-" + creator + "-" + Date.now();
};

const forms: Form[] = [];

export function getClientForm(formId: number): ClientForm {
  if (isNaN(formId) || formId >= forms.length) throw new Error(`Form ${formId} not found`);

  const form = forms[formId];
  const template = templates[form.templateId];
  return {
    metadata: {
      formId,
      formName: form.name,
      templateName: template.name,
    },
    documents,
    questions: template.questions.map((question, i) => {
      return {
        ...question,
        citations: form.citations[i]
      };
    }),
  }
}

export function getClientFormFromBootstrap(
  templateId: number,
  bootstrapId: number,
): [number, ClientForm] {
  if (isNaN(templateId) || templateId >= templates.length) throw new Error("Template ${templateId}/Bootstrap ${}not found");
  
  const { formBootstraps } = templates[templateId];
  
  if (isNaN(bootstrapId) || bootstrapId >= formBootstraps.length) throw new Error("Template ${templateId}/Bootstrap ${}not found");

  const { name, citations } = formBootstraps[bootstrapId];
  const formId = forms.length;
  forms.push({
    name,
    templateId,
    citations: citations.map((questionCitations, questionIndex) => questionCitations.map(citation => ({
      ...citation,
      citationId: `${formId}-${questionIndex}-${citation.citationId}`,
    }))),
  });

  return [formId, getClientForm(formId)];
}

function findCitation(citationId: string): Citation | undefined {  
  for (const form of forms) {
    const { citations } = form;
    for (const questionCitations of citations) {
      const citation = questionCitations.find(citation => citation.citationId === citationId);
      if (citation) return citation;
    };
  };

  return undefined;
}

export function dispatchEvent(event: Event) {
  switch (event.type) {
    case "addCitation": {
      const { formId, questionId, documentId, citationId, excerpt, bounds, review } = event;

      const citation = findCitation(citationId);
      if (citation) throw new Error(`Citation ${citationId} already exists`);

      if (formId >= forms.length) throw new Error(`Form ${formId} not found`);

      const form = forms[formId];
      if (questionId >= form.citations.length) throw new Error(`Question ${questionId} not found`);

      const questionCitations = form.citations[questionId];
      questionCitations.push({
        citationId,
        documentId,
        excerpt,
        bounds,
        review,
      });
      break;
    }

    case "updateReview": {
      const citation = findCitation(event.citationId);
      if (!citation) throw new Error(`Citation ${event.citationId} not found`);

      citation.review = event.review;
      break;
    }

    case "updateBounds": {
      const citation = findCitation(event.citationId);
      if (!citation) throw new Error(`Citation ${event.citationId} not found`);

      citation.bounds = event.bounds;
      break;
    }
      
    default:
      throw new Error(`Unknown event type ${event.type}`);
  }
}