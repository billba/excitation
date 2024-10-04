# Readme

`create.sql` can be run against a postgres database to create:

## Tables

- **documents**: links to PDFs and DocIntelligence responses in blob storage
- **templates**: logical sets for...
- **questions**
- **forms**: combination of a template with a set of documents
- **citations**: excerpts of text and reference docs, potentially with bounds
- **events**: log of user and system events

## Insertions

- 2 documents, `PressReleaseFY24Q3.pdf` and `Microsoft 10Q FY24Q3 1.pdf`
- 1 template, **Microsoft Fiscal**
- 6 questions, all linked to template 1
- 1 form, **FY24Q3**, that uses template 1 and documents 1 and 2
- 9 citations that cover all questions and use both documents