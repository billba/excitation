import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import {
  getClientForm,
  getClientFormFromBootstrap,
  Event,
  dispatchEvent,
  dashboard
} from "./excitation.ts";

const app = new Application();
const router = new Router();

router
  .get("/", ({ response }) => {
    response.body = dashboard();
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
        console.log("creating and serving new form", templateId, bootstrapId);
        const [formId, form] = getClientFormFromBootstrap(
          Number(templateId),
          Number(bootstrapId)
        );
        response.body = JSON.stringify({
          formId,
          form,
        });
        response.headers.set("content-type", "application/json");
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
        dispatchEvent(event);
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
