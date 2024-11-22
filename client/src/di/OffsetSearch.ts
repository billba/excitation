import { Range, Word } from "./Types"

// compares offsetRange against refOffset. returns:
// - if offsetRange is earlier in the page than refOffset
// 0 if offsetRange contains refOffset
// + if offsetRange is later in the page than refOffset
function compareOffsets(
  offsetRange: Range,
  refOffset: number
): number {
  if (offsetRange[1] < refOffset) return -1;
  if (offsetRange[0] > refOffset) return 1;
  return 0;
}

// starting from words[axis] and working backward, find the first entry
// in words that overlaps with offsetRange
function getFirstOffsetIntersectionIndex(
  words: Word[],
  axis: number,
  offsetRange: Range
): number {
  do axis--; while (axis >= 0 && compareOffsets(offsetRange, words[axis].span.offset) == 0);
  return ++axis;
}

// starting from words[axis] and working forward, find the last entry
// in words that overlaps with offsetRange
function getLastOffsetIntersectionIndex(
  words: Word[],
  axis: number,
  offsetRange: Range
): number {
  do axis++; while (axis < words.length && compareOffsets(offsetRange, words[axis].span.offset) == 0);
  return --axis;
}

// searches words[start, end) (that is, inclusive of start and exclusive of end)
// for the words contained within the offset range and returns their index range
function offsetBinarySearch(
  words: Word[],
  [start, end]: Range,
  offsetRange: Range
): Range | null {
  if (end == 0) {
    console.log("offset search | no words to search");
    return null;
  }

  if (start == end) {
    console.log("offset search | no further words to search");
    return null;
  }

  const axis = Math.floor((end - start) / 2) + start;

  switch (compareOffsets(offsetRange, words[axis].span.offset)) {
    case -1:
      return offsetBinarySearch(words, [start, axis], offsetRange);

    case 0:
      return [getFirstOffsetIntersectionIndex(words, axis, offsetRange),
              getLastOffsetIntersectionIndex(words, axis, offsetRange)];

    case 1:
      return offsetBinarySearch(words, [axis + 1, end], offsetRange);
  }
  return null;
}

// kicks it off while hiding the bsearch aspects from the caller
export function offsetSearch(
  words: Word[],
  offsetRange: Range
): Range | null {
  return offsetBinarySearch(words, [0, words.length], offsetRange);
}
