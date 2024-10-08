import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import { citations, documents, forms, questions, templates } from '../schema';

// ============================================================================
// db operations
// ============================================================================
async function getForm(db: PostgresJsDatabase, formId: number) {
  // get template id
  const form = await db.select({
    formName: forms.form_name,
    templateId: forms.template_id
  }).from(forms).where(eq(forms.id, formId));
  let formName = form[0].formName;
  const templateId = form[0].templateId;

  // get template info
  const template = await db.select({
    templateName: templates.template_name
  }).from(templates).where(eq(templates.id, templateId));

  let templateName = template[0].templateName;
  return { formName, templateName };
}

async function getQuestionsWithCitations(db: PostgresJsDatabase, formId: number) {
  const form = await db.select({
    templateId: forms.template_id
  }).from(forms).where(eq(forms.id, formId));
  const templateId = form[0].templateId;

  const qs = await db.select({
    id: questions.id,
    prefix: questions.prefix,
    text: questions.question_text
  }).from(questions)
    .where(eq(questions.template_id, templateId))
    .orderBy(questions.prefix, questions.id);

  return await Promise.all(qs.map(async ({id, prefix, text}) => ({
    prefix,
    text,
    citations: await db.select({
      id: citations.id,
      documentId: citations.document_id,
      excerpt: citations.excerpt,
      review: citations.review,
      bounds: citations.bounds
    }).from(citations)
      .where(and(eq(citations.form_id, formId), eq(citations.question_id, id)))
      .orderBy(citations.document_id, citations.id)
    })
  ));
}

async function getDocuments(db: PostgresJsDatabase, formId: number, context: InvocationContext) {
  let docIds = await db.select({
    documentIds: forms.document_ids
  }).from(forms).where(eq(forms.id, formId));
  context.log(docIds);
  let docIdArray = docIds[0].documentIds;
  return await Promise.all(docIdArray.map(async (docId) =>
    (await db.select({
      name: documents.friendly_name,
      pdfUrl: documents.pdf_url,
      diUrl: documents.di_url
    }).from(documents).where(eq(documents.id, docId)))[0]
  ));
}

// ============================================================================
// main
// ============================================================================
export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  /* @ts-ignore */
  const db = await drizzle("postgres-js", process.env.POSTGRES);
  
  let formId = Number(request.params.id);
  if (isNaN(formId)) { return { status: 400 }; }

  let { formName, templateName } = await getForm(db, formId);
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
