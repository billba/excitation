import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const templates = pgTable('templates', {
  template_id: serial('template_id').primaryKey().notNull(),
  template_name: text('template_name').notNull(),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow()
});

export const questions = pgTable('questions', {
  question_id: serial('question_id').primaryKey().notNull(),
  template_id: integer('template_id').references(() => templates.template_id),
  text: text('text').notNull(),
  prefix: text('prefix'),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow()
});

export const forms = pgTable('forms', {
  form_id: serial('form_id').primaryKey().notNull(),
  template_id: integer('template_id').references(() => templates.template_id),
  form_name: text('form_name').notNull(),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow()
});

export const documents = pgTable('documents', {
  document_id: serial('document_id').primaryKey().notNull(),
  form_id: integer('form_id').references(() => forms.form_id),
  name: text('name'),
  pdf_url: text('pdf_url').notNull(),
  di_url: text('di_url'),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow()
});

export const citations = pgTable('citations', {
  citation_id: text('citation_id').primaryKey(),
  form_id: integer('form_id').references(() => forms.form_id),
  question_id: integer('question_id').references(() => questions.question_id),
  document_id: integer('document_id').references(() => documents.document_id),
  excerpt: text('excerpt').notNull(),
  bounds: jsonb('bounds'),
  review: integer('review').notNull().default(0),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow()
});

export const events = pgTable('events', {
  event_id: serial('event_id').primaryKey().notNull(),
  body: jsonb('body').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});
