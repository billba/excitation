import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey().notNull(),
  file_name: text('file_name').notNull(),
  friendly_name: text('friendly_name'),
  pdf_url: text('pdf_url').notNull(),
  di_url: text('di_url'),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey().notNull(),
  template_name: text('template_name').notNull(),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey().notNull(),
  template_id: integer('template_id').notNull(),
  text: text('text').notNull(),
  prefix: text('prefix'),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const forms = pgTable('forms', {
  id: serial('id').primaryKey().notNull(),
  template_id: integer('template_id').notNull(),
  document_ids: integer('document_ids').array().notNull(),
  form_name: text('form_name').notNull(),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const citations = pgTable('citations', {
  id: serial('id').primaryKey().notNull(),
  citation_id: text('citation_id').notNull().unique(),
  form_id: integer('form_id').notNull(),
  question_id: integer('question_id').notNull(),
  document_id: integer('document_id').notNull(),
  excerpt: text('excerpt').notNull(),
  bounds: jsonb('bounds'),
  review: integer('review').notNull().default(0),
  creator: text('creator').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const events = pgTable('events', {
  id: serial('id').primaryKey().notNull(),
  body: jsonb('body').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow()
});
