import { useEffect, useRef, useState } from 'react';
import './App.css'
import { QuestionAnswer } from './questions';
import Canvas from './canvas';
import { createPortal } from 'react-dom';

// const searchString = "Each\ntree is associated with a loop header and type map, so there may be\nseveral trees for a given loop header.\nClosing the loop. Trace";

function App() {
  const [questionPage, setQuestionPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [style, setStyle] = useState({ height: 0, width: 0, scale: 1 });

  // const iframeRef = useRef<HTMLIFrameElement>(null); // <<<-----
  const [iframeRef, setRef] = useState(null);

  const draw = (context: CanvasRenderingContext2D, scale: number = style.scale, polygons: number[]) => {
    const multiplier = 72 * (window.devicePixelRatio || 1) * scale;
    context.fillStyle = 'rgba(252, 207, 8, 0.3)';
    context.strokeStyle = '#fccf08';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(polygons[0] * multiplier, polygons[1] * multiplier);
    for (let i = 2; i < polygons.length; i += 2) {
      context.lineTo(polygons[i] * multiplier, polygons[i + 1] * multiplier);
    }
    context.closePath();
    context.fill();
    context.stroke();
  };

  const qA = [
    {
      question: "Dynamic languages question",
      answer: "Answer looks right",
      references: [
        {
          text: "Dynamic languages such as JavaScript, Python, and Ruby, are pop- ular since they are expressive, accessible to non-experts, and make deployment as easy as distributing a source file. They are used for small scripts as well as for complex applications. JavaScript, for example, is the de facto standard for client-side web programming",
          fileName: "compressed.tracemonkey-pldi-09.pdf"
        },
        {
          text: "We solve the nested loop problem by recording nested trace trees. Our system traces the inner loop exactly as the naïve version. The system stops extending the inner tree when it reaches an outer loop, but then it starts a new trace at the outer loop header. When the outer loop reaches the inner loop header, the system tries to call the trace tree for the inner loop. If the call succeeds, the VM records the call to the inner tree as part of the outer trace and finishes the outer trace as normal. In this way, our system can trace any number of loops nested to any depth without causing excessive tail duplication.",
          fileName: "compressed.tracemonkey-pldi-09.pdf"
        }
      ]
    },
    {
      question: "Trace trees question",
      answer: "Answer is wrong",
      references: [
        {
          text: "In this section, we describe traces, trace trees, and how they are formed at run time. Although our techniques apply to any dynamic language interpreter, we will describe them assuming a bytecode interpreter to keep the exposition simple.",
          fileName: "compressed.tracemonkey-pldi-09.pdf"
        }
      ]
    }
  ]

  const previousQuestion = (page: number) => {
    if (page === 1) { return; }
    else { setQuestionPage(page - 1); }
  }

  const nextQuestion = (page: number) => {
    if (page === qA.length) { return; }
    else { setQuestionPage(page + 1); }
  }

  // useEffect(() => {
  //   const elements = iframeRef.current?.contentWindow?.document.querySelectorAll("div.canvasWrapper > canvas") as NodeList;

  //   let element;
  //   if (elements.length === 1) element = elements[0] as HTMLCanvasElement;
  //   else element = elements[filePage - 1] as HTMLCanvasElement;

  //   if (element) {
  //     const height = getComputedStyle(element).height;
  //     console.log(height);
  //     const width = getComputedStyle(element).width;
  //     console.log(width);
  //   }
  // }, [filePage])
  const url = `./pdfjs/web/viewer.html?file=.%2Fcompressed.tracemonkey-pldi-09.pdf#page=${filePage}&zoom=page-fit`;
  return (
    <div id="app">
      <div id="sidebar">
        <button onClick={() => previousQuestion(questionPage)}>Previous</button>
        &nbsp;
        Page {questionPage}
        &nbsp;
        <button onClick={() => nextQuestion(questionPage)}>Next</button>
        <QuestionAnswer qA={qA[questionPage - 1]} setFilePage={setFilePage} filePage={filePage} iframeRef={iframeRef} setRef={setRef} />
      </div>
      <div id="viewer">
        <iframe ref={iframeRef => setRef(iframeRef)} src={url} id="iframe" />
        <Canvas id="highlight-canvas" style={style} draw={draw} />
      </div >
    </div >
  )
}
export default App