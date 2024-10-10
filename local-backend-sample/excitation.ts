import { clientUrl } from './server.ts';
import { templates } from "./templates.ts";

export interface Template {
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
  citationId?: string;
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
): number {
  if (isNaN(templateId) || templateId >= templates.length) throw new Error("Template ${templateId}/Bootstrap ${}not found");
  
  const { formBootstraps } = templates[templateId];
  
  if (isNaN(bootstrapId) || bootstrapId >= formBootstraps.length) throw new Error("Template ${templateId}/Bootstrap ${}not found");

  const { name, citations } = formBootstraps[bootstrapId];
  const formId = forms.length;
  forms.push({
    name,
    templateId,
    citations: citations.map((questionCitations, questionIndex) => questionCitations.map((citation, citationIndex) => ({
      ...citation,
      citationId: `${formId}-${questionIndex}-${citationIndex}`,
    }))),
  });

  return formId;
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

export function dashboard(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Excitation Dashboard</title>
      </head>
      <body>
        <h2>Excitation</h3>
        ${templates.map((template, templateId) => `
          <h3>Template "${template.name}"</h4>
          ${template.formBootstraps.map((bootstrap, bootstrapId) => `
            <h4>
              ${bootstrap.name}
            </h4>
            <ul>
            <div>
              <a href="/newform/${templateId}/${bootstrapId}">new form</a>
            </div>
            <br>
            ${forms
              .map((form, formId) => [form, formId] as const)
              .filter(([form]) => form.templateId === templateId && form.name === bootstrap.name)
              .map(([_, formId]) => `
                <li>
                  <a href="${clientUrl(formId)}">Form #${formId}</a>
                </li>
              `)
              .join('')
            }
            </ul>
          `)
          .join('')             
          }
        `
        )}
      </body>
    </html>
  `;
}
