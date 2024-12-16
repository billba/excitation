import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  BlobClient,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

// ============================================================================
// main
// ============================================================================
export async function generateBlobSasUrl(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const url = request.query.get("url");
    const blobClient = new BlobClient(url);

    const sasOptions = {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      permissions: ContainerSASPermissions.parse("r"),
      startsOn: new Date(),
      // TODO: What is a good expires on value?
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
    };
    const accountName = process.env.BLOB_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.BLOB_STORAGE_ACCOUNT_KEY;
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential,
    ).toString();
    const sasUrl = `${blobClient.url}?${sasToken}`;

    return {
      jsonBody: sasUrl,
    };
  } catch (e) {
    console.log(e);
  }
}

app.http("generateBlobSasUrl", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "blob-sas-url",
  handler: generateBlobSasUrl,
});
