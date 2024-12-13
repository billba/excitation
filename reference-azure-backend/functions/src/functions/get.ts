import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Document } from "../entity/Document";
import { Form } from "../entity/Form";
import { Question } from "../entity/Question";
import { Citation } from "../entity/Citation";
import { Template } from "../entity/Template";
import { dataSource } from "..";

// ============================================================================
// db operations
// ============================================================================
async function getFormMetadata(db: DataSource, formId: number) {
  const formsRepository = db.getRepository(Form);
  const templatesRepository = db.getRepository(Template);

  // get template id
  const form = await formsRepository.findOne({
    where: { form_id: formId },
    select: ['form_name', 'template_id']
  });
  let formName = form.form_name;
  const templateId = form.template_id;

  // get template info
  const template = await templatesRepository.findOne({
    where: { template_id: templateId },
    select: ['template_name']
  });
  let templateName = template.template_name;
  return { formName, templateName };
}

async function getQuestionsWithCitations(db: DataSource, formId: number) {
  const formsRepository = db.getRepository(Form);
  const questionsRepository = db.getRepository(Question);
  const citationsRepository = db.getRepository(Citation);

  const form = await formsRepository.findOne({
    where: { form_id: formId },
    select: ['template_id']
  });
  const templateId = form.template_id;

  const qs = await questionsRepository.find({
    where: { template_id: templateId },
    order: { prefix: 'ASC', question_id: 'ASC' },
    select: ['question_id', 'prefix', 'text']
  });

  return await Promise.all(qs.map(async ({question_id, prefix, text}) => ({
    prefix,
    text,
    citations: await citationsRepository.find({
      where: { form_id: formId, question_id: question_id },
      order: { document_id: 'ASC', citation_id: 'ASC' },
      select: ['citation_id', 'document_id', 'excerpt', 'review', 'bounds']
    })
  })));
}

async function getDocuments(db: DataSource, formId: number) {
  const documentRepository = db.getRepository(Document);
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
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
