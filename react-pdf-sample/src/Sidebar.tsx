import { useAtom } from 'jotai'
import { citationsAtom, questionIndexAtom, citationIndexAtom, newCitationAtom } from "./State";
import { questions } from "./Questions";
import { useCallback } from 'react';
import { ReviewStatus } from './Types';

export function Sidebar() {
  const [questionIndex, setQuestionIndex ] = useAtom(questionIndexAtom);
  const [citationIndex, setCitationIndex] = useAtom(citationIndexAtom);
  const [citations, setCitations] = useAtom(citationsAtom);
  const [newCitation, setNewCitation] = useAtom(newCitationAtom);
  
  const disablePrev = questionIndex === 0;
  const disableNext = questionIndex === questions.length - 1;

  const questionCitations = citations[questionIndex];
  
  const prevQuestion = useCallback(() => {
    setQuestionIndex(questionIndex - 1);
    setCitationIndex(0);
  }, [questionIndex, setQuestionIndex, setCitationIndex]);

  const nextQuestion = useCallback(() => {
    setQuestionIndex(questionIndex + 1);
    setCitationIndex(0);
  }, [questionIndex, setQuestionIndex, setCitationIndex]);

  const toggle = useCallback((target: ReviewStatus.Approved | ReviewStatus.Rejected, i: number) => () => {
    if (i !== citationIndex) {
      setCitationIndex(i);
    }
    const citation = questionCitations[i];
    setCitations([
      ...citations.slice(0, questionIndex),
      [
        ...questionCitations.slice(0, i),
        { ...
          citation,
          reviewStatus: citation.reviewStatus === target ? ReviewStatus.Unreviewed : target,
        },
        ...questionCitations.slice(i + 1),
      ],
      ...citations.slice(questionIndex + 1),
    ]);
  }, [citations, questionIndex, questionCitations, citationIndex, setCitations, setCitationIndex]);

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
        {citations[questionIndex].map(({ excerpt, reviewStatus }, i) => (
          <div
            className={'citation-row' + (i === citationIndex ? ' selected' : '')}
            key={i}
            onClick={setCurrentCitation(i)}
          >
            <div className='citation'>{excerpt}</div>
              <div className='buttons'>  
                {reviewStatus === ReviewStatus.Approved || i === citationIndex && reviewStatus === ReviewStatus.Unreviewed ?
                  <button
                  className='cite-button'
                  style={{ backgroundColor: reviewStatus === ReviewStatus.Approved ? "palegreen" : 'grey' }}
                  onClick={toggle(ReviewStatus.Approved, i)}
                  >✓</button>
                : null }
                {reviewStatus === ReviewStatus.Rejected || i === citationIndex && reviewStatus === ReviewStatus.Unreviewed ?
                  <button
                  className='cite-button'
                  style={{ backgroundColor: reviewStatus === ReviewStatus.Rejected ? "lightcoral" : 'grey' }}
                  onClick={toggle(ReviewStatus.Rejected, i)}
                  >𐄂</button>
                : null }
              </div>
          </div>
        ))}
        {!newCitation && <>
          <br/>
          <button>+</button>
        </>}
      </div>
    </div>
  )
}
