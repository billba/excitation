import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import {
  getClientForm,
  getClientFormFromBootstrap,
  type Event,
  dispatchEvent,
  forms,
} from "./excitation.ts";
import { templates } from "./templates.ts";
import { dashboard } from "./dashboard.ts";
import { settings, set, clearErrors } from "./settings.ts";
const app = new Application();
const router = new Router();

export const clientUrl = (formId: number) => `http://localhost:5173/${formId}`;

router
  .get("/", ({ response }) => {
    clearErrors();
    response.body = dashboard(forms, templates, settings);
    response.headers.set("Content-Type", "text/html");
  })
  .post("/settings", async ({ request: { body }, response }) => {
    set(await body.formData());
    response.redirect("/");
  })
  .get("/file/:path", async (context) => {
    const {
      response,
      params: { path },
    } = context;
    try {
      console.log("serving file", path);
      await context.send({
        path,
        root: `./files`,
      });
      console.log("done serving file", path);
    } catch (e) {
      response.body = e.message;
      response.status = 400;
    }
  })
  .get("/form/:formId", ({ response, params: { formId } }) => {
    try {
      console.log("serving form", formId);
      response.body = JSON.stringify(getClientForm(Number(formId)));
      response.headers.set("content-type", "application/json");
    } catch (e) {
      response.body = e.message;
      response.status = 400;
    }
  })
  .get(
    "/newform/:templateId/:bootstrapId",
    ({ response, params: { templateId, bootstrapId } }) => {
      try {
        console.log("creating new form", templateId, bootstrapId);
        getClientFormFromBootstrap(
          Number(templateId),
          Number(bootstrapId)
        );
        response.redirect("/");
      } catch (e) {
        response.body = e.message;
        response.status = 400;
      }
    }
  )
  .post("/event", async ({ request, response }) => {
    try {
      for (const event of await request.body.json() as Event[]) {
        console.log("dispatching", event);
        await dispatchEvent(event);
      }
      response.status = 200;
    } catch (e) {
      response.body = e.message;
      response.status = 400;
    }
  });
app
  .use(oakCors({ origin: "*" }))
  .use(router.routes())
  .use(router.allowedMethods());

await app.listen({ port: 8000 });
