import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";

import { pdfjs } from 'react-pdf';
import { Sidebar } from './Sidebar';
import { Viewer } from './Viewer';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

import './App.css'
import { NavBar } from './NavBar';

const theme = matchMedia('(prefers-color-scheme: light)').matches ? webLightTheme : webDarkTheme;

function App() {
  return (
<FluentProvider theme={theme}>
    <div id="app">
      <Sidebar />
      <div id="viewer">
        <NavBar />
        <Viewer />
      </div>
    </div>
</FluentProvider>
  )
}

export default App
