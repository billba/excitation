import { docIntResponse, BoundingRegion } from "./interfaces";
import di from "../../di.json"

const Reference = (props) => {
    const { reference, referenceIndex, questionIndex, iframeRef, shown, setShown } = props;

    // fetch DI response from a db
    // actually for now, we just import the di.json file
    // later we'll need to do some logic about pulling the relevant file
    const response = di as docIntResponse;
    const paragraphs = response.analyzeResult.paragraphs;

    // loop through paragraphs object
    // get relevant paragraph with matching text to set the page number
    let foundBoundingRegion = {} as BoundingRegion;
    paragraphs.forEach((paragraph) => {
        if (paragraph.content == reference.text) {
            foundBoundingRegion = paragraph.boundingRegions[0] as BoundingRegion;
        }
    })
    const { pageNumber, polygon } = foundBoundingRegion;

    const draw = (context: CanvasRenderingContext2D, scale: number = 1, polygon: number[]) => {
        const multiplier = 72 * (window.devicePixelRatio || 1) * scale;
        context.fillStyle = 'rgba(252, 207, 8, 0.3)';
        context.strokeStyle = '#fccf08';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(polygon[0] * multiplier, polygon[1] * multiplier);
        for (let i = 2; i < polygon.length; i += 2) {
            context.lineTo(polygon[i] * multiplier, polygon[i + 1] * multiplier);
        }
        context.closePath();
        context.fill();
        context.stroke();
    };

    const findCanvasAndDraw = () => {
        // we'll find the right page to grab the attached canvas
        const pages = iframeRef.current.contentDocument?.getElementsByClassName("page") as HTMLCollectionOf<Element>;

        console.log("looking for canvas...");
        let canvas;
        for (let index = 0; index < pages.length; index++) {
            let page = pages[index] as HTMLElement;
            let canvasPageNumber = Number(page.dataset.pageNumber);
            if (canvasPageNumber == pageNumber) canvas = page.getElementsByTagName("canvas")[0] as HTMLCanvasElement;
        }

        if (canvas) {
            // this doesn't happen immediately...
            console.log("canvas found!");
            const highlightContext = canvas?.getContext('2d');
            const scale = parseFloat(window.getComputedStyle(canvas).getPropertyValue('--scale-factor') || '1');
            if (highlightContext) draw(highlightContext, scale, polygon);
            shown[questionIndex][referenceIndex] = true;
            setShown(shown);
        } else {
            setTimeout(findCanvasAndDraw, 100);
        }
    }

    const showReference = () => {
        const pdfViewer = iframeRef.current.contentWindow?.PDFViewerApplication;
        
        // when you click on a specific citation
        // this runs to find the relevant document, page, and bounding box data
        pdfViewer.url = reference.fileName;
        pdfViewer.page = pageNumber;

        // if we've already drawn the reference box once, we don't need to redraw
        if (!shown[questionIndex][referenceIndex]) findCanvasAndDraw();
    }

    return (
        <button className="referenceContext" onClick={() => showReference()}>
            <p>{reference.text}</p>
        </button>
    )
}

export function QuestionAnswer(props) {
    const { qA, ...otherProps } = props;

    let returnArray = [];
    returnArray.push(
        <div key="questionDiv" id="questionDiv"><p id="question">Question: </p><p id="question-text">{qA.question}</p></div>
    );
    returnArray.push(
        <label key="answer" id="answer">Answer: <input placeholder={qA.answer} /></label>
    );
    returnArray.push(
        <p key="referenceTitle" id="referenceTitle">Reference contexts</p>
    );

    for (let index = 0; index < qA.references.length; index++) {
        returnArray.push(
            <Reference key={Math.random()} reference={qA.references[index]} referenceIndex={index} {...otherProps}/>
        )
    }

    return returnArray;
}
