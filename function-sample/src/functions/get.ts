import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function get(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    context.log(request.params.id);

    return { body: '' };
};

app.http('get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'form/{id}',
    handler: get
});
