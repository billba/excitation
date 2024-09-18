import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { Document, Page } from 'react-pdf';

import { questionIndexAtom, citationIndexAtom, citationsAtom, docsAtom } from './State';

export function Viewer() {
  const [docs] = useAtom(docsAtom);
  const [questionIndex] = useAtom(questionIndexAtom);
  const [citationIndex] = useAtom(citationIndexAtom);
  const [citations] = useAtom(citationsAtom);

  const { docIndex, page } = citations[questionIndex][citationIndex];
  const doc = docs[docIndex];

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => numPages, []);

  const onRenderTextLayerSuccess = useCallback(() => {
  }, []);


  return (
    <div id="viewer">
      <Document file={doc.filename} onLoadSuccess={onDocumentLoadSuccess} >
        <Page pageNumber={page} onRenderTextLayerSuccess={onRenderTextLayerSuccess} >
        </Page>
      </Document>
    </div>
  )
}