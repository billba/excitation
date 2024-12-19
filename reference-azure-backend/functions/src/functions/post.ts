import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Bounds, Review, Event as EventType, Answer as AnswerType } from '../types'
import { DataSource } from 'typeorm';
import { Citation } from "../entity/Citation";
import { Event } from "../entity/Event";
import { dataSource } from "..";
import { Answer } from "../entity/Answer";
import { getAnswer } from "./get";

export const createCitationId = (formId: number, creator: string) => {
  return formId + '-' + creator + '-' + Date.now();
}

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citations table
async function insertCitation(db: DataSource, formId: number, questionId: number, documentId: number, excerpt: string, bounds: Bounds[], review: Review, creator: string) {
  const citation = new Citation();
  const citationId = createCitationId(formId, creator);
  citation.citationId = citationId;
  citation.formId = formId;
  citation.questionId = questionId;
  citation.documentId = documentId;
  citation.excerpt = excerpt;
  citation.bounds = JSON.parse(JSON.stringify(bounds));
  citation.review = review;
  citation.creator = creator;

  return await db.manager.save(citation);
}

// Updates db citations table
async function updateCitationBounds(db: DataSource, citationId: string, bounds: Bounds[]) {
  const citationsRepository = db.getRepository(Citation);
  const citationToUpdate = await citationsRepository.findOne({
    where: { citationId: citationId },
    select: ['citationId', 'excerpt', 'bounds']
  });
  citationToUpdate.bounds = JSON.parse(JSON.stringify(bounds));
  return await citationsRepository.save(citationToUpdate);
}

async function updateCitationReview(db: DataSource, citationId: string, review: Review) {
  const citationsRepository = db.getRepository(Citation);
  const citationToUpdate = await citationsRepository.findOne({
    where: { citationId: citationId },
    select: ['citationId', 'excerpt', 'review']
  });
  citationToUpdate.review = review;
  return await citationsRepository.save(citationToUpdate);
}

// Inserts into db events table
async function insertAddEvent(db: DataSource, event: EventType) {
  const newEvent = new Event();
  newEvent.body = JSON.parse(JSON.stringify(event));
  
  return await db.manager.save(newEvent);
}

// Inserts into db events table
async function insertUpdateReviewEvent(db: DataSource, event: EventType) {
  const newEvent = new Event();
  newEvent.body = JSON.parse(JSON.stringify(event));
  
  return await db.manager.save(newEvent);
}

// Inserts into db events table
async function insertUpdateBoundsEvent(db: DataSource, event: EventType) {
  const newEvent = new Event();
  newEvent.body = JSON.parse(JSON.stringify(event));
  
  return await db.manager.save(newEvent);
}

// ============================================================================
// event handling
// ============================================================================

// Adding a citation involves:
//  - creating a new citation
//  - creating a new event
async function addCitation(db: DataSource, context: InvocationContext, event: EventType) {
  if (event.type === "addCitation") {
    let citation = await insertCitation(db, event.formId, event.questionId, event.documentId, event.excerpt, event.bounds, event.review, event.creator);
    context.log("Created citation:", citation);
    event.citationId = citation[0].citationId;
    let addEvent = await insertAddEvent(db, event);
    context.log("Created event:", addEvent);
  }
}

// Adding a review involves:
//  - updating an existing citation
//  - creating a new event
async function addReview(db: DataSource, context: InvocationContext, event: EventType) {
  if (event.type === 'updateReview') {
    const citation = await updateCitationReview(db, event.citationId, event.review);
    context.log("Updated citation:", citation);
    const updateEvent = await insertUpdateReviewEvent(db, event);
    context.log("Created event:", updateEvent);
  }
}

async function updateAnswer(db: DataSource, answer: AnswerType) {
    const answersRepository = db.getRepository(Answer);
    answersRepository.save(answer);
}

async function createAnswer(db: DataSource, formId: number, questionId: number, creator: string, answerText: string) {
  const answer = new Answer();
  answer.formId = formId;
  answer.questionId = questionId;
  answer.answer = answerText;
  answer.creator = creator;

  return await db.manager.save(answer);
}

// Updating bounds data involves:
//  - updating an existing citation
//  - creating a new event
async function updateBounds(db: DataSource, context: InvocationContext, event: EventType) {
  if (event.type === "updateBounds") {
    let citation = await updateCitationBounds(db, event.citationId, event.bounds);
    context.log("Updated citation:", citation);
    let updateEvent = await insertUpdateBoundsEvent(db, event);
    context.log("Created event:", updateEvent);
  }
}

async function createOrUpdateAnswer(db: DataSource, context: InvocationContext, event: EventType) {
  if (event.type === "updateAnswer") {
    // get answer id by question and form id
    // if answer doesn't exist, create it. Else update the answer field
    let answer = await getAnswer(db, event.formId, event.questionId)
    if (answer) {
      answer.answer = event.answer
      answer.creator = event.creator
      context.log("Updating answer:", answer);
      return await updateAnswer(db, answer)
    } else {
      context.log("Creating answer:", event.formId, event.questionId, event.creator, event.answer);
      return await createAnswer(db, event.formId, event.questionId, event.creator, event.answer)
    }
  }
}

// ============================================================================
// main
// ============================================================================
export async function post(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const body = await request.json() as EventType[];
  for await (const event of body) {
    switch (event.type) {
      case 'addCitation':
        await addCitation(dataSource, context, event);
        break;
      case 'updateReview':
        await addReview(dataSource, context, event);
        break;
      case 'updateBounds':
        await updateBounds(dataSource, context, event);
        break;
      case 'updateAnswer':
        await createOrUpdateAnswer(dataSource, context, event);
        break;
    }
  }

  return { status: 200 };
};

app.http('post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'event',
  handler: post
});
