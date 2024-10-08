DROP TABLE IF EXISTS documents, templates, questions, forms, citations, events;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  friendly_name TEXT,
  pdf_url TEXT NOT NULL,
  di_url TEXT,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  prefix TEXT,
  text TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE forms (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  document_ids INTEGER[] NOT NULL,
  form_name TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE citations (
  id SERIAL PRIMARY KEY,
  citation_id TEXT NOT NULL UNIQUE,
  form_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  excerpt TEXT NOT NULL,
  bounds JSONB,
  review INTEGER NOT NULL DEFAULT 0,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  body JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO documents (file_name, friendly_name, pdf_url, di_url, creator) 
VALUES 
  ('PressReleaseFY24Q3.pdf', 'PressReleaseFY24Q3', 'https://excitation.blob.core.windows.net/documents/PressReleaseFY24Q3.pdf', 'https://excitation.blob.core.windows.net/documents/PressReleaseFY24Q3.pdf.json', 'system'),
  ('Microsoft 10Q FY24Q3 1.pdf', 'Microsoft 10Q FY24Q3 1', 'https://excitation.blob.core.windows.net/documents/Microsoft 10Q FY24Q3 1.pdf', 'https://excitation.blob.core.windows.net/documents/Microsoft 10Q FY24Q3 1.pdf.json', 'system');

INSERT INTO templates (template_name, creator)
VALUES
  ('Microsoft Fiscal', 'system');

INSERT INTO questions (template_id, prefix, text, creator)
VALUES
  (1, '1', 'What was the company''s revenue for the third quarter of Fiscal Year 2024?', 'system'),
  (1, '2', 'What are the earnings per share (EPS) for this quarter?', 'system'),
  (1, '3', 'How much money did Microsoft return to shareholders in the form of share repurchases?', 'system'),
  (1, '4', 'What are the total assets reported?', 'system'),
  (1, '5', 'Are there any ongoing legal proceedings?', 'system'),
  (1, '6', 'What is an excerpt that spans two pages?', 'system');

INSERT INTO forms (template_id, document_ids, form_name, creator)
VALUES
  (1,'{1,2}', 'FY24Q3', 'system');

INSERT INTO citations (citation_id, form_id, question_id, document_id, excerpt, creator)
VALUES
  ('', 1, 1, 1, 'Revenue was $61.9 billion and increased 17%.', 'system'),
  ('', 1, 1, 2, '61,858', 'system'),
  ('', 1, 2, 1, '$2.94', 'system'),
  ('', 1, 3, 1, 'Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.', 'system'),
  ('', 1, 4, 1, '484,275', 'system'),
  ('', 1, 4, 2, '484,275', 'system'),
  ('', 1, 5, 1, 'Claims against us that may result in adverse outcomes in legal disputes.', 'system'),
  ('', 1, 5, 2, 'Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused their brain tumors and other adverse health effects.', 'system'),
  ('', 1, 6, 1, '· laws and regulations relating to the handling of personal data that may impede the adoption of our services or result in increased costs, legal claims, fines, or reputational damage;\n· claims against us that may result in adverse outcomes in legal disputes;', 'system');