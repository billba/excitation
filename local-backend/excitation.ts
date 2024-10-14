import { documents, templates } from "./templates.ts";
import { isError } from "./settings.ts";

export interface Template {
  name: string;
  questions: Question[];
  formBootstraps: {
    name: string;
    documentIds: number[];
    citations: Citation[][];
  }[];
}

export interface Form {
  name: string;
  templateId: number;
  documentIds: number[];
  citations: Citation[][];
}

interface FormMetadata {
  templateName: string;
  formName: string;
  formId: number;
}

export interface FormDocument {
  name: string;
  diUrl: string;
  pdfUrl: string;
  documentId?: number;
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

export const createCitationId = (formId: number, creator: string) => {
  return formId + "-" + creator + "-" + Date.now();
};

export const forms: Form[] = [];

export function getClientForm(formId: number): ClientForm {
  if (isNaN(formId) || formId >= forms.length)
    throw new Error(`Form ${formId} not found`);

  const form = forms[formId];
  const template = templates[form.templateId];
  return {
    metadata: {
      formId,
      formName: form.name,
      templateName: template.name,
    },
    documents: form.documentIds.map((documentId) => ({
      ...documents[documentId],
      documentId,
    })),
    questions: template.questions.map((question, i) => {
      return {
        ...question,
        citations: form.citations[i],
      };
    }),
  };
}

export function getClientFormFromBootstrap(
  templateId: number,
  bootstrapId: number
): number {
  if (isNaN(templateId) || templateId >= templates.length)
    throw new Error("Template ${templateId}/Bootstrap ${}not found");

  const { formBootstraps } = templates[templateId];

  if (isNaN(bootstrapId) || bootstrapId >= formBootstraps.length)
    throw new Error("Template ${templateId}/Bootstrap ${}not found");

  const { name, citations, documentIds } = formBootstraps[bootstrapId];
  const formId = forms.length;
  forms.push({
    name,
    templateId,
    documentIds,
    citations: citations.map((questionCitations, questionIndex) =>
      questionCitations.map((citation, citationIndex) => ({
        ...citation,
        citationId: `${formId}-${questionIndex}-${citationIndex}`,
      }))
    ),
  });

  return formId;
}

function findCitation(citationId: string): Citation | undefined {
  for (const form of forms) {
    const { citations } = form;
    for (const questionCitations of citations) {
      const citation = questionCitations.find(
        (citation) => citation.citationId === citationId
      );
      if (citation) return citation;
    }
  }

  return undefined;
}

export async function dispatchEvent(event: Event) {
  switch (event.type) {
    case "addCitation": {
      if (await isError())
        throw new Error(
          `Congratulations, you asked for an error and you got one!`
        );

      const {
        formId,
        questionId,
        documentId,
        citationId,
        excerpt,
        bounds,
        review,
      } = event;

      const citation = findCitation(citationId);
      if (citation) throw new Error(`Citation ${citationId} already exists`);

      if (formId >= forms.length) throw new Error(`Form ${formId} not found`);

      const form = forms[formId];
      if (questionId >= form.citations.length)
        throw new Error(`Question ${questionId} not found`);

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
      if (await isError())
        throw new Error(
          `Congratulations, you asked for an error and you got one!`
        );

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
