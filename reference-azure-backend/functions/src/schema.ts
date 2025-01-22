import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const templateSchema = pgTable('template', {
  templateId: serial('templateId').primaryKey().notNull(),
  templateName: text('templateName').notNull(),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const questionSchema = pgTable('question', {
  questionId: serial('questionId').primaryKey().notNull(),
  templateId: integer('templateId').references(() => templateSchema.templateId),
  text: text('text').notNull(),
  prefix: text('prefix'),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const formSchema = pgTable('form', {
  formId: serial('formId').primaryKey().notNull(),
  templateId: integer('templateId').references(() => templateSchema.templateId),
  formName: text('formName').notNull(),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const documentSchema = pgTable('document', {
  documentId: serial('documentId').primaryKey().notNull(),
  formId: integer('formId').references(() => formSchema.formId),
  name: text('name'),
  pdfUrl: text('pdfUrl').notNull(),
  diUrl: text('diUrl'),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const citationSchema = pgTable('citation', {
  citationId: text('citationId').primaryKey(),
  formId: integer('formId').references(() => formSchema.formId),
  questionId: integer('questionId').references(() => questionSchema.questionId),
  documentId: integer('documentId').references(() => documentSchema.documentId),
  excerpt: text('excerpt').notNull(),
  bounds: jsonb('bounds'),
  review: integer('review').notNull().default(0),
  creator: text('creator').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  modifiedAt: timestamp('modifiedAt').notNull().defaultNow()
});

export const eventSchema = pgTable('event', {
  event_id: serial('event_id').primaryKey().notNull(),
  body: jsonb('body').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow()
});
