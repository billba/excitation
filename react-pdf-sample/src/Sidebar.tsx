import { useAtom } from 'jotai'
import { citationsAtom, questionIndexAtom, citationIndexAtom } from "./State";
import { questions } from "./Questions";
import { useCallback } from 'react';

export function Sidebar() {
  const [questionIndex, setQuestionIndex ] = useAtom(questionIndexAtom);
  const [citationIndex, setCitationIndex] = useAtom(citationIndexAtom);
  const [citations] = useAtom(citationsAtom);
  
  const disablePrev = questionIndex === 0;
  const disableNext = questionIndex === questions.length - 1;

  const prevQuestion = useCallback(() => {
    setQuestionIndex(questionIndex - 1);
    setCitationIndex(0);
  }, [questionIndex, setQuestionIndex, setCitationIndex]);

  const nextQuestion = useCallback(() => {
    setQuestionIndex(questionIndex + 1);
    setCitationIndex(0);
  }, [questionIndex, setQuestionIndex, setCitationIndex]);

  const setCurrentCitation = useCallback((i: number) => () => setCitationIndex(i), [setCitationIndex]);

  return (
    <div id="sidebar">
      <div className="sidebar-header">
        <button disabled={disablePrev} onClick={prevQuestion}>&lt;</button>
        <div className='q-number'>Question #{questionIndex+1}</div>
        <button disabled={disableNext} onClick={nextQuestion}>&gt;</button>
      </div>
      <div className='question'>{questions[questionIndex]}</div>
      <div className='citation-header'>Citations:</div>
      <div>
        {citations[questionIndex].map(({ excerpt }, i) => (
          <div
            className={'citation-row' + (i === citationIndex ? ' selected' : '')}
            key={i}
            onClick={setCurrentCitation(i)}
          >
            <div className='citation'>{excerpt}</div>
            <div className='buttons'>
              <button
                className='cite-button'
                style={{backgroundColor: "palegreen"}}
              >
                Y
              </button>
              <button
                className='cite-button'
                style={{backgroundColor: "pink"}}
              >
                N
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
