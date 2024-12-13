import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { citations, documents, forms, questions, templates } from '../schema';

// ============================================================================
// db operations
// ============================================================================
async function getFormMetadata(db: PostgresJsDatabase, formId: number) {
  // get template id
  const form = await db.select({
    formName: forms.formName,
    templateId: forms.templateId
  }).from(forms).where(eq(forms.formId, formId));
  let formName = form[0].formName;
  const templateId = form[0].templateId;

  // get template info
  const template = await db.select({
    templateName: templates.templateName
  }).from(templates).where(eq(templates.templateId, templateId));

  let templateName = template[0].templateName;
  return { formName, templateName };
}

async function getQuestionsWithCitations(db: PostgresJsDatabase, formId: number) {
  const form = await db.select({
    templateId: forms.templateId
  }).from(forms).where(eq(forms.formId, formId));
  const templateId = form[0].templateId;

  const qs = await db.select({
    id: questions.questionId,
    prefix: questions.prefix,
    text: questions.text
  }).from(questions)
    .where(eq(questions.templateId, templateId))
    .orderBy(questions.prefix, questions.questionId);

  return await Promise.all(qs.map(async ({id, prefix, text}) => ({
    prefix,
    text,
    citations: await db.select({
      citationId: citations.citationId,
      documentId: citations.documentId,
      excerpt: citations.excerpt,
      review: citations.review,
      bounds: citations.bounds
    }).from(citations)
      .where(and(eq(citations.formId, formId), eq(citations.questionId, id)))
      .orderBy(citations.documentId, citations.citationId)
    })
  ));
}

async function getDocuments(db: PostgresJsDatabase, formId: number, context: InvocationContext) {
  return await db.select({
    documentId: documents.documentId,
    name: documents.name,
    pdfUrl: documents.pdfUrl,
    diUrl: documents.diUrl
  }).from(documents).where(eq(documents.formId, formId));
}

// ============================================================================
// main
// ============================================================================
export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  /* @ts-ignore */
  const queryClient = postgres(process.env["POSTGRES"]);
  const db = drizzle(queryClient);

  let formId = Number(request.params.id);
  if (isNaN(formId)) { return { status: 400 }; }

  let { formName, templateName } = await getFormMetadata(db, formId);
  context.log("formName:", formName);
  context.log("templateName:", templateName);

  let docArray = await getDocuments(db, formId, context);
  context.log("documents:", docArray);

  let questionsWithCitations = await getQuestionsWithCitations(db, formId);
  context.log("questions&citations:", questionsWithCitations);

  return {
    jsonBody: {
      metadata: {
        formId: formId,
        formName: formName,
        templateName: templateName
      },
      documents: docArray,
      questions: questionsWithCitations
    }
  };
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
