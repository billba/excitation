# [excitation](../) local backend

This is a simple backend for the [client](../client/), meant to be run locally for testing and demos.

## Running

If you haven't already, you'll need to [install Deno](https://docs.deno.com/runtime/getting_started/installation/).

```zsh
cd local-backend
deno task run
```

Aim your browser at [http://localhost:8000](http://localhost:8000) to see your templates and bootstraps.

Now make sure the [client](../client/) client server is running at [http://localhost:5173](http://localhost:5173) (but don't go there directly!).

Click on "new form" to create a new form containing the data of the bootstrap, and open it in the client. Bootstraps are purely in service of testing and demos and have no analog in a production workflow.

## Developing

To run in watch mode (helpful if you're actively developing the local backend, otherwise a little twitchy):

```zsh
cd local-backend
deno task dev
```

If you use VS Code, you'll probably want to install and enable the [Deno plugin](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

For instructions on debugging, see [here](https://docs.deno.com/runtime/fundamentals/debugging/#example-with-chrome-devtools).
