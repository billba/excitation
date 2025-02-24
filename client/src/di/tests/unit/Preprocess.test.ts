import { describe, it, expect, beforeEach } from "vitest";
import { createPerPageRegions } from "../../Preprocess";
import { DocIntResponse, Page, Polygon4 } from "../../Types";

/** A mock polygon for lines/words. */
const poly: Polygon4 = [100, 100, 200, 100, 200, 150, 100, 150];

describe("createPerPageRegions", () => {
  let fakeDoc: DocIntResponse;
  let page1: Page;

  beforeEach(() => {
    fakeDoc = {
      status: "succeeded",
      createdDateTime: "",
      lastUpdatedDateTime: "",
      analyzeResult: {
        apiVersion: "2023-07-31",
        modelId: "mockModel",
        stringIndexType: "utf16CodeUnit",
        pages: [
          {
            pageNumber: 1,
            angle: 0,
            width: 612,
            height: 792,
            unit: "pixel",
            words: [
              {
                content: "First",
                polygon: poly,
                confidence: 1,
                span: { offset: 0, length: 5 },
              },
              {
                content: "line",
                polygon: poly,
                confidence: 1,
                span: { offset: 6, length: 4 },
              },
              {
                content: "of",
                polygon: poly,
                confidence: 1,
                span: { offset: 11, length: 2 },
              },
              {
                content: "text,",
                polygon: poly,
                confidence: 1,
                span: { offset: 14, length: 5 },
              },
              {
                content: "second",
                polygon: poly,
                confidence: 1,
                span: { offset: 20, length: 6 },
              },
              {
                content: "line",
                polygon: poly,
                confidence: 1,
                span: { offset: 27, length: 4 },
              },
              {
                content: "of",
                polygon: poly,
                confidence: 1,
                span: { offset: 32, length: 2 },
              },
              {
                content: "text",
                polygon: poly,
                confidence: 1,
                span: { offset: 35, length: 4 },
              },
            ],
            lines: [
              {
                content: "First line   of text,",
                polygon: poly,
                spans: [{ offset: 0, length: 19 }],
              },
              {
                content: "second line of text",
                polygon: poly,
                spans: [{ offset: 20, length: 19 }],
              },
            ],
            spans: [],
          },
        ],
        paragraphs: [
          {
            content: "First line   of text, second line of text",
            spans: [{ offset: 0, length: 39 }],
            boundingRegions: [
              {
                pageNumber: 1,
                polygon: poly,
              },
            ],
          },
        ],
        tables: [],
        styles: [],
      },
    };

    createPerPageRegions(fakeDoc);
    page1 = fakeDoc.analyzeResult.pages[0];
  });

  it("should define regions on the page", () => {
    expect(page1.regions).toBeDefined();
    expect(page1.regions?.length).toBe(1);
  });

  it("should assign correct line indices", () => {
    const region = page1.regions![0];
    expect(region.lineIndices).toEqual([0, 1]);
  });

  it("should assign correct word indices", () => {
    const region = page1.regions![0];
    expect(region.wordIndices).toEqual([0, 7]);
  });

  it("should reference the correct paragraph index", () => {
    const region = page1.regions![0];
    expect(region.paragraphIndex).toBe(0);
  });
});
