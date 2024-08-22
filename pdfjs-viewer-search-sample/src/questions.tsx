import {useState} from 'react';
import {docIntResponse} from "./interfaces";
import di from "../../di.json"

const response = di as docIntResponse;

const createPolygon = (polygons: number[]) => {
    return polygons;
};

const findReferences = ({ text, fileName }: {text: string, fileName: string}, setFilePage: (filePage: number) => void) => {
    // when you click on a specific citation
    // this runs to find the relevant document, page, and bounding box data

    // fetch DI response from a db
    // actually for now, we just import the di.json file
    let paragraphs = response.analyzeResult.paragraphs;

    // loop through paragraphs object
    // get relevant paragraph with matching text
    let boundingRegions;
    paragraphs.forEach((paragraph) => {
        if (paragraph.content == text) {
        boundingRegions = paragraph.boundingRegions;
        } 
    })

    // things we need:
    // page number for the iframe
    // bounding box
    if (boundingRegions) {
        let {pageNumber, polygons} = boundingRegions[0];
        setFilePage(pageNumber);
        createPolygon(polygons);
    }
}

let References = (props) => {
    let {references, setFilePage} = props;
    // const [reference, setReference] = useState();
    
    let returnArray = [];
    for (let index = 0; index < references.length; index++) {
        const reference = references[index];
        returnArray.push(
            <div key={"reference" + index}>
                <p id="referenceTitle">Reference contexts</p>
                <p id="referenceContext">{reference.text}</p>
                <button onClick={() => findReferences(reference, setFilePage)}>Display Document</button>
            </div>
        )
    } 
    return returnArray; 
} 

export function QuestionAnswer(props) {
    let {qA, ...otherProps} = props;
    return (
        <div id="question-container">
            <p><div id="question">Question: </div><div id="question-text">{qA.question}</div></p>
            <label id="answer" htmlFor="answer">Answer: </label><input name="answer" placeholder={qA.answer} />
            <References references={qA.references} {...otherProps}/>
        </div>
    )
}
