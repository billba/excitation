import { docIntResponse } from "./interfaces";
import di from "../../di.json"

const response = di as docIntResponse;

const preDraw = (iframeRef: React.RefObject<HTMLIFrameElement>, polygons: number[]) => {
    const element = iframeRef.current?.contentWindow?.document.querySelector("div.canvasWrapper > canvas") as HTMLCanvasElement;
    if (element) {
        const highlightContext = element?.getContext('2d');
        const textLayer = iframeRef.current?.contentWindow?.document.querySelector("div.textLayer") as HTMLDivElement;
        const textLayerScale = parseFloat(iframeRef.current?.contentWindow?.getComputedStyle(textLayer).getPropertyValue('--scale-factor') || '1');
        if (highlightContext) {
            draw(highlightContext, textLayerScale, polygons);
        }
    }
}
const findReferences = ({ text, fileName }: { text: string, fileName: string }, setFilePage: (filePage: number) => void, iframeRef: React.RefObject<HTMLIFrameElement>) => {
    // when you click on a specific citation
    // this runs to find the relevant document, page, and bounding box data

    // fetch DI response from a db
    // actually for now, we just import the di.json file
    const paragraphs = response.analyzeResult.paragraphs;

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
        const { pageNumber, polygon } = boundingRegions[0];
        preDraw(iframeRef, polygon);
        setFilePage(pageNumber);
    }
}

const draw = (context: CanvasRenderingContext2D, scale: number = 1, polygons: number[]) => {
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

const References = (props) => {
    const { references, setFilePage, iframeRef } = props;
    const returnArray = [];
    for (let index = 0; index < references.length; index++) {
        const reference = references[index];
        returnArray.push(
            <div key={"reference" + index}>
                <p id="referenceTitle">Reference contexts</p>
                <p id="referenceContext">{reference.text}</p>
                <button onClick={() => findReferences(reference, setFilePage, iframeRef)}>Display Document</button>
            </div>
        )
    }
    return returnArray;
}
export function QuestionAnswer(props) {
    const { qA, ...otherProps } = props;
    return (
        <div id="question-container">
            <div><div id="question">Question: </div><div id="question-text">{qA.question}</div></div>
            <label id="answer" htmlFor="answer">Answer: </label><input name="answer" placeholder={qA.answer} />
            <References references={qA.references} {...otherProps} />
        </div>
    )
}
