import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { forms, templates } from '../schema';

const queryClient = postgres(process.env.POSTGRES);
const db = drizzle(queryClient);

async function getFormName(context: InvocationContext, formId: number) {
  const form = db.select({
    formName: forms.form_name,
    templateId: forms.template_id
  }).from(forms).where(eq(forms.id, formId));
  context.log(form[0]);
  // const { formName, templateId } = form[0];
  const template = db.select({
    templateName: templates.template_name
  }).from(templates).where(eq(templates.id, templateId));
  const templateName = template[0];
  context.log(templateName);
  return templateName.concat(': ', formName);
}

async function getQuestions(formId: number) {
  return '';
}

export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let formId = Number(request.params.id);
  if (isNaN(formId)) { return { status: 400 }; }

  let formName = getFormName(context, formId);
  context.log("formName:", formName);

  return {
    jsonBody: {
      formId: formId,
      formName: formName,
    }
  };
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
