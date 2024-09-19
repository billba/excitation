import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [renderCounter, setRenderCounter] = useState(0);

  const onDocumentLoadSuccess = useCallback(() => {
  }, []);

  const onRenderSuccess = useCallback(() => {
    console.log('onRenderSuccess');
    const canvas = document.getElementsByClassName('react-pdf__Page__canvas')[0] as HTMLCanvasElement;
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
    setRenderCounter(c => c + 1);
  }, []);

  useEffect(() => {
    const highlightCanvas = canvasRef.current!;
    const context = highlightCanvas.getContext('2d')!;
    
    context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    context.fillStyle = 'rgba(255, 0, 0, 0.5)';
    context.fillRect(200 + questionIndex * 25, 200 + citationIndex * 25, 200, 50);
  }, [renderCounter, page, docIndex, questionIndex, citationIndex]);

  return (
    <div id="viewer">
      <p>{doc.filename} page {page}</p>
      <div>
        <canvas ref={canvasRef} id="highlight-canvas" />
        <Document file={doc.filename} onLoadSuccess={onDocumentLoadSuccess} >
          <Page pageNumber={page} onRenderSuccess={onRenderSuccess} >
          </Page>
        </Document>
      </div>
    </div>
  )
}