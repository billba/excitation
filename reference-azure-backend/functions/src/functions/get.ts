import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DataSource } from 'typeorm';
import { Document } from "../entity/Document";
import { Form } from "../entity/Form";
import { Question } from "../entity/Question";
import { Citation } from "../entity/Citation";
import { Template } from "../entity/Template";
import { dataSource } from "..";
import { Answer } from "../entity/Answer";

// ============================================================================
// db operations
// ============================================================================
async function getFormMetadata(db: DataSource, formId: number) {
  const formRepository = db.getRepository(Form);
  const templateRepository = db.getRepository(Template);

  // get template id
  const form = await formRepository.findOne({
    where: { formId: formId },
    select: ['formName', 'templateId']
  });
  let formName = form.formName;
  const templateId = form.templateId;

  // get template info
  const template = await templateRepository.findOne({
    where: { templateId: templateId },
    select: ['templateName']
  });
  let templateName = template.templateName;
  return { formName, templateName };
}

export async function getAnswer(db: DataSource, formId: number, questionId: number) {
  const answerRepository = db.getRepository(Answer);
  return await answerRepository.findOne({
    where: { formId: formId, questionId: questionId },
  });
}

async function getQuestionsWithCitations(db: DataSource, formId: number) {
  const formRepository = db.getRepository(Form);
  const questionRepository = db.getRepository(Question);
  const citationRepository = db.getRepository(Citation);

  const form = await formRepository.findOne({
    where: { formId: formId },
    select: ['templateId']
  });
  const templateId = form.templateId;

  const qs = await questionRepository.find({
    where: { templateId: templateId },
    order: { prefix: 'ASC', questionId: 'ASC' },
    select: ['questionId', 'prefix', 'text']
  });

  return await Promise.all(qs.map(async ({questionId, prefix, text}) => ({
    prefix,
    text,
    questionId,
    citations: await citationRepository.find({
      where: { formId: formId, questionId: questionId },
      order: { documentId: 'ASC', citationId: 'ASC' },
      select: ['citationId', 'documentId', 'excerpt', 'review', 'bounds']
    }),
    answer: await getAnswer(db, formId, questionId).then(a => {
      if (a){
        return a.answer
      }
    })
  })));
}

async function getDocuments(db: DataSource, formId: number) {
  const documentRepository = db.getRepository(Document);
  return await documentRepository.find({ 
    where: {formId: formId}, 
    select: ['documentId', 'name', 'pdfUrl', 'diUrl']
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
