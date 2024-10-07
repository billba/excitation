import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { citations, documents, forms, templates } from '../schema';

const queryClient = postgres(process.env.POSTGRES);
const db = drizzle(queryClient);

// ============================================================================
// db operations
// ============================================================================
async function getForm(formId: number) {
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
  return { formName, templateName, templateId };
}

async function getQuestionsAndCitations(formId: number) {
  const form = await db.select({
    templateId: forms.template_id
  }).from(forms).where(eq(forms.id, formId));
  return form[0].templateId;
}

async function getDocuments(formId: number) {
  let docIds = await db.select({
    documentIds: forms.document_ids
  }).from(forms).where(eq(forms.id, formId));
  let docIdArray = docIds[0].documentIds;
  let docArray = [];
  for (let index = 0; index < docIdArray.length; index++) {
    let docId = docIdArray[index];
    let doc = await db.select({
      name: documents.friendly_name,
      pdfUrl: documents.pdf_url,
      diUrl: documents.di_url
    }).from(documents).where(eq(documents.id, docId)).orderBy(documents.id);
    docArray.push(doc[0]);
  }

  return docArray;
}

async function getCitations(formId: number) {
  let cits = await db.select({
    questionId: citations.question_id,
    documentId: citations.document_id,
    excerpt: citations.excerpt,
    bounds: citations.bounds
  }).from(citations).where(eq(citations.form_id, formId)).orderBy(citations.id);

  return cits;
}

// ============================================================================
// main
// ============================================================================
export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let formId = Number(request.params.id);
  if (isNaN(formId)) { return { status: 400 }; }

  let { formName, templateName } = await getForm(formId);
  context.log("formName:", formName);

  let questionsAndCitations = await getQuestionsAndCitations(formId);
  context.log("questions and citations:", questionsAndCitations);

  let docArray = await getDocuments(formId);
  context.log("doc ids:", docArray);

  let cits = await getCitations(formId);
  context.log("citations:", cits);

  return {
    jsonBody: {
      formId: formId,
      formName: formName,
      templateName: templateName,
      documents: docArray,
      citations: cits
    }
  };
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
