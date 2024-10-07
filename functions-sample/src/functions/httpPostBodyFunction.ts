import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { citations, events } from '../schema'
import { BoundingRegion, Review, Event } from '../types'

const queryClient = postgres(process.env.POSTGRES);
const db = drizzle(queryClient);

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citations table
async function insertCitation(form_id: number, question_id: number, document_id: number, excerpt: string, bounds: BoundingRegion[], review: Review, creator: string) {
  /* @ts-ignore */
  return await db.insert(citations).values({
    form_id,
    question_id,
    document_id,
    excerpt,
    bounds,
    review,
    creator
  }).returning();
}

// Updates db citations table
async function updateCitationBounds(citation_id: number, bounds: BoundingRegion[]) {
  return db.update(citations).set({
    /* @ts-ignore */
    bounds,
  }).where(eq(citations.id, citation_id)).returning({
    id: citations.id,
    excerpt: citations.excerpt,
    bounds: citations.bounds
  });
}

async function updateCitationReview(citation_id: number, review: Review) {
  return db.update(citations).set({
    /* @ts-ignore */
    review
  }).where(eq(citations.id, citation_id)).returning({
    id: citations.id,
    excerpt: citations.excerpt,
    review: citations.review
  });
}

// Inserts into db events table
async function insertAddEvent(event: Event) {
  /* @ts-ignore */
  return db.insert(events).values({
    body: event
  }).returning({
    body: events.body,
    created_at: events.created_at
  });
}

// Inserts into db events table
async function insertUpdateReviewEvent(event: Event) {
  /* @ts-ignore */
  return db.insert(events).values({
    body: event
  }).returning({
    body: events.body,
    created_at: events.created_at
  });
}

// Inserts into db events table
async function insertUpdateBoundsEvent(event: Event) {
  /* @ts-ignore */
  return db.insert(events).values({
    body: event
  }).returning({
    body: events.body,
    created_at: events.created_at
  });
}

// ============================================================================
// event handling
// ============================================================================

// Adding a citation involves:
//  - creating a new citation
//  - creating a new event
async function addCitation(context: InvocationContext, event: Event) {
  if (event.type === "addCitation") {
    let citation = await insertCitation(event.formId, event.questionId, event.documentId, event.excerpt, event.bounds, event.review, event.creator);
    context.log("Created citation:", citation);
    event.citationId = citation[0].id;
    let addEvent = await insertAddEvent(event);
    context.log("Created event:", addEvent);
  }
}

// Adding a review involves:
//  - updating an existing citation
//  - creating a new event
async function addReview(context: InvocationContext, event: Event) {
  if (event.type === 'updateReview') {
    const citation = await updateCitationReview(event.citationId, event.review);
    context.log("Updated citation:", citation);
    const updateEvent = await insertUpdateReviewEvent(event);
    context.log("Created event:", updateEvent);
  }
}

// Updating bounds data involves:
//  - updating an existing citation
//  - creating a new event
async function updateBounds(context: InvocationContext, event: Event) {
  if (event.type === "updateBounds") {
    let citation = await updateCitationBounds(event.citationId, event.bounds);
    context.log("Updated citation:", citation);
    let updateEvent = await insertUpdateBoundsEvent(event);
    context.log("Created event:", updateEvent);
  }
}

// ============================================================================
// main
// ============================================================================
export async function post(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const body = await request.json() as Event[];
  for await (const event of body) {
    switch (event.type) {
      case 'addCitation':
        await addCitation(context, event);
        break;
      case 'updateReview':
        await addReview(context, event);
        break;
      case 'updateBounds':
        await updateBounds(context, event);
        break;
    }
  }

  return { status: 200 };
};

app.http('post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: '',
  handler: post
});
