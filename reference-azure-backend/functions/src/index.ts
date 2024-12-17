import "reflect-metadata";
import { getDataSource } from "./data-source";
import { DataSource } from "typeorm";
import { app, AppStartContext, AppTerminateContext } from '@azure/functions';

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

app.hook.appTerminate(async (context: AppTerminateContext) => {
    console.log("Terminating");
    await dataSource.destroy();
});


export { dataSource };
