import { describe, it, expect } from "vitest";
import {
  adjacent,
  comparePointToPolygon,
  comparePoints,
  combinePolygons,
  combinePolygons4,
} from "../../Utility";
import type { Point, Polygon4 } from "../../Types";

describe("Utility.ts", () => {
  describe("comparePoints", () => {
    it("returns 0 if points have the same coordinates", () => {
      const p1: Point = { x: 100, y: 200 };
      const p2: Point = { x: 100, y: 200 };
      expect(comparePoints(p1, p2)).toBe(0);
    });

    it("returns -1 if the first point is earlier in document flow", () => {
      expect(comparePoints({ x: 100, y: 199 }, { x: 100, y: 200 })).toBe(-1);
      expect(comparePoints({ x: 99, y: 200 }, { x: 100, y: 200 })).toBe(-1);
    });

    it("returns +1 if the first point is later in document flow", () => {
      expect(comparePoints({ x: 100, y: 201 }, { x: 100, y: 200 })).toBe(1);
      expect(comparePoints({ x: 101, y: 200 }, { x: 100, y: 200 })).toBe(1);
    });
  });

  describe("comparePointToPolygon", () => {
    const poly: Polygon4 = [100, 100, 200, 100, 200, 200, 100, 200];

    it("returns 0 if the point is inside the polygon", () => {
      expect(comparePointToPolygon({ x: 150, y: 150 }, poly)).toBe(0);
    });

    it("returns -1 if the point is above or to the left of the polygon", () => {
      expect(comparePointToPolygon({ x: 150, y: 50 }, poly)).toBe(-1);
      expect(comparePointToPolygon({ x: 50, y: 150 }, poly)).toBe(-1);
    });

    it("returns +1 if the point is below or to the right of the polygon", () => {
      expect(comparePointToPolygon({ x: 150, y: 250 }, poly)).toBe(1);
      expect(comparePointToPolygon({ x: 250, y: 150 }, poly)).toBe(1);
    });
  });

  describe("adjacent", () => {
    const polyA: Polygon4 = [0, 0, 10, 0, 10, 10, 0, 10];
    const polyB: Polygon4 = [11, 0, 20, 0, 20, 10, 11, 10];
    const polyC: Polygon4 = [10, 0, 20, 0, 20, 10, 10, 10];

    it("returns true if polygons are touching or overlapping", () => {
      expect(adjacent(polyA, polyC, 0)).toBe(true);
    });

    it("returns false if polygons are separated beyond delta", () => {
      expect(adjacent(polyA, polyB, 0)).toBe(false);
      expect(adjacent(polyA, polyB, 1)).toBe(true);
    });
  });

  describe("combinePolygons4", () => {
    it("combines two polygons into a single bounding polygon4", () => {
      const result = combinePolygons4([
        [0, 0, 10, 0, 10, 10, 0, 10],
        [10, 0, 20, 0, 20, 10, 10, 10],
      ]);
      expect(result).toEqual([0, 0, 20, 0, 20, 10, 0, 10]);
    });
  });

  describe("combinePolygons", () => {
    it("handles a single line polygon array", () => {
      const poly: Polygon4 = [100, 100, 200, 100, 200, 150, 100, 150];
      const result = combinePolygons([poly]);

      expect(result.head).toEqual(poly);
      expect(result.body).toBeUndefined();
      expect(result.tail).toBeUndefined();
    });

    it("handles multiple lines (head, body, tail)", () => {
      const combinedLines: Polygon4[] = [
        [21, 0, 41, 0, 41, 20, 21, 20],
        [62, 0, 82, 0, 82, 20, 62, 20],
        [0, 25, 20, 25, 20, 45, 0, 45],
        [21, 25, 41, 25, 41, 45, 21, 45],
        [62, 25, 82, 25, 82, 45, 62, 45],
        [0, 50, 20, 50, 20, 70, 0, 70],
        [21, 50, 41, 50, 41, 70, 21, 70],
      ];
      const result = combinePolygons(combinedLines);

      expect(result.head).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.tail).toBeDefined();
    });
  });
});
