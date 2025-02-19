import { Point, Polygon4, PolygonC, Range } from "./Types";

// ===============
// === GETTERS ===
// ===============

/**
 * Retrieves the minimum and maximum x-coordinates of a `Polygon4`.
 *
 * @param poly - The four-sided polygon.
 * @returns A tuple `[minX, maxX]` representing the horizontal bounds.
 */
function getX(poly: Polygon4): Range {
  return [Math.min(poly[0], poly[6]), Math.max(poly[2], poly[4])];
}

/**
 * Retrieves the minimum and maximum y-coordinates of a `Polygon4`.
 *
 * @param poly - The four-sided polygon.
 * @returns A tuple `[minY, maxY]` representing the vertical bounds.
 */
function getY(poly: Polygon4): Range {
  return [Math.min(poly[1], poly[3]), Math.max(poly[5], poly[7])];
}

// =================
// === ADJACENCY ===
// =================

/**
 * Checks if two polygons overlap along the y-axis by at least a given percentage.
 *
 * @param poly0 - The first polygon.
 * @param poly1 - The second polygon.
 * @param threshold - The minimum required overlap ratio (default: 0.5, or 50% of the smaller polygon's height).
 * @returns `true` if the polygons overlap along the y-axis by at least the given threshold, otherwise `false`.
 */
function onSameLine(
  poly0: Polygon4,
  poly1: Polygon4,
  threshold: number = 0.5 // Minimum 50% overlap required
): boolean {
  const [minY0, maxY0] = getY(poly0);
  const [minY1, maxY1] = getY(poly1);

  // No overlap if one polygon is entirely above or below the other.
  if (minY0 > maxY1 || minY1 > maxY0) {
    return false;
  }

  // Compute the vertical overlap.
  const overlap = Math.min(maxY0, maxY1) - Math.max(minY0, minY1);
  const height0 = maxY0 - minY0;
  const height1 = maxY1 - minY1;

  // Return true if the overlap is at least `threshold` of the smaller polygon's height.
  return overlap / Math.min(height0, height1) >= threshold;
}

/**
 * Determines if two polygons are adjacent or overlapping.
 *
 * @param poly0 - The first polygon.
 * @param poly1 - The second polygon.
 * @param delta - The tolerance for adjacency (default: `0`).
 * @returns `true` if the polygons are adjacent or overlapping, otherwise `false`.
 */
export function adjacent(poly0: Polygon4, poly1: Polygon4, delta = 0): boolean {
  const [x0, y0] = [getX(poly0), getY(poly0)];
  const [x1, y1] = [getX(poly1), getY(poly1)];

  // The rectangles don't overlap if one rectangle's minimum in some
  // dimension is greater than the other's maximum in that dimension
  const noOverlap =
    x0[0] > x1[1] + delta ||
    x1[0] > x0[1] + delta ||
    y0[0] > y1[1] + delta ||
    y1[0] > y0[1] + delta;
  return !noOverlap;
}

// ==================
// === COMPARISON ===
// ==================

/**
 * Compares the width of a polygon against a reference polygon.
 *
 * @param poly - The polygon to compare.
 * @param refPoly - The reference polygon.
 * @param delta - The allowed deviation before considering the widths different (default: `0.2`).
 * @returns
 * - `-1` if `poly` is narrower than `refPoly`.
 * - `0` if their widths are roughly equal.
 * - `1` if `poly` is wider than `refPoly`.
 */
function comparePolyWidth(
  poly: Polygon4,
  refPoly: Polygon4,
  delta = 0.2
): number {
  const x = getX(poly);
  const refX = getX(refPoly);

  const width = x[1] - x[0];
  const refWidth = refX[1] - refX[0];

  if (width < refWidth - delta) return -1;
  if (width > refWidth + delta) return 1;
  return 0;
}

/**
 * Compares a point to a reference polygon to determine document flow position.
 *
 * @param point - The point to compare.
 * @param refPoly - The reference polygon.
 * @returns
 * - `-1` if `point` is earlier than `refPoly`.
 * - `0` if `point` is within `refPoly`.
 * - `1` if `point` is later than `refPoly`.
 */
export function comparePointToPolygon(point: Point, refPoly: Polygon4): number {
  const [refX, refY] = [getX(refPoly), getY(refPoly)];

  if (point.y < refY[0]) return -1;
  if (point.y > refY[1]) return 1;

  if (point.x < refX[0]) return -1;
  if (point.x > refX[1]) return 1;

  return 0;
}

/**
 * Compares two points to determine their document flow position.
 *
 * @param point - The point to compare.
 * @param refPoint - The reference point.
 * @returns
 * - `-1` if `point` is earlier than `refPoint`.
 * - `0` if `point` is at `refPoint`.
 * - `1` if `point` is later than `refPoint`.
 */
export function comparePoints(point: Point, refPoint: Point): number {
  if (point.y < refPoint.y) return -1;
  if (point.y > refPoint.y) return 1;

  if (point.x < refPoint.x) return -1;
  if (point.x > refPoint.x) return 1;

  return 0;
}

