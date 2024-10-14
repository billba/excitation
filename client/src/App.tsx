import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { pdfjs } from 'react-pdf';
import { Sidebar } from './Sidebar';
import { Viewer } from './Viewer';
import { useAsyncStateMachine } from './State';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

import './App.css'
import { NavBar } from './NavBar';

function App() {
  useAsyncStateMachine();
  
  return (
    <div id="app">
      <Sidebar />
      <div id="viewer">
        <NavBar />
        <Viewer />
      </div>
    </div>
  );
}

export default App
