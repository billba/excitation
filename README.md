# Excitation

_Excitation_ is a ***design pattern*** for responsibly accelerating the common business problem of mass data extraction from unstructured documents. If you do nothing but understand the problem, the limitations of a typical solution, and the advantages of the _Excitation_ approach, then this repo was a huge success.

This repo also contains a ***client application*** implementing the _Excitation_ design pattern. You may find you can use this application out of the box, or with modifications, or just use it as inspiration for your custom solution. Any of these is a great outcome.

The client requires ***a backend***, and two reference implementations are provided. A local deno backend built on in-memory demonstration data for rapid development, and an Azure backend built on a SQL Server database. But don't be fooled, **this database is empty, and is meant to be populated by additional services which are not part of this repo**.

Why toy with your heart in this way? Because every company is different, every scenario is different, every tech stack is different, and the technological landsape is changing in real time. So you will have to figure out how to best determine relevant excerpts and, perhaps generate answers.

## Quick Start

To get running quickly, carefully follow the instructions to run the [client](./client/) and the [local backend](./local-backend/). They both need to be running.

## The problem

In many companies, teams of humans are paid to fill out forms (or questionaires or applications) based on information stored within PDFs. Typically each instance of a given form has unique documents, and even unique _kinds_ of documents, making it resistant to automated extraction.

For example:

* An insurance underwriter fills out an insurance application for a given applicant based on documents submitted by that applicant's insurance broker.
* A clinician verifies that a given patient has satisfied certain protocol requirements for a given prescription or procedure, e.g. they are within a given age range, and do not have a given condition, and are not taking a given drug, based on documents submitted by their doctor.
* An investment analyst fills out a form for a given company based on public financial documents from that company, including highy designed annual reports.

Right now these individuals search manually through PDFs using Adobe Acrobat Reader or other PDF viewing applications, identifying relevant information which allow them to answer questions in the form. This is highly time consuming.

In addition, most companies do not keep a robust paper trail for this process. If a reviewer attempted to determine how a given answer was arrived at, it would often be impossible to do better than pointing at a specific document, or even just the set of documents. And if this explanation were required due to auditing or legal discovery, it could present a significant risk for the company.

It seems obvious that modern technology can improve this process.

## The naive solution pattern

It is common to have a computer identify document excerpts relevant for answering a given question, and then answer that question using those excerpts.

Understanding that computers are imperfect, a human is placed in the loop. That human is given the computer-generated answer, and a list of citations, which they can click on to understand the source of the answer. A warning like "AI generated answers may be incorrect" is typically included.

This approach is problematic in a number of ways:

* Despite the warning, users might accept the computer-generated answer at face value, without veryifying the citation links
* Citation links often show just the excerpted text, presented without the context of the original document. That context may be critical, affecting the interpretation of the excerpt in small or large ways.
* Since the user has already seen the generated answer, they are heavily biased to find the answer text in the excerpt and be satisfied if they succeed. But the presence of the text in the excerpt doesn't mean it is the correct answer to the question.
* If the excerpt is not relevent, the user has no recourse. They cannot regenerate the answer without the excerpt.
* Similarly, if the user sees a more relevant excerpt in the document, they cannot regenerate the answer with it.
* Typically the citations for a given question are not persisted and if the are there is often no way to know if a user looked at them, or what their assessment was.

## The _Excitation_ solution pattern

We propose a different, more responsible pattern that is highly amenable to acceleration via technology: _**suggest**_, _**review**_, _**answer**_.

For a given question:

* Relevant citations for a given question are **suggested** (by a human or the computer or a combination thereof)
* Each citation must be **reviewed** by a (potentially different) human _in the context of the original document_. It can be approved outright as relevant in answering the question, revised to include a more precisely relevent excerpt, or rejected as irrelevent. During this stage the human can also look for and add new citations they consider relevent.
* Either the computer or the human **answers** the question based solely on approved citations. In the case of the computer, the human must review the answer. At this point they may choose to go back to the citation review process to find more relevent information, or manually enter an answer themselves.

It is straightforward to amend this pattern with additional manual and/or automated review stages. If deemed appropriate, a human could review the automated review of the human review of an automated suggestion.

This pattern actually does not require any computers at all, let alone fancy tech like Gen AI. Just manually observing this process and recording the steps would yield a more robust and less risky outcome. But of course incorporating tech such as Search and/or Gen AI promises to accelerate things dramatically.