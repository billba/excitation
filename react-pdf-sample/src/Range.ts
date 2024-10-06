// Utility functions for working with those pesky DOM objects called Ranges.

// The built in range.toString() method is not a good fit for how pdf.js renders text,
// which is to say in lots of little absolutely positioned <span> elements that may
// or many not include whitespace. So you get a lot of randomly conjoined text, e.g.
// <span>the quick</span><span>brown></span><span> fox</span> => "the quickbrown fox"

// This function currently overcompensates by adding spaces between every span. The results
// are slightly better, in that they're more readable, but are typically still a . Because pdf.js is not consistant, there is no perfect solution, but
// 

export const rangeToString = (range: Range) => {
  const fragment = range.cloneContents();
  const { children } = fragment;

  if (children.length === 0) {
    // all the text lives in a single text node
    console.assert(fragment.childNodes.length === 1);
    const node = fragment.childNodes[0];
    console.assert(node.nodeType == Node.TEXT_NODE);
    return node.textContent!;
  }

  if (children[0].id != "")
    // the text crosses multiple "parent" spans (which have ids)
    return ([...children].map(parentSpan => [...parentSpan.children] 
      .map(childSpan => childSpan.textContent)
      .join(' ')
    ))
      .join(' ');
  
  // the text crosses multiple "child" spans (which do not have ids)
  return ([...children].map(childSpan => childSpan.textContent)).join(' ');
}

// The problem we attempt to solve below is recreating a highlight range after the page is re-rendered.
// The Range object identifies the endpoints of a text range using its text node and offset within that node.
// Unfortunately the text node is specific to the original DOM, so it can't be used after the page is re-rendered.
// However pdf.js renders pages in a predictable way, and so we can take advantage of this to "serialize" the
// text node using the following heuristic:
//
// Every text node is contained with a <span>. Unfortunately these spans do not have an id field, but they are
// absolutely positioned. So we use their position to identify them across re-renders. It is possible that
// two text spans might have the same position, but we assume that they would not have the same parent, which
// in pdf.js is a span with an id that are consistantly named consistantly across re-renders.
//
// So we uniquely identify each text span by its parent span's id and its position, and can store this "searialized"
// Range object across re-renders.
//
// When the page is re-rendered, pdf.js looks up the parent span of each endpoint by id, and searches for the
// correct child span by position. In this way we create a new Range object that highlights the same text.

interface SerializedStyle {
  top: string;
  left: string;
}

interface SerializedContainer {
  parentId: string;
  style: SerializedStyle;
}

export interface SerializedRange {
  startSerializedContainer: SerializedContainer;
  startOffset: number;
  endSerializedContainer: SerializedContainer;
  endOffset: number;
}

function calculateSerializedContainer(
  container: Node
): SerializedContainer | undefined {
  const { parentElement } = container;

  if (!parentElement) return undefined;

  const parentId = parentElement.parentElement?.id;

  if (!parentId) return undefined;

  const { top, left } = parentElement.style;

  return {
    parentId,
    style: {
      top,
      left,
    },
  };
}

export function calculateSerializedRange(
  range?: Range
): SerializedRange | undefined {
  if (!range) return undefined;

  const { startContainer, startOffset, endContainer, endOffset } = range;

  const startSerializedContainer = calculateSerializedContainer(startContainer);
  const endSerializedContainer = calculateSerializedContainer(endContainer);

  if (!startSerializedContainer || !endSerializedContainer) return undefined;

  return {
    startSerializedContainer,
    startOffset,
    endSerializedContainer,
    endOffset,
  };
}

function findChildNode(
  parent: Element,
  style: SerializedStyle
): Node | undefined {
  for (const child of parent.children) {
    if (
      child instanceof HTMLElement &&
      child.style.top == style.top &&
      child.style.left == style.left
    ) {
      const node = child.childNodes[0];
      console.assert(node.nodeType == Node.TEXT_NODE);
      return node;
    }
  }
  return undefined;
}

export function calculateRange(
  serializedRange?: SerializedRange
): Range | undefined {
  if (!serializedRange) return undefined;

  const {
    startSerializedContainer,
    startOffset,
    endSerializedContainer,
    endOffset,
  } = serializedRange;

  const startParent = document.getElementById(
    startSerializedContainer.parentId
  );
  const endParent = document.getElementById(endSerializedContainer.parentId);

  if (!startParent || !endParent) return undefined;

  const startContainer = findChildNode(
    startParent,
    startSerializedContainer.style
  );

  const endContainer = findChildNode(endParent, endSerializedContainer.style);

  if (!startContainer || !endContainer) return undefined;

  const range = new Range();
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);

  return range;
}

export const compareRanges = (range: Range, serializedRange: SerializedRange) => {
  return JSON.stringify(calculateSerializedRange(range)) === JSON.stringify(serializedRange);
}
