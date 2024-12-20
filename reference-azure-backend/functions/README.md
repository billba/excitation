# Azure Functions TypeScript HTTP Trigger using Azure Developer CLI

This project was build using the Azure Functions Typescript HTTP Trigger template using Azure Dev CLI.

## Contents - highlights

```sh
|- src
| |- functions
| | |- get.ts : GET endpoint, serves /api/form/{id}
| | |- post.ts: POST endpoint, serves /api
| |- schema.ts: Defines the postgres schema
| |- send.json: Sample payload for the POST function
| |- types.ts : Defines types used by get and post
```

## Prerequisites

+ [Node.js 20](https://www.nodejs.org/)
+ [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local?pivots=programming-language-typescript#install-the-azure-functions-core-tools)
+ [Azure Developer CLI (AZD)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd)
+ To use Visual Studio Code to run and debug locally:
  + [Visual Studio Code](https://code.visualstudio.com/)
  + [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions)
+ These functions communicate with a postgres database, which can be spun up in various ways including using [Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/postgresql/quickstart-create-portal). When running `azd up`, you'll be prompted to enter your postgres connection string, which should be of a format such as `postgres://{username}:{password}@{server}:5432/{database}?sslmode=require`
  + The schema of the postgres database should match the [postgres-sample](../postgres-sample/) [`create`](../postgres-sample/create.sql) script.

## Running locally

To run locally in VSCode, you will want to open the folder `functions-sample` as the top-level folder of a workspace.

Create a file in this directory called `local.settings.json` with the following content:


**Important**: This currently has an issue accessing the environment variables at startup. This is needed for the `SQL_DATABASE_NAME` and `SQL_SERVER_NAME` to connect with the database. The work around for now is to export these environment variables in the terminal prior to running `npm start`. Example: `export SQL_SERVER_NAME=<sql-server-name>`

```json
{
  "IsEncrypted": false,
  "Values": {
    // If you have dev storage set up, you can use that. Alternately, provide
    // a storage account connection string
    "AzureWebJobsStorage": "connection string || UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    // Postgres connection with format as described above
    "POSTGRES": "connection string", // for postgres only
    "SQL_DATABASE_NAME": "the name of the Azure SQL database", // for SQL only
    "SQL_SERVER_NAME": "the name of the Azure SQL server", // for SQL only
    "SQL_DATABASE_SYNC": "Controls whether the entities will be synced with the database. Setting to 'true' is not recommended in production", // for SQL only
    // Storage account for the PDFs and Document Intelligence results
    "BLOB_STORAGE_ACCOUNT_NAME": "Azure Storage account name",
    "BLOB_STORAGE_ACCOUNT_KEY": "Aure Storage account key"
  },
  "Host": {
    "CORS": "*",
    "LocalHttpPort": 8000
  }
}
```

You should be able to *either*:

- Press `F5` to start the functions host task, or
- Run `npm install` and `npm start` from your terminal

## Deploy to Azure

Run this command to provision the function app, with any required Azure resources, and deploy your code:

```shell
azd up
```

You're prompted to supply these required deployment parameters:

| Parameter | Description |
| ---- | ---- |
| _Environment name_ | An environment that's used to maintain a unique deployment context for your app. You won't be prompted if you created the local project using `azd init`.|
| _Azure subscription_ | Subscription in which your resources are created.|
| _Azure location_ | Azure region in which to create the resource group that contains the new Azure resources. Only regions that currently support the Flex Consumption plan are shown.|
| _Postgres connection_ | Postgres connection string as described above. |

After publish completes successfully, `azd` provides you with the URL endpoints of your new functions, but without the function key values required to access the endpoints. To learn how to obtain these same endpoints along with the required function keys, see [Invoke the function on Azure](https://learn.microsoft.com/azure/azure-functions/create-first-function-azure-developer-cli?pivots=programming-language-typescript#invoke-the-function-on-azure) in the companion article [Quickstart: Create and deploy functions to Azure Functions using the Azure Developer CLI](https://learn.microsoft.com/azure/azure-functions/create-first-function-azure-developer-cli?pivots=programming-language-typescript).

## Redeploy your code

You can run the `azd up` command as many times as you need to both provision your Azure resources and deploy code updates to your function app.

>[!NOTE]
>Deployed code files are always overwritten by the latest deployment package.

## Clean up resources

When you're done working with your function app and related resources, you can use this command to delete the function app and its related resources from Azure and avoid incurring any further costs:

```shell
azd down
```
