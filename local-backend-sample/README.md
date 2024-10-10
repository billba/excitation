# [excitation](../) local backend sample

This is a simple backend for the [react-pdf-sample](../react-pdf-sample/), meant for running locally for testing and demos.

## Running

If you haven't already, you'll need to [install Deno](https://docs.deno.com/runtime/getting_started/installation/).

Then:

```zsh
cd local-backend-sample
deno task dev
```

This will run the server in watch mode. Aim your browser at [http://localhost:8000](http://localhost:8000) and you should see at least one template, with at least one "bootstrap" (pre-loaded citations).

Now make sure the [react-pdf-sample](../react-pdf-sample/) client server is running at [http://localhost:5173](http://localhost:5173) (but don't go there).

Click on "new form" to create a new form containing the data of the bootstrap, and open it in the client. Bootstraps are purely in service of testing and demos and have no analog in a production workflow.

## Developing

If you use VS Code, you'll probably want to install and enable the [Deno plugin](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).
