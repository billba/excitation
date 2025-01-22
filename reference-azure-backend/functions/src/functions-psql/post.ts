import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { citationSchema, eventSchema } from '../schema'
import { Bounds, Review, Event } from '../types'

export const createCitationId = (formId: number, creator: string) => {
  return formId + '-' + creator + '-' + Date.now();
}

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citation table
async function insertCitation(db: PostgresJsDatabase, formId: number, questionId: number, documentId: number, excerpt: string, bounds: Bounds[], review: Review, creator: string) {
  const citationId = createCitationId(formId, creator);
  /* @ts-ignore */
  return await db.insert(citationSchema).values({
    citationId,
    formId,
    questionId,
    documentId,
    excerpt,
    bounds,
    review,
    creator
  }).returning();
}

// Updates db citation table
async function updateCitationBounds(db: PostgresJsDatabase, citationId: string, bounds: Bounds[]) {
  return db.update(citationSchema).set({
    /* @ts-ignore */
    bounds,
  }).where(eq(citationSchema.citationId, citationId)).returning({
    citationId: citationSchema.citationId,
    excerpt: citationSchema.excerpt,
    bounds: citationSchema.bounds
  });
}

async function updateCitationReview(db: PostgresJsDatabase, citationId: string, review: Review) {
  return db.update(citationSchema).set({
    /* @ts-ignore */
    review
  }).where(eq(citationSchema.citationId, citationId)).returning({
    citationId: citationSchema.citationId,
    excerpt: citationSchema.excerpt,
    review: citationSchema.review
  });
}

// Inserts into db event table
async function insertAddEvent(db: PostgresJsDatabase, event: Event) {
  /* @ts-ignore */
  return db.insert(eventSchema).values({
    body: event
  }).returning({
    body: eventSchema.body,
    createdAt: citationSchema.createdAt
  });
}

// Inserts into db event table
async function insertUpdateReviewEvent(db: PostgresJsDatabase, event: Event) {
  /* @ts-ignore */
  return db.insert(eventSchema).values({
    body: event
  }).returning({
    body: eventSchema.body,
    createdAt: eventSchema.createdAt
  });
}

// Inserts into db event table
async function insertUpdateBoundsEvent(db: PostgresJsDatabase, event: Event) {
  /* @ts-ignore */
  return db.insert(eventSchema).values({
    body: event
  }).returning({
    body: eventSchema.body,
    createdAt: eventSchema.createdAt
  });
}

// ============================================================================
// event handling
// ============================================================================

// Adding a citation involves:
//  - creating a new citation
//  - creating a new event
async function addCitation(db: PostgresJsDatabase, context: InvocationContext, event: Event) {
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
async function addReview(db: PostgresJsDatabase, context: InvocationContext, event: Event) {
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
async function updateBounds(db: PostgresJsDatabase, context: InvocationContext, event: Event) {
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

  /* @ts-ignore */
  const queryClient = postgres(process.env["POSTGRES"]);
  const db = drizzle(queryClient);

  const body = await request.json() as Event[];
  for await (const event of body) {
    switch (event.type) {
      case 'addCitation':
        await addCitation(db, context, event);
        break;
      case 'updateReview':
        await addReview(db, context, event);
        break;
      case 'updateBounds':
        await updateBounds(db, context, event);
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
