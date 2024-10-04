import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { documents, forms, questions, templates } from '../schema';

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
  formName = template[0].templateName.concat(': ', formName);

  // get question array
  const qs = await db.select({
    questionText: questions.question_text
  }).from(questions).where(eq(questions.template_id, templateId));
  let questionArray = [];
  for (let index = 0; index < qs.length; index++) {
    let q = qs[index];
    questionArray.push(q.questionText);
  }
  return {
    formName,
    questionArray
  }

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
    }).from(documents).where(eq(documents.id, docId))
    docArray.push(doc[0]);
  }

  return docArray;
}

// ============================================================================
// main
// ============================================================================

export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let formId = Number(request.params.id);
  if (isNaN(formId)) { return { status: 400 }; }

  let { formName, questionArray } = await getForm(formId);
  context.log("formName:", formName);
  context.log("questions:", questionArray);

  let docArray = await getDocuments(formId);
  context.log("doc ids:", docArray);

  return {
    jsonBody: {
      formId: formId,
      formName: formName,
      questions: questionArray,
      documents: docArray
    }
  };
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
