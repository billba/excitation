import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import { citationSchema, documentSchema, formSchema, questionSchema, templateSchema } from '../schema';

// ============================================================================
// db operations
// ============================================================================
async function getFormMetadata(db: PostgresJsDatabase, formId: number) {
  // get template id
  const form = await db.select({
    formName: formSchema.formName,
    templateId: formSchema.templateId
  }).from(formSchema).where(eq(formSchema.formId, formId));
  let formName = form[0].formName;
  const templateId = form[0].templateId;

  // get template info
  const template = await db.select({
    templateName: templateSchema.templateName
  }).from(templateSchema).where(eq(templateSchema.templateId, templateId));

  let templateName = template[0].templateName;
  return { formName, templateName };
}

async function getQuestionsWithCitations(db: PostgresJsDatabase, formId: number) {
  const form = await db.select({
    templateId: formSchema.templateId
  }).from(formSchema).where(eq(formSchema.formId, formId));
  const templateId = form[0].templateId;

  const qs = await db.select({
    id: questionSchema.questionId,
    prefix: questionSchema.prefix,
    text: questionSchema.text
  }).from(questionSchema)
    .where(eq(questionSchema.templateId, templateId))
    .orderBy(questionSchema.prefix, questionSchema.questionId);

  return await Promise.all(qs.map(async ({id, prefix, text}) => ({
    prefix,
    text,
    citations: await db.select({
      citationId: citationSchema.citationId,
      documentId: citationSchema.documentId,
      excerpt: citationSchema.excerpt,
      review: citationSchema.review,
      bounds: citationSchema.bounds
    }).from(citationSchema)
      .where(and(eq(citationSchema.formId, formId), eq(citationSchema.questionId, id)))
      .orderBy(citationSchema.documentId, citationSchema.citationId)
    })
  ));
}

async function getDocuments(db: PostgresJsDatabase, formId: number, context: InvocationContext) {
  return await db.select({
    documentId: documentSchema.documentId,
    name: documentSchema.name,
    pdfUrl: documentSchema.pdfUrl,
    diUrl: documentSchema.diUrl
  }).from(documentSchema).where(eq(documentSchema.formId, formId));
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
