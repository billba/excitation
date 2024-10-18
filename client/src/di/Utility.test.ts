import { expect, test } from 'vitest'
import { Polygon, Polygon4, PolygonC } from "./Types"
import { polygonize } from "./Utility"

const polygonizeTest = (
  poly: PolygonC,
  expected: Polygon[]
) => test(`polygonizeTest`, () => {
  let actual = polygonize(poly);
  expect(actual).toEqual(expected);
})

const head = [3,1, 7,1, 7,2, 3,2] as Polygon4;
const body = [0,2, 7,2, 7,3, 0,3] as Polygon4;
const tail = [0,3, 4,3, 4,4, 0,4] as Polygon4;

const headWide = [0,1, 7,1, 7,2, 0,2] as Polygon4;
const tailWide = [0,3, 7,3, 7,4, 0,4] as Polygon4;

// (A)
const poly0a = {
  head: head
};
const poly0b = {
  head: headWide,
  body: body
}
const poly0c = {
  head: headWide,
  body: body,
  tail: tailWide
}
polygonizeTest(poly0a, [head]);
polygonizeTest(poly0b, [[0,1, 7,1, 7,3, 0,3]]);
polygonizeTest(poly0c, [[0,1, 7,1, 7,4, 0,4]]);

// (B)
const headNarrow = [5,1, 7,1, 7,2, 5,2] as Polygon4;
const tailNarrow = [0,2, 3,2, 3,3, 0,3] as Polygon4;
const poly1 = {
  head: headNarrow,
  tail: tailNarrow
};
polygonizeTest(poly1, [headNarrow, tailNarrow])

// (C)
const tailClose = [0,2, 5,2, 5,3, 0,3] as Polygon4;
const poly2 = {
  head: head,
  tail: tailClose
};
polygonizeTest(poly2, [[3,1, 7,1, 7,2, 5,2, 5,3, 0,3, 0,2, 3,2]]);

// (D)
const poly3a = {
  head: head,
  body: body
};
const poly3b = {
  head: head,
  body: body,
  tail: tailWide
};
polygonizeTest(poly3a, [[3,1, 7,1, 7,3, 0,3, 0,2, 3,2]]);
polygonizeTest(poly3b, [[3,1, 7,1, 7,4, 0,4, 0,2, 3,2]]);

// (E)
const poly4 = {
  head: headWide,
  body: body,
  tail: tail
};
polygonizeTest(poly4, [[0,1, 7,1, 7,3, 4,3, 4,4, 0,4]]);

// (F)
const poly5 = {
  head: head,
  body: body,
  tail: tail
}
polygonizeTest(poly5, [[3,1, 7,1, 7,3, 4,3, 4,4, 0,4, 0,2, 3,2]]);