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

  const prevQuestion = useCallback(() => setQuestionIndex(questionIndex - 1), [questionIndex, setQuestionIndex]);
  const nextQuestion = useCallback(() => setQuestionIndex(questionIndex + 1), [questionIndex, setQuestionIndex]);

  const setCurrentCitation = useCallback((i: number) => () => setCitationIndex(i), [setCitationIndex]);

  return (
    <div id="sidebar">
      <button disabled={disablePrev} onClick={prevQuestion}>&lt;</button>
      &nbsp;
      Question #{questionIndex}
      &nbsp;
      <button disabled={disableNext} onClick={nextQuestion}>&gt;</button>
      <br />
      {questions[questionIndex]}
      <hr />
      <ul>
        {citations[questionIndex].map(({ excerpt }, i) => (
          <li key={i} onClick={setCurrentCitation(i)}>{i === citationIndex ? '*' : ''}{excerpt}</li>
        ))}
      </ul>
    </div>
  )
}
