import { DataSource } from 'typeorm';
import { templates } from './schema';
import { Templates } from './entity/Templates';
import { Questions } from './entity/Questions';
import { Forms } from './entity/Forms';
import { Documents } from './entity/Documents';
import { Citations } from './entity/Citations';
import { Events } from './entity/Events';

export const AppDataSource = new DataSource({
    type: "mssql",
    host: "localhost",
    port: 1433,
    username: "test",
    password: "test",
    database: "test",
    synchronize: true,
    logging: true,
    entities: [Templates, Questions, Forms, Documents, Citations, Events],
    subscribers: [],
    migrations: [],
})