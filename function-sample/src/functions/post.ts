import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { citations, events } from '../schema';
import { BoundingRegion, Review, Event } from '../types'

const queryClient = postgres(process.env.POSTGRES);
const db = drizzle(queryClient);

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citations table
async function insertCitation(formId: number, questionId: number, documentId: number, excerpt: string, bounds: BoundingRegion[], review: Review, creator: string) {
    return await db.insert(citations).values({
        form_id: formId,
        question_id: questionId,
        document_id: documentId,
        excerpt: excerpt,
        bounds: bounds,
        bounds_created_at: sql`now()`,
        review: review,
        creator: creator
    }).returning();
}

// Updates db citations table
async function updateCitationBounds(citationId: number, bounds: BoundingRegion[]) {
    return db.update(citations).set({
        bounds: bounds,
        bounds_created_at: sql`now()`
    }).where(eq(citations.id, citationId)).returning();
}

async function updateCitationReview(citationId: number, review: Review) {
    return db.update(citations).set({
        review: review
    }).where(eq(citations.id, citationId)).returning();
}

// Inserts into db events table
async function insertAddEvent(formId: number, questionId: number, documentId: number, citationId: number, excerpt: string, bounds: BoundingRegion[], creator: string) {
    return db.insert(events).values({
        type: 'add',
        form_id: formId,
        question_id: questionId,
        document_id: documentId,
        citation_id: citationId,
        excerpt: excerpt,
        bounds: bounds,
        review: Review.Approved,
        creator: creator
    }).returning();
}

// Inserts into db events table
async function insertReviewEvent(citationId: number, review: Review, creator: string) {
    return db.insert(events).values({
        type: 'review',
        citation_id: citationId,
        review: review,
        creator: creator
    }).returning();
}

// Inserts into db events table
async function insertUpdateEvent(citationId: number, bounds: BoundingRegion[], creator: string) {
    return db.insert(events).values({
        type: 'update',
        citation_id: citationId,
        bounds: bounds,
        creator: creator
    }).returning();
}

// ============================================================================
// event handling
// ============================================================================

// Adding a citation involves creating a new citation and a new event
async function addCitation(context: InvocationContext, formId: number, questionId: number, documentId: number, excerpt: string, bounds: BoundingRegion[], review: Review, creator: string) {
    let citation = await insertCitation(formId, questionId, documentId, excerpt, bounds, review, creator);
    context.log("Created citation:", citation);
    let citationId = citation[0].id;
    let event = await insertAddEvent(formId, questionId, documentId, citationId, excerpt, bounds, review, creator);
    context.log("Created event:", event);
}

// Adding a review involves creating a new event
async function addReview(context: InvocationContext, citationId: number, review: Review, creator: string) {
    const citation = await updateCitationReview(citationId, review);
    context.log("Updated citation:", citation);
    const event = await insertReviewEvent(citationId, review, creator);
    context.log("Created event:", event);
}

// Updating bounds data involves updating an existing citation
async function updateBounds(context: InvocationContext, citationId: number, bounds: BoundingRegion[], creator: string) {
    let citation = await updateCitationBounds(citationId, bounds);
    context.log("Updated citation:", citation);
    let event = await insertUpdateEvent(citationId, bounds, creator);
    context.log("Created event:", event);
}

// ============================================================================
// main
// ============================================================================
export async function post(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = await request.json() as Event[];
    for (let index = 0; index < body.length; index++) {
        let event = body[index] as Event;
        switch (event.type) {
            case 'addCitation':
                await addCitation(context, event.formId, event.questionId, event.documentId, event.excerpt, event.bounds, event.review, event.creator);
                break;
            case 'updateReview':
                await addReview(context, event.citationId, event.review, event.creator);
                break;
            case 'updateBounds':
                await updateBounds(context, event.citationId, event.bounds, event.creator);
                break;
        }
    }  
};

app.http('post', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: '',
    handler: post
});
