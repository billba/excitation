import { useRef, useState } from 'react';
import './App.css'
import { QuestionAnswer } from './questions';

function App() {
  const [questionPage, setQuestionPage] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
          fileName: "./compressed.tracemonkey-pldi-09.pdf"
        }
      ]
    },
    {
      question: "Trace trees question",
      answer: "Answer is wrong",
      references: [
        {
          text: "In this section, we describe traces, trace trees, and how they are formed at run time. Although our techniques apply to any dynamic language interpreter, we will describe them assuming a bytecode interpreter to keep the exposition simple.",
          fileName: "./compressed.tracemonkey-pldi-09.pdf"
        }
      ]
    }
  ]

  const unShown: boolean[][] = [];
  for (let i = 0; i < qA.length; i++) {
    unShown.push([]);
    for (let j = 0; j < qA[i].references.length; j++) {
      unShown[i].push(false);
    }
  }
  
  const [shown, setShown] = useState(unShown);

  const previousQuestion = (page: number) => {
    if (page === 1) { return; }
    else { setQuestionPage(page - 1); }
  }

  const nextQuestion = (page: number) => {
    if (page === qA.length) { return; }
    else { setQuestionPage(page + 1); }
  }

  const url = `./pdfjs/web/viewer.html?file=.%2Fcompressed.tracemonkey-pldi-09.pdf#&zoom=page-fit`;
  return (
    <div id="app">
      <div id="sidebar">
        <button onClick={() => previousQuestion(questionPage)}>Previous</button>
        &nbsp;
        Page {questionPage}
        &nbsp;
        <button onClick={() => nextQuestion(questionPage)}>Next</button>
        <div>
          <QuestionAnswer qA={qA[questionPage - 1]} questionIndex={questionPage - 1} iframeRef={iframeRef} shown={shown} setShown={setShown} />
        </div>
      </div>
      <div id="viewer">
        <iframe ref={iframeRef} src={url} id="iframe" />
      </div >
    </div >
  )
}
export default App