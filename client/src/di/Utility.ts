import { Point, Polygon4, PolygonC, PolygonN, Range } from "./Types";

// ===============
// === GETTERS ===
// ===============

// returns the minimum and maximum x-values of a polygon4
function getX(
  poly: Polygon4
): Range {
  return [Math.min(poly[0], poly[6]), Math.max(poly[2], poly[4])];
}

// returns the minimum and maximum y-values of a polygon4
function getY(
  poly: Polygon4
): Range {
  return [Math.min(poly[1], poly[3]), Math.max(poly[5], poly[7])];
}

// =================
// === ADJACENCY ===
// =================

// Returns true if polygons share y-axis space
function onSameLine(
  poly0: Polygon4,
  poly1: Polygon4
): boolean {
  const y0 = getY(poly0);
  const y1 = getY(poly1);

  const noOverlap =
    y0[0] > y1[1] ||
    y1[0] > y0[1];
  return !noOverlap;
}

// Return true if polygons overlap (including sharing borders); false otherwise
// delta controls the amount of space that can be between polygons without them
// being considered non-adjacent (i.e. accounts for spaces between words/lines)
export function adjacent(
  poly0: Polygon4,
  poly1: Polygon4,
  delta = 0
): boolean {
  const [ x0, y0 ] = [ getX(poly0), getY(poly0) ];
  const [ x1, y1 ] = [ getX(poly1), getY(poly1) ];

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

// compares poly to refPol; returns
// - if poly is narrower than refPoly
// 0 if they are roughly equal (controlled by delta)
// + if poly is wider than refPoly
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

// compares poly to refPoly
// if both polys are in the same region, then the comparison
// is not just true visually but true for document flow
// returns:
// - if poly is situated earlier in the page than refPoly
// 0 if poly is sitatued within/about refPoly
// + if poly is situated later in the page than refPoly
function comparePolygons(
  poly: Polygon4,
  refPoly: Polygon4
): number {
  const [ x, y ] = [ getX(poly), getY(poly) ];
  const [ refX, refY ] = [ getX(refPoly), getY(refPoly) ];

  if (y[1] < refY[0]) return -1;
  if (y[0] > refY[1]) return 1;

  if (x[1] < refX[0]) return -1;
  if (x[0] > refX[1]) return 1;

  return 0;
}

// compares point to refPoly
// if both are in the same region, then the comparison
// is not just true visually but true for document flow
// returns:
// - if point is situated earlier in the page than refPoly
// 0 if point is sitatued within refPoly
// + if point is situated later in the page than refPoly
export function comparePointToPolygon(
  point: Point,
  refPoly: Polygon4
): number {
  const [ refX, refY ] = [ getX(refPoly), getY(refPoly) ];

  if (point.y < refY[0]) return -1;
  if (point.y > refY[1]) return 1;

  if (point.x < refX[0]) return -1;
  if (point.x > refX[1]) return 1;

  return 0;
}

// compares point to refPoint
// if both are in the same region, then the comparison
// is not just true visually but true for document flow
// returns:
// - if point is situated earlier in the page than refPoint
// 0 if point is sitatued at refPoint
// + if point is situated later in the page than refPoint
export function comparePoints(
  point: Point,
  refPoint: Point
): number {
  if (point.y < refPoint.y) return -1;
  if (point.y > refPoint.y) return 1;

  if (point.x < refPoint.x) return -1;
  if (point.x > refPoint.x) return 1;

  return 0;
}

// ==================
// === POLYGONIZE ===
// ==================

// there's six possible shapes that can result from this
// ========
//  #####   single polygon4,   shape (A)
// ========
//      ###
// ####     two polygon4s,     shape (B)
// ========
//    #####
// #####    one polygonN, N=8, shape (C)
// ========
//    #####
// ######## one polygonN, N=6, shape (D)
// ========
// ########
// #####    one polygonN, N=6, shape (E)
// ========
//    #####
// ######## one polygonN, N=8, shape (F)
// #####
// ========
export function polygonize(
  poly: PolygonC
): PolygonN[] {
  let hx: Range;
  let hy: Range;
  let bx: Range;
  let by: Range;
  let tx: Range;
  let ty: Range;

  switch (poly.type) {
    case "h":
      return [poly.head];
    case "b":
      return [poly.body];
    case "t":
      return [poly.tail];

    case "ht":
      if (!adjacent(poly.head, poly.tail, 0.2))
        return [poly.head, poly.tail]; // (B)

      [ hx, hy ] = [ getX(poly.head), getY(poly.head) ];
      [ tx, ty ] = [ getX(poly.tail), getY(poly.tail) ];
      return [[hx[0], hy[0], hx[1], hy[0],
               hx[1], hy[1], tx[1], hy[1],
               tx[1], ty[1], tx[0], ty[1],
               tx[0], ty[0], hx[0], ty[0]]]; // (C)

    case "hb":
      [ hx, hy ] = [ getX(poly.head), getY(poly.head) ];
      [ bx, by ] = [ getX(poly.body), getY(poly.body) ];
      return [[hx[0], hy[0], bx[1], hy[0],
               bx[1], by[1], bx[0], by[1],
               bx[0], by[0], hx[0], by[0]]]; // (D)

    case "bt":
      [ bx, by ] = [ getX(poly.body), getY(poly.body) ];
      [ tx, ty ] = [ getX(poly.tail), getY(poly.tail) ];
      return [[bx[0], by[0], bx[1], by[0],
               bx[1], by[1], tx[1], by[1],
               tx[1], ty[1], bx[0], ty[1]]]; // (E)

    case "hbt":
      [ hx, hy ] = [ getX(poly.head), getY(poly.head) ];
      [ bx, by ] = [ getX(poly.body), getY(poly.body) ];
      [ tx, ty ] = [ getX(poly.tail), getY(poly.tail) ];
      return [[hx[0], hy[0], bx[1], hy[0],
               bx[1], by[1], tx[1], by[1],
               tx[1], ty[1], bx[0], ty[1],
               bx[0], by[0], hx[0], by[0]]]; // (F)
  }
}

// ===================
// === COMBINATION ===
// ===================

// Combine an array of polygon4 into one polygon4
// the array must be nonempty
export function combinePolygons4(
  polygons: Polygon4[]
): Polygon4 {
  if (polygons.length == 1) return polygons[0];

  let x = [] as number[];
  let y = [] as number[];
  for (const poly of polygons) {
    x.push(...getX(poly));
    y.push(...getY(poly));
  }
  
  let [x0, x1] = [Math.min(...x), Math.max(...x)];
  let [y0, y1] = [Math.min(...y), Math.max(...y)];

  return [x0, y0, x1, y0, x1, y1, x0, y1];
}

// Combine an array of polygon4 into one polygon
export function combinePolygons(
  polygons: Polygon4[]
): PolygonN[] {
  let zero = [0,0,0,0,0,0,0,0] as Polygon4;
  let head = zero;
  let body = zero;
  let tail = zero;
  let headIndex = 0;
  let tailIndex = polygons.length - 1;

  // First, the `head` line
  for (; headIndex < polygons.length; headIndex++) {
    if (headIndex == polygons.length - 1 ||
        !onSameLine(polygons[headIndex], polygons[headIndex + 1])) {
      head = combinePolygons4(polygons.slice(0, headIndex + 1));
      break;
    }
  }
  // Then the `tail`
  for (; tailIndex > headIndex; tailIndex--) {
    if (tailIndex == headIndex + 1 ||
        !onSameLine(polygons[tailIndex], polygons[tailIndex - 1])) {
      tail = combinePolygons4(polygons.slice(tailIndex, polygons.length));
      break;
    }
  }
  // Any remaining lines become the `body`
  if (tailIndex - headIndex > 1)
    body = combinePolygons4(polygons.slice(headIndex + 1, tailIndex));

  // now we create the poly
  if (body == zero) {
    if (tail == zero) return polygonize ({ type: "h", head: head });

    // if the head and the tail are the same width, just return a single poly
    if (comparePolyWidth(head, tail) == 0) return polygonize({ type: "b", body: combinePolygons4([head, tail]) });

    return polygonize({ type: "ht", head: head, tail: tail });
  }
  // we need to do a few checks...
  // is the head actually just a body line?
  if (comparePolyWidth(head, body) >= 0) {
    body = combinePolygons4([head, body]);
    head = zero;
    if (tail == zero) return polygonize({ type: "b", body: body });
  }

  // is the tail actually just a body line?
  if (comparePolyWidth(tail, body) >= 0) {
    body = combinePolygons4([body, tail]);
    tail = zero;
    if (head == zero) return polygonize({ type: "b", body: body });
    return polygonize({ type: "hb", head: head, body: body });
  }

  if (head == zero) return polygonize({type: "bt", body: body, tail: tail });
  return polygonize({ type: "hbt", head: head, body: body, tail: tail });
}