// ===================
// === COMBINATION ===
// ===================

/**
 * Combines an array of `Polygon4` into a single `Polygon4`.
 *
 * @param polygons - The array of polygons to merge (must be non-empty).
 * @returns A single combined `Polygon4` encompassing all input polygons.
 */
export function combinePolygons4(polygons: Polygon4[]): Polygon4 {
  if (polygons.length == 1) return polygons[0];

  const x = [] as number[];
  const y = [] as number[];
  for (const poly of polygons) {
    x.push(...getX(poly));
    y.push(...getY(poly));
  }

  const [x0, x1] = [Math.min(...x), Math.max(...x)];
  const [y0, y1] = [Math.min(...y), Math.max(...y)];

  return [x0, y0, x1, y0, x1, y1, x0, y1];
}

/**
 * Combines an array of `Polygon4` into a `PolygonC` structure, accounting for complex shapes.
 *
 * @param polygons - The array of polygons to merge.
 * @returns A `PolygonC` object representing the combined shape.
 *
 * - Supports various multi-line and complex polygon structures.
 * - The function determines whether the polygons form a head-body-tail structure.
 */
// There are six possible shapes that can result from this:
// ========
//  #####   single polygon4, shape (A) "h" or "b"
// ========
//      ###
// ####     two polygon4s,   shape (B) "ht"
// ========
//    #####
// #####    two polygon4s,   shape (C) "ht"
// ========
//    #####
// ######## two polygon4s,   shape (D) "hb" or perhaps "ht"
// ========
// ########
// #####    two polygon4s,   shape (E) "bt" or perhaps "ht"
// ========
//    #####
// ######## three polygon4s, shape (F) "hbt"
// #####
// ========
export function combinePolygons(polygons: Polygon4[]): PolygonC {
  const zero = [0, 0, 0, 0, 0, 0, 0, 0] as Polygon4;
  let head = zero;
  let body = zero;
  let tail = zero;
  let headIndex = 0;
  let tailIndex = polygons.length - 1;

  // First, the `head` line
  for (; headIndex < polygons.length; headIndex++) {
    if (
      headIndex == polygons.length - 1 ||
      !onSameLine(polygons[headIndex], polygons[headIndex + 1])
    ) {
      head = combinePolygons4(polygons.slice(0, headIndex + 1));
      break;
    }
  }

  // Then the `tail`
  for (; tailIndex > headIndex; tailIndex--) {
    if (
      tailIndex == headIndex + 1 ||
      !onSameLine(polygons[tailIndex], polygons[tailIndex - 1])
    ) {
      tail = combinePolygons4(polygons.slice(tailIndex, polygons.length));
      break;
    }
  }

  // Any remaining lines become the `body`
  if (tailIndex - headIndex > 1)
    body = combinePolygons4(polygons.slice(headIndex + 1, tailIndex));

  // now we create the poly
  if (body == zero) {
    if (tail == zero) return { head: head }; // (A)

    // if the head and the tail are the same width, just return a single poly
    if (comparePolyWidth(head, tail) == 0)
      return { body: combinePolygons4([head, tail]) }; // (A)

    return { head: head, tail: tail }; // (B) or (C)
  }

  // we need to do a few checks...
  // is the head actually just a body line?
  if (comparePolyWidth(head, body) >= 0) {
    body = combinePolygons4([head, body]);
    head = zero;
    if (tail == zero) return { body: body }; // (A)
  }

  // is the tail actually just a body line?
  if (comparePolyWidth(tail, body) >= 0) {
    body = combinePolygons4([body, tail]);
    tail = zero;
    if (head == zero) return { body: body }; // (A)
    return { head: head, body: body }; // (D)
  }

  if (head == zero) return { body: body, tail: tail }; // (E)
  return { head: head, body: body, tail: tail }; // (F)
}

// ==================
// === CONVERSION ===
// ==================

/**
 * Converts an array of 8 numbers into a `Polygon4` type.
 *
 * @param {number[]} polygon - An array of exactly 8 numbers representing the coordinates of a quadrilateral.
 * @returns {Polygon4} A `Polygon4` array containing the same 8 numbers.
 * @throws {Error} If the input array does not have exactly 8 elements.
 */
export function toPolygon4(polygon: number[]): Polygon4 {
  if (polygon.length !== 8) throw new Error("Invalid polygon length");
  return polygon.slice(0, 8) as Polygon4;
}

/**
 * Flattens a `Polygon4` into an array of numbers.
 *
 * If a polygon is provided, it spreads its values into a new array.
 * If no polygon is given (or it's `undefined`), it returns an empty array.
 *
 * @param {Polygon4} [polygon] - The polygon to flatten.
 * @returns {number[]} A flat array of numbers representing the polygon.
 */
export function flattenPolygon4(polygon?: Polygon4): number[] {
  return polygon ? [...polygon] : [];
}
