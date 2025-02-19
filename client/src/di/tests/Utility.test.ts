import { describe, it, expect } from "vitest";
import {
  adjacent,
  comparePointToPolygon,
  comparePoints,
  combinePolygons,
  combinePolygons4,
} from "../Utility";
import type { Point, Polygon4 } from "../Types";

describe("Utility.ts", () => {
  describe("comparePoints", () => {
    it("returns 0 if points have the same coordinates", () => {
      const p1: Point = { x: 100, y: 200 };
      const p2: Point = { x: 100, y: 200 };
      expect(comparePoints(p1, p2)).toBe(0);
    });

    it("returns -1 if point is earlier in document flow (smaller y, or same y but smaller x)", () => {
      const p1: Point = { x: 100, y: 199 };
      const p2: Point = { x: 100, y: 200 };
      expect(comparePoints(p1, p2)).toBe(-1);

      const p3: Point = { x: 99, y: 200 };
      const p4: Point = { x: 100, y: 200 };
      expect(comparePoints(p3, p4)).toBe(-1);
    });

    it("returns +1 if point is later in document flow", () => {
      const p1: Point = { x: 100, y: 201 };
      const p2: Point = { x: 100, y: 200 };
      expect(comparePoints(p1, p2)).toBe(1);

      const p3: Point = { x: 101, y: 200 };
      const p4: Point = { x: 100, y: 200 };
      expect(comparePoints(p3, p4)).toBe(1);
    });
  });

  describe("comparePointToPolygon", () => {
    const poly: Polygon4 = [100, 100, 200, 100, 200, 200, 100, 200]; // A 100x100 square

    it("returns 0 if point is inside the polygon", () => {
      const point: Point = { x: 150, y: 150 };
      expect(comparePointToPolygon(point, poly)).toBe(0);
    });

    it("returns -1 if point is above or to the left of the polygon region", () => {
      const pointAbove: Point = { x: 150, y: 50 };
      expect(comparePointToPolygon(pointAbove, poly)).toBe(-1);

      const pointLeft: Point = { x: 50, y: 150 };
      expect(comparePointToPolygon(pointLeft, poly)).toBe(-1);
    });

    it("returns +1 if point is below or to the right of the polygon region", () => {
      const pointBelow: Point = { x: 150, y: 250 };
      expect(comparePointToPolygon(pointBelow, poly)).toBe(1);

      const pointRight: Point = { x: 250, y: 150 };
      expect(comparePointToPolygon(pointRight, poly)).toBe(1);
    });
  });

  describe("adjacent", () => {
    // Two squares next to each other with a small gap
    const polyA: Polygon4 = [0, 0, 10, 0, 10, 10, 0, 10];
    const polyB: Polygon4 = [11, 0, 20, 0, 20, 10, 11, 10];
    const polyC: Polygon4 = [10, 0, 20, 0, 20, 10, 10, 10]; // Touching edge with A

    it("returns true if polygons are touching or overlapping (considering delta)", () => {
      // polyA and polyC share a border at x=10
      expect(adjacent(polyA, polyC, 0)).toBe(true);
    });

    it("returns false if polygons are separated more than delta", () => {
      // polyA and polyB have 1 unit gap
      // with delta=0, they are not adjacent
      expect(adjacent(polyA, polyB, 0)).toBe(false);
      // but with delta=1, they become adjacent
      expect(adjacent(polyA, polyB, 1)).toBe(true);
    });
  });

  describe("combinePolygons4", () => {
    it("combines a list of two polygons into a single bounding polygon4", () => {
      const poly1: Polygon4 = [0, 0, 10, 0, 10, 10, 0, 10];
      const poly2: Polygon4 = [10, 0, 20, 0, 20, 10, 10, 10];
      const result = combinePolygons4([poly1, poly2]);

      // Expect bounding box from (0,0) to (20,10)
      expect(result).toEqual([0, 0, 20, 0, 20, 10, 0, 10]);
    });
  });

  describe("combinePolygons", () => {
    it("handles a single line (head-only) polygon array", () => {
      const poly1: Polygon4 = [100, 100, 200, 100, 200, 150, 100, 150];
      const result = combinePolygons([poly1]);
      // 'head' alone
      expect(result.head).toEqual(poly1);
      expect(result.body).toBeUndefined();
      expect(result.tail).toBeUndefined();
    });

    it("handles multiple lines (head, body, tail)", () => {
      const line1: Polygon4[] = [
        [21, 0, 41, 0, 41, 20, 21, 20],
        [62, 0, 82, 0, 82, 20, 62, 20],
      ]; // head
      const line2: Polygon4[] = [
        [0, 25, 20, 25, 20, 45, 0, 45],
        [21, 25, 41, 25, 41, 45, 21, 45],
        [62, 25, 82, 25, 82, 45, 62, 45],
      ]; // body
      const line3: Polygon4[] = [
        [0, 50, 20, 50, 20, 70, 0, 70],
        [21, 50, 41, 50, 41, 70, 21, 70],
      ]; // tail
      const combinedLines: Polygon4[] = [...line1, ...line2, ...line3];
      const result = combinePolygons(combinedLines);

      expect(result.head).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.tail).toBeDefined();
    });
  });
});
