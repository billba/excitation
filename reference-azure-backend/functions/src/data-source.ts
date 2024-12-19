import { DataSource } from 'typeorm';
import { Template } from './entity/Template';
import { Question } from './entity/Question';
import { Form } from './entity/Form';
import { Document } from './entity/Document';
import { Citation } from './entity/Citation';
import { Event } from './entity/Event';
import { DefaultAzureCredential } from '@azure/identity';
import { Answer } from './entity/Answer';

async function getToken() {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    return tokenResponse.token;
}

export async function getDataSource() {
    const token = await getToken();
    const serverName = process.env.SQL_SERVER_NAME
    const dbName = process.env.SQL_DATABASE_NAME

    return new DataSource({
        type: "mssql",
        host: `${serverName}.database.windows.net`,
        port: 1433,
        database: dbName,
        logging: true,
        // synchronize: true,
        entities: [Template, Question, Form, Document, Citation, Event, Answer],
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