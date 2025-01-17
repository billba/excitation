# [excitation](../) client

This sample uses the [react-pdf](https://projects.wojtekmaj.pl/react-pdf/) library which wraps [pdf.js](https://mozilla.github.io/pdf.js/) in easy-to-use React components.

## Building and running this sample

```zsh
cd client
npm install
npm run dev
```

This starts the Vite dev server. It needs to be serving from [http://localhost:5173/](http://localhost:5173/) but don't go there directly! Instead, follow the directions at [local-backend](../local-backend/).

### Connecting to Azure functions

To connect to a local instance of Azure Functions, uncomment the line `# VITE_DOCUMENT_BLOB_STORAGE_GENERATE_SAS_URL=TRUE` within the [client](../../client/) [`.env`](../../client/.env) file. If connecting to a non-local instance of Azure Functions, update the `VITE_API_URL` accordingly.