# Excitation

## Overview

Many customers need to extract data trapped in PDFs and other unstructured documents. This often involves humans answering a series of questions by searching for relevant information in these documents. Large Language Models (LLMs) and AI Search offer the opportunity to accelerate this process by automatically finding relevant information, which is then used to generate answers.

## Challenges

However, there are several challenges:
- What if the information isn't relevant?
- What if something got missed?
- What if the cited excerpt would be better if it were a little longer or shorter?

Most experiences pay lip service to "human-in-the-loop," but they are not an effective oversight strategy:
- Showing the generated answer first heavily biases users to accept the answer.
- Most users do not click on "citation links."
- If they do, they are predisposed to look for confirmation of the generated answer.
- Citations are often shown as orphaned excerpts, without the surrounding context of the source material.

## Solution: Excitation

![Excitation Architecture Diagram](https://github.com/user-attachments/assets/987b2aec-f8c5-4dc4-a737-238799502daf)


Excitation proposes an enhanced user experience that turns this process upside down by:
- Keeping the familiar manual process of search-then-answer.
- Showing suggested excerpts in context directly in the PDF.
- Allowing the user to change those excerpts before the answer is generated.


## AI Design Wins Criteria

- **AI Platform**: Azure Document Intelligence and Azure OpenAI
- **App Platform**: Azure Functions
- **Data Platform**: Cosmos DB


[iframed pdf.js viewer](pdfjs-viewer-search-sample)
