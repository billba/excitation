import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const templates = pgTable('templates', {
  templateId: serial('templateId').primaryKey().notNull(),
  templateName: text('templateName').notNull(),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const questions = pgTable('questions', {
  questionId: serial('questionId').primaryKey().notNull(),
  templateId: integer('templateId').references(() => templates.templateId),
  text: text('text').notNull(),
  prefix: text('prefix'),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const forms = pgTable('forms', {
  formId: serial('formId').primaryKey().notNull(),
  templateId: integer('templateId').references(() => templates.templateId),
  formName: text('formName').notNull(),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const documents = pgTable('documents', {
  documentId: serial('documentId').primaryKey().notNull(),
  formId: integer('formId').references(() => forms.formId),
  name: text('name'),
  pdfUrl: text('pdfUrl').notNull(),
  diUrl: text('diUrl'),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const citations = pgTable('citations', {
  citationId: text('citationId').primaryKey(),
  formId: integer('formId').references(() => forms.formId),
  questionId: integer('questionId').references(() => questions.questionId),
  documentId: integer('documentId').references(() => documents.documentId),
  excerpt: text('excerpt').notNull(),
  bounds: jsonb('bounds'),
  review: integer('review').notNull().default(0),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const events = pgTable('events', {
  event_id: serial('event_id').primaryKey().notNull(),
  body: jsonb('body').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow()
});
