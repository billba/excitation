import { DataSource } from 'typeorm';
import { Template } from './entity/Template';
import { Question } from './entity/Question';
import { Form } from './entity/Form';
import { Document } from './entity/Document';
import { Citation } from './entity/Citation';
import { Event } from './entity/Event';
import { DefaultAzureCredential } from '@azure/identity';

async function getToken() {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    return tokenResponse.token;
}

export async function getDataSource() {
    const token = await getToken();
    const accountName = process.env.BLOB_STORAGE_ACCOUNT_NAME

    return new DataSource({
        type: "mssql",
        host: `${accountName}.database.windows.net`,
        port: 1433,
        database: accountName,
        synchronize: true,
        logging: true,
        entities: [Template, Question, Form, Document, Citation, Event],
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