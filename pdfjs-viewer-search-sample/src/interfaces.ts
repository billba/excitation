export interface docIntResponse {
    status: string;
    createdDateTime: string;
    lastUpdatedDateTime: string;
    analyzeResult: AnalyzeResult;
  }
  
  interface AnalyzeResult {
    apiVersion: string;
    modelId: string;
    stringIndexType: string;
    content: string;
    pages: Page[];
    tables: Table[];
    paragraphs: Paragraph[];
    styles: Style[];
    contentFormat: string;
    sections: Section[];
    figures: Figure[];
  }
  
  interface Figure {
    id: string;
    boundingRegions: BoundingRegion[];
    spans: Span[];
    elements: string[];
    caption: Caption;
  }
  
  interface Section {
    spans: Span[];
    elements: string[];
  }
  
  interface Style {
    confidence: number;
    spans: Span[];
    isHandwritten: boolean;
  }
  
  interface Paragraph {
    spans: Span[];
    boundingRegions: BoundingRegion[];
    role?: string;
    content: string;
  }
  
  interface Table {
    rowCount: number;
    columnCount: number;
    cells: Cell[];
    boundingRegions: BoundingRegion[];
    spans: Span[];
    caption: Caption;
  }
  
  interface Caption {
    content: string;
    boundingRegions: BoundingRegion[];
    spans: Span[];
    elements: string[];
  }
  
  interface Cell {
    rowIndex: number;
    columnIndex: number;
    content: string;
    boundingRegions: BoundingRegion[];
    spans: (Span | Span)[];
    elements?: string[];
    columnSpan?: number;
    kind?: string;
  }
  
  interface BoundingRegion {
    pageNumber: number;
    polygon: number[];
  }
  
  interface Page {
    pageNumber: number;
    angle: number;
    width: number;
    height: number;
    unit: string;
    words: Word[];
    lines: Line[];
    spans: Span[];
    selectionMarks?: SelectionMark[];
  }
  
  interface SelectionMark {
    state: string;
    polygon: number[];
    confidence: number;
    span: Span;
  }
  
  interface Line {
    content: striexng;
    polygon: number[];
    spans: Span[];
  }
  
  interface Word {
    content: string;
    polygon: number[];
    confidence: number;
    span: Span;
  }
  
  interface Span {
    offset: number;
    length: number;
  }