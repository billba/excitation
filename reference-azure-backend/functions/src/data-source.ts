import { DataSource } from 'typeorm';
import { Template } from './entity/Template';
import { Question } from './entity/Question';
import { Form } from './entity/Form';
import { Document } from './entity/Document';
import { Citation } from './entity/Citation';
import { Event } from './entity/Event';
import { DefaultAzureCredential } from '@azure/identity';
import { Answer } from './entity/Answer';

export let cachedToken: string | null = null;
export let tokenExpiration: number | null = null;

export async function getToken() {
    const credential = new DefaultAzureCredential();

    // Check if the token is cached and still valid
    if (cachedToken && tokenExpiration && tokenExpiration > Date.now()) {
        return cachedToken;
    }

    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    cachedToken = tokenResponse.token;
    tokenExpiration = tokenResponse.expiresOnTimestamp;

    return cachedToken;
}

export async function getDataSource() {
    const token = await getToken();
    const serverName = process.env.SQL_SERVER_NAME
    const dbName = process.env.SQL_DATABASE_NAME
    const synchronize = (process.env.SQL_DATABASE_SYNC || "false").toLowerCase() == "true"
    if (synchronize) {
        console.log("Synchronizing the database. Synchronizing the database in production is not recommended. This can lead to unintended consequences like dropping a table which can lead to data loss.")
    }

    return new DataSource({
        type: "mssql",
        host: `${serverName}.database.windows.net`,
        port: 1433,
        database: dbName,
        logging: true,
        synchronize: synchronize,
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
