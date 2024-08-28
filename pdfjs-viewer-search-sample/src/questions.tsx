import { docIntResponse } from "./interfaces";
import di from "../../di.json"

const response = di as docIntResponse;

const draw = (
    context: CanvasRenderingContext2D,
    scale: number = 1,
    polygons: number[]
) => {
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

const preDraw = (
    document: Document | undefined,
    pageNumber: number,
    polygons: number[]
) => {

    const pages = document.getElementsByClassName("page") as HTMLCollection;

    let canvas;
    for (let index = 0; index < pages.length; index++) {
        let page = pages[index] as HTMLElement;
        let canvasPageNumber = Number(page.dataset.pageNumber);
        if (canvasPageNumber == pageNumber) canvas = page.getElementsByTagName("canvas")[0] as HTMLCanvasElement;
    }
    // const elements = document?.querySelectorAll("div.canvasWrapper > canvas") as NodeList;

    // let element;
    // if (elements.length === 1) element = elements[0] as HTMLCanvasElement;
    // else element = elements[pageNumber - 1] as HTMLCanvasElement;

    if (canvas) {
        const highlightContext = canvas?.getContext('2d');
        const scale = parseFloat(getComputedStyle(canvas).getPropertyValue('--scale-factor') || '1');
        if (highlightContext) {
            draw(highlightContext, scale, polygons);
        }
    }
}
const findReference = (
    reference: { text: string, fileName: string },
    filePage: number,
    setFilePage: (pageNumber: number) => void,
    iframeRef: React.RefObject<HTMLIFrameElement>,
    setRef: (ref: React.RefObject<HTMLIFrameElement>) => void
) => {
    const internalDocument = iframeRef.contentDocument;

    // const internalDocument = iframeRef.current?.contentWindow?.document;
    // when you click on a specific citation
    // this runs to find the relevant document, page, and bounding box data

    // fetch DI response from a db
    // actually for now, we just import the di.json file
    const paragraphs = response.analyzeResult.paragraphs;
    // loop through paragraphs object
    // get relevant paragraph with matching text
    let boundingRegions;
    paragraphs.forEach((paragraph) => {
        if (paragraph.content == reference.text) {
            boundingRegions = paragraph.boundingRegions;
        }
    })

    // things we need:
    // page number for the iframe
    // bounding box
    if (boundingRegions) {
        const { pageNumber, polygon } = boundingRegions[0];
        preDraw(internalDocument, pageNumber, polygon);
        setRef(iframeRef);
        setFilePage(pageNumber);
    }
}

const References = (
    props
) => {
    const { references, setFilePage, filePage, iframeRef, setRef } = props;

    const returnArray = [];
    for (let index = 0; index < references.length; index++) {
        const reference = references[index];
        returnArray.push(
            <div key={"reference" + index}>
                <p id="referenceContext">{reference.text}</p>
                <button onClick={() => findReference(reference, filePage, setFilePage, iframeRef, setRef)}>Display Document</button>
            </div>
        )
    }
    return returnArray;
}
export const QuestionAnswer = (
    props
) => {
    const { qA, ...otherProps } = props;
    return (
        <div id="question-container">
            <div><div id="question">Question: </div><div id="question-text">{qA.question}</div></div>
            <label id="answer" htmlFor="answer">Answer: </label><input name="answer" placeholder={qA.answer} />
            <p id="referenceTitle">Reference contexts</p>
            <References references={qA.references} {...otherProps} />
        </div>
    )
}
