import { DataSource } from 'typeorm';
import { Templates } from './entity/Templates';
import { Questions } from './entity/Questions';
import { Forms } from './entity/Forms';
import { Documents } from './entity/Documents';
import { Citations } from './entity/Citations';
import { Events } from './entity/Events';
import { DefaultAzureCredential } from '@azure/identity';

async function getToken() {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    return tokenResponse.token;
}

export async function initializeDataSource() {
    const token = await getToken();

    return new DataSource({
        type: "mssql",
        host: "uwapdnosqlsv01d01.database.windows.net",
        port: 1433,
        database: "uwapdnosqldb01d01",
        synchronize: true,
        logging: true,
        entities: [Templates, Questions, Forms, Documents, Citations, Events],
        subscribers: [],
        migrations: [],
        options: {
            encrypt: true,
        },
        extra: {
            authentication: {
                type: 'azure-active-directory-access-token',
                options: {
                    token: token
                }
            }
        }
    });
}