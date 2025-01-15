import "reflect-metadata";
import { cachedToken, getDataSource, getToken, tokenExpiration } from "./data-source";
import { DataSource } from "typeorm";
import { app, AppStartContext, AppTerminateContext, PreInvocationContext } from '@azure/functions';

let dataSource: DataSource;

async function initializeDataSource() {
    try {
        dataSource = await (await getDataSource()).initialize();
        console.log("Data Source has been initialized!");
        return dataSource;
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
        throw err;
    }
}

app.hook.appStart(async (context: AppStartContext) => {
    await initializeDataSource();
});

app.hook.preInvocation(async (context: PreInvocationContext) => {
    if (!cachedToken || !tokenExpiration || tokenExpiration <= Date.now()) {
        const token = await getToken();
        dataSource.options.extra.authentication.options.token = token;
    }
});

app.hook.appTerminate(async (context: AppTerminateContext) => {
    console.log("Terminating");
    await dataSource.destroy();
});


export { dataSource };
