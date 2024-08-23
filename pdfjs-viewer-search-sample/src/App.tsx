import { useRef, useState, useEffect } from 'react';
import './App.css'
import Sidebar from './Sidebar';

// const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

const retryInterval = 500;
const timeout = 5000;
const retries = timeout / retryInterval;

function App() {
  const [page, setPage] = useState(1);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!doc) {
      if (retry > retries) {
        console.log("timeout rendering PDF");
      } else {
        // by the time this effect first runs, by definition, the iframe document is instantiated.
        const doc = iframeRef.current!.contentDocument as Document;
        // However it may be empty, so we look for evidence that the PDF has been rendered
        // TODO: get a better signal
        if (doc.body.children.length) {
          setDoc(doc);
        } else {
          setTimeout(() => {
            setRetry(retry + 1);
          }, retryInterval);
        }
      }
    }
  }, [doc, retry]);

  return (
    <div id="app">
      <Sidebar page={page} setPage={setPage} doc={doc} />
      <div id="viewer">
        <iframe ref={iframeRef} src={`./pdfjs/web/viewer.html?file=.%2Fcompressed.tracemonkey-pldi-09.pdf#page=${page}&zoom=page-fit`} id="iframe"/>
      </div>
    </div>
  )
}

export default App
