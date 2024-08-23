import { useRef, useState, useEffect } from 'react';
import './App.css'
import Sidebar from './Sidebar';

// const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

function App() {
  const [page, setPage] = useState(1);

  // const [retry, setRetry] = useState(0);
  const [doc, setDoc] = useState<Document | undefined>(undefined);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      setDoc(iframeRef.current?.contentDocument as Document);
    }
  }, [iframeRef]);

  return (
    <div id="app">
      <Sidebar page={page} setPage={setPage} />
      <div id="viewer">
        <iframe ref={iframeRef} src={`./pdfjs/web/viewer.html?file=.%2Fcompressed.tracemonkey-pldi-09.pdf#page=${page}&zoom=page-fit`} id="iframe"/>
      </div>
    </div>
  )
}

export default App
