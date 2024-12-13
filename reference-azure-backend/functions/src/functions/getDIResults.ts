import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";


async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks))
      })
      readableStream.on("error", reject)

    })
  })
}

// ============================================================================
// main
// ============================================================================
export async function getDIResults(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);
  try {
    const url = request.query.get("url")
    const blobClient = new BlobClient(url, new DefaultAzureCredential())
    const blobResponse = await blobClient.download()
    const downloaded = (await (streamToBuffer(blobResponse.readableStreamBody))).toString()

    return {
      jsonBody: JSON.parse(downloaded)
    };
  } catch (e) {
    console.log(e)
  }
};

app.http('getDIResults', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'sas',
    handler: getDIResults
});
