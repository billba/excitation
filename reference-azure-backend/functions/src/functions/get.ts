import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import 'reflect-metadata';
import { initializeDataSource } from '../data-source';
import { DataSource } from 'typeorm';
import { Documents } from "../entity/Documents";
import { Forms } from "../entity/Forms";
import { Questions } from "../entity/Questions";
import { Citations } from "../entity/Citations";
import { Templates } from "../entity/Templates";

// ============================================================================
// db operations
// ============================================================================
async function getFormMetadata(db: DataSource, formId: number) {
  const formsRepository = db.getRepository(Forms);
  const templatesRepository = db.getRepository(Templates);

  // get template id
  const form = await formsRepository.findOne({
    where: { form_id: formId },
    select: ['form_name', 'template_id']
  });
  let formName = form[0].formName;
  const templateId = form[0].templateId;

  // get template info
  const template = await templatesRepository.findOne({
    where: { template_id: templateId },
    select: ['template_name']
  });
  let templateName = template[0].templateName;
  return { formName, templateName };
}

async function getQuestionsWithCitations(db: DataSource, formId: number) {
  const formsRepository = db.getRepository(Forms);
  const questionsRepository = db.getRepository(Questions);
  const citationsRepository = db.getRepository(Citations);

  const form = formsRepository.findOne({
    where: { form_id: formId },
    select: ['template_id']
  });
  const templateId = form[0].templateId;

  const qs = await questionsRepository.find({
    where: { template_id: templateId },
    order: { prefix: 'ASC', question_id: 'ASC' },
    select: ['question_id', 'prefix', 'text']
  });

  return await Promise.all(qs.map(async ({question_id, prefix, text}) => ({
    prefix,
    text,
    citations: citationsRepository.find({
      where: { form_id: formId, question_id: question_id },
      order: { document_id: 'ASC', citation_id: 'ASC' },
      select: ['citation_id', 'document_id', 'excerpt', 'review', 'bounds']
    })
  })));
}

async function getDocuments(db: DataSource, formId: number) {
  const documentRepository = db.getRepository(Documents);
  return await documentRepository.find({ 
    where: {form_id: formId}, 
    select: ['document_id', 'name', 'pdf_url', 'di_url']
  });
}

// ============================================================================
// main
// ============================================================================
export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  // to initialize the initial connection with the database, register all entities
  // and "synchronize" database schema, call "initialize()" method of a newly created database
  // once in your application bootstrap
  let dataSource = await initializeDataSource();

  let form = await dataSource.initialize().then(async () => {
    // here you can start to work with your database
    let formId = Number(request.params.id);
    if (isNaN(formId)) { return { status: 400 }; }

    let { formName, templateName } = await getFormMetadata(dataSource, formId);
    context.log("formName:", formName);
    context.log("templateName:", templateName);

    let docArray = await getDocuments(dataSource, formId);
    context.log("documents:", docArray);

    let questionsWithCitations = await getQuestionsWithCitations(dataSource, formId);
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
  }).catch((error) => {
    console.log(error);
    return error;
  });

  return form;
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
