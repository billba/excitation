import { useAtom } from 'jotai';
import { useCallback, useRef } from 'react';

import { Document, Page } from 'react-pdf';

import { questionIndexAtom, citationIndexAtom, citationsAtom, docsAtom } from './State';

export function Viewer() {
  const [docs] = useAtom(docsAtom);
  const [questionIndex] = useAtom(questionIndexAtom);
  const [citationIndex] = useAtom(citationIndexAtom);
  const [citations] = useAtom(citationsAtom);

  const { docIndex, page } = citations[questionIndex][citationIndex];
  const doc = docs[docIndex];
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onDocumentLoadSuccess = useCallback(() => {
    setTimeout(() => {
      const canvas = document.getElementsByClassName('react-pdf__Page__canvas')[0] as HTMLCanvasElement;
      console.log(canvas);
      const styles = window.getComputedStyle(canvas);
      const highlightCanvas = canvasRef.current!;
      highlightCanvas.style.position = 'absolute';
      highlightCanvas.style.top = styles.top;
      highlightCanvas.style.left = styles.left;
      highlightCanvas.style.width = styles.width;
      highlightCanvas.style.height = styles.height;
      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;
      highlightCanvas.style.zIndex = '1000';

      const context = canvas.getContext('2d')!;
      
      context.fillStyle = 'rgba(255, 0, 0, 0.5)';
      context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      context.lineWidth = 1;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }, 100)
  }, []);

  const onRenderTextLayerSuccess = useCallback(() => {
  }, []);


  return (
    <div id="viewer">
      <Document file={doc.filename} onLoadSuccess={onDocumentLoadSuccess} >
        <Page pageNumber={page} onRenderTextLayerSuccess={onRenderTextLayerSuccess} >
        </Page>
      </Document>
      <canvas ref={canvasRef} id="highlight-canvas"/>
    </div>
  )
}