import "reflect-metadata";
import { getDataSource } from "./data-source";
import { DataSource } from "typeorm";

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

async function main() {
    await initializeDataSource();
}

main().then(() => {
    console.log("Application has started.");
}).catch((err) => {
    console.error("Application failed to start:", err);
});

export { dataSource };