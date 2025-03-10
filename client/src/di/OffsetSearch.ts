import { Range, Word } from "./Types";

/**
 * Compares an offset range against a reference offset.
 *
 * @param offsetRange - A tuple representing the start and end offsets.
 * @param refOffset - The reference offset to compare against.
 * @returns
 * - `-1` if `offsetRange` is earlier in the page than `refOffset`.
 * - `0` if `offsetRange` contains `refOffset`.
 * - `1` if `offsetRange` is later in the page than `refOffset`.
 */
function compareOffsets(offsetRange: Range, refOffset: number): number {
  if (offsetRange[1] < refOffset) return -1;
  if (offsetRange[0] > refOffset) return 1;
  return 0;
}

/**
 * Finds the first index in the word array that overlaps with the given offset range,
 * starting from a specified index and moving backward.
 *
 * @param words - The array of words to search through.
 * @param axis - The starting index to search from.
 * @param offsetRange - The range of offsets to match against.
 * @returns The index of the first word that intersects with the offset range.
 */
function getFirstOffsetIntersectionIndex(
  words: Word[],
  axis: number,
  offsetRange: Range
): number {
  do axis--;
  while (
    axis >= 0 &&
    compareOffsets(offsetRange, words[axis].span.offset) == 0
  );
  return ++axis;
}

/**
 * Finds the last index in the word array that overlaps with the given offset range,
 * starting from a specified index and moving forward.
 *
 * @param words - The array of words to search through.
 * @param axis - The starting index to search from.
 * @param offsetRange - The range of offsets to match against.
 * @returns The index of the last word that intersects with the offset range.
 */
function getLastOffsetIntersectionIndex(
  words: Word[],
  axis: number,
  offsetRange: Range
): number {
  do axis++;
  while (
    axis < words.length &&
    compareOffsets(offsetRange, words[axis].span.offset) == 0
  );
  return --axis;
}

/**
 * Performs a binary search on a subset of words to find the index range
 * of words contained within the specified offset range.
 *
 * @param words - The array of words to search.
 * @param range - A tuple `[start, end]` specifying the search boundaries (inclusive start, exclusive end).
 * @param offsetRange - The range of offsets to search for.
 * @returns A tuple `[firstIndex, lastIndex]` representing the index range of matching words, or `null` if no match is found.
 */
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
      return [
        getFirstOffsetIntersectionIndex(words, axis, offsetRange),
        getLastOffsetIntersectionIndex(words, axis, offsetRange),
      ];

    case 1:
      return offsetBinarySearch(words, [axis + 1, end], offsetRange);
  }
  return null;
}

/**
 * Searches for words within the given offset range using a binary search.
 *
 * @param words - The array of words to search.
 * @param offsetRange - The range of offsets to find within the words.
 * @returns A tuple `[firstIndex, lastIndex]` representing the index range of matching words, or `null` if no match is found.
 *
 * - This function acts as a wrapper around `offsetBinarySearch`, initiating the search
 *   across the entire word array.
 */
export function offsetSearch(words: Word[], offsetRange: Range): Range | null {
  return offsetBinarySearch(words, [0, words.length], offsetRange);
}

/**
 * Searches for the word in the array that contains the given offset.
 *
 * @param words - The array of words to search through.
 * @param offset - The text offset to find within the words.
 * @returns The index of the word that contains the offset, or -1 if not found.
 */
export function wordOffsetSearch(words: Word[], offset: number): number {
  for (let i = 0; i < words.length; i++) {

    const start = words[i].span.offset;
    const end = start + words[i].span.length;

    if (offset >= start && offset < end) {
      return i;
    }
  }
  return -1;
}
