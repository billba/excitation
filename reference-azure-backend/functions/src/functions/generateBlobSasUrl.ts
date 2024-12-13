import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";

// ============================================================================
// main
// ============================================================================
export async function generateBlobSasUrl(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const url = request.query.get("url")
    const blobClient = new BlobClient(url)
    const blobName = blobClient.name
    const containerName = blobClient.containerName
    const accountName = process.env.BLOB_STORAGE_ACCOUNT_NAME
    const accountKey = process.env.BLOB_STORAGE_ACCOUNT_KEY
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

    const sasOptions = {
      containerName: containerName,
      blobName: blobName,
      permissions: ContainerSASPermissions.parse("r"),
      startsOn: new Date(),
      // TODO: What is a good expires on value?
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000)
    }

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
    const sasUrl = `${blobClient.url}?${sasToken}`
    return {
      jsonBody: sasUrl
    };
  } catch (e) {
    console.log(e)
  }
};

app.http('generateBlobSasUrl', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'sas',
    handler: generateBlobSasUrl
});
