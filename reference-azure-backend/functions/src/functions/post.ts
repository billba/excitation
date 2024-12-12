import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Bounds, Review, Event as EventType } from '../types'
import { DataSource } from 'typeorm';
import { getDataSource } from "../data-source";
import { Citation } from "../entity/Citation";
import { Event } from "../entity/Event";

export const createCitationId = (formId: number, creator: string) => {
  return formId + '-' + creator + '-' + Date.now();
}

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citations table
async function insertCitation(db: DataSource, form_id: number, question_id: number, document_id: number, excerpt: string, bounds: Bounds[], review: Review, creator: string) {
  const citation = new Citation();
  const citation_id = createCitationId(form_id, creator);
  citation.citation_id = citation_id;
  citation.form_id = form_id;
  citation.question_id = question_id;
  citation.document_id = document_id;
  citation.excerpt = excerpt;
  citation.bounds = JSON.parse(JSON.stringify(bounds));
  citation.review = review;
  citation.creator = creator;

  return await db.manager.save(citation);
}

// Updates db citations table
async function updateCitationBounds(db: DataSource, citation_id: string, bounds: Bounds[]) {
  const citationsRepository = db.getRepository(Citation);
  const citationToUpdate = await citationsRepository.findOne({
    where: { citation_id: citation_id },
    select: ['citation_id', 'excerpt', 'bounds']
  });
  citationToUpdate.bounds = JSON.parse(JSON.stringify(bounds));
  return await citationsRepository.save(citationToUpdate);
}

async function updateCitationReview(db: DataSource, citation_id: string, review: Review) {
  const citationsRepository = db.getRepository(Citation);
  const citationToUpdate = await citationsRepository.findOne({
    where: { citation_id: citation_id },
    select: ['citation_id', 'excerpt', 'review']
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
    event.citationId = citation[0].citation_id;
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

// ============================================================================
// main
// ============================================================================
export async function post(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let dataSource = await getDataSource();

  await dataSource.initialize().then(async () => {
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
      }
    }
  }).catch((error) => {
    console.log(error);
    return error;
  });

  return { status: 200 };
};

app.http('post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: '',
  handler: post
});
