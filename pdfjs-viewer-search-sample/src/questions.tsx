import { docIntResponse, BoundingRegion } from "./interfaces";
import di from "../../di.json"
const response = di as docIntResponse;

const Reference = (props) => {
    const { reference, referenceIndex, iframeRef, shown, setShown, questionIndex } = props;

    // fetch DI response from a db
    // actually for now, we just import the di.json file
    // later we'll need to do some logic about pulling the relevant file
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
    const { qA, iframeRef, ...otherProps } = props;

    // Match a subline to a line if at least 75% of its words/word fragments
    // are found in the line
    const fuzzyMatch = (line: string, subline: string, threshold = 0.6) => {
        let words = subline.split(' ');
        let wordsMatched = 0;

        for (let i = 0; i < words.length; i++) {
            if (line.includes(words[i])) wordsMatched++;
        }

        const matchRate = wordsMatched / words.length;
        if (matchRate >= threshold) {
            console.log("matched DocInt line:\t", line,
                        "\nto OCR subline:\t\t", subline,
                        "\nwith match rate:", matchRate);
            return true;
        } if (matchRate > 0.4) {
            console.log("did not match DocInt line:\t", line,
                        "\nto OCR subline:\t\t", subline,
                        "\nwith match rate:", matchRate);
        }
        else return false;
    }

    // given a set of lines, find the association boundingRegions
    const findLinesBoundingRegions = (lines: string[]) => {
        let nextLine = 0;

        const pages = response.analyzeResult.pages;
        const boundingRegions: BoundingRegion[] = [];

        for (let i = 0; i < pages.length; i++) {
            const pageLines = pages[i].lines;
            for (let j = 0; j < pageLines.length; j++) {
                if (fuzzyMatch(pageLines[j].content, lines[nextLine])) {
                    boundingRegions.push({
                        pageNumber: i + 1,
                        polygon: pageLines[j].polygon,
                    });
                    nextLine++;
                    if (nextLine == lines.length) return boundingRegions;
                }
            }
        }
        console.log("Failed to find all lines in document")
        return boundingRegions;
    }

    // Rounds a number to the given precision
    const round = (value: number, precision = 0) => {
        let multiplier = Math.pow(10, precision);
        return Math.round(value * multiplier) / multiplier;
    }

    // Return true if polygons overlap (ncluding sharing borders); false otherwise
    const adjacent = (poly0: number[], poly1: number[]) => {
        const x0 = [round(poly0[0], 1), round(poly0[2], 1)];
        const y0 = [round(poly0[1], 1), round(poly0[5], 1)];

        const x1 = [round(poly1[0], 1), round(poly1[2], 1)];
        const y1 = [round(poly1[1], 1), round(poly1[5], 1)];

        // The rectangles don't overlap if one rectangle's minimum in some
        // dimension is greater than the other's maximum in that dimension
        const noOverlap = x0[0] > x1[1] ||
                          x1[0] > x0[1] ||
                          y0[0] > y1[1] ||
                          y1[0] > y0[1];
        return !noOverlap;
    }

    // from x(x0, x1) and y(y0, y1) create an 8 value polygon
    const polygonize = (x: number[], y: number[]) => {
        return [
            x[0], y[0],
            x[1], y[0],
            x[1], y[1],
            x[0], y[1]
        ]
    }

    // Combine two squared up polygons and return the combination
    // if the two polygons are NOT adjacent you will get weird results!!!
    const combinePolygons = (poly0: number[], poly1: number[]) => {
       let x = [
            Math.min(poly0[0], poly1[0]),
            Math.max(poly0[2], poly1[2])
       ];
       let y = [
            Math.min(poly0[1], poly1[1]),
            Math.max(poly0[5], poly1[5])
       ]
       return polygonize(x, y);
    }

    // Return a polygon with sides that are parallel to the major axes
    const squareUp = (poly: number[]) => {
        let x = [
            Math.min(poly[0], poly[6]),
            Math.max(poly[2], poly[4])
        ];
        let y = [
            Math.min(poly[1], poly[3]),
            Math.max(poly[5], poly[7])
        ];
        return polygonize(x, y);
    }

    // return the given boundingRegions combined into the minimum possible
    // number of boundingRegions
    const condenseRegions = (boundingRegions: BoundingRegion[]) => {
        if (boundingRegions.length === 0) return boundingRegions;

        let condensedRegions: BoundingRegion[] = [
            {
                pageNumber: boundingRegions[0].pageNumber,
                polygon: squareUp(boundingRegions[0].polygon)
            }
        ]

        let last = condensedRegions.length - 1;
        for (let index = 1; index < boundingRegions.length; index++) {
            boundingRegions[index].polygon = squareUp(boundingRegions[index].polygon);

            if (condensedRegions[last].pageNumber === boundingRegions[index].pageNumber) {
                if (adjacent(condensedRegions[last].polygon, boundingRegions[index].polygon)) {
                    // adding to existing polygon
                    condensedRegions[last].polygon = combinePolygons(condensedRegions[last].polygon, boundingRegions[index].polygon);
                } else {
                    // New column or similar
                    condensedRegions.push(boundingRegions[index]);
                    last++;
                }
            } else {
                // new page
                condensedRegions.push(boundingRegions[index]);
                last++;
            }
        }
        return condensedRegions;
    }

    const createReferenceFromSelection = () => {
        const selection = iframeRef.current?.contentWindow.getSelection().toString()
        if (!selection) {
            console.log("No text selected");
            return;
        }

        let lines = selection.split('\n');
        for (let i = 0; i < lines.length; i++) lines[i] = lines[i].trim();

        const boundingRegions = condenseRegions(findLinesBoundingRegions(lines));
        if (boundingRegions.length === 0) {
            console.log("No match found for selected text");
            return;
        }
        console.log("boundingRegions:", boundingRegions);

        // do a thing with the found boundingRegions

        // save to references
    }

    let returnArray = [];
    returnArray.push(
        <div key="questionDiv" id="questionDiv"><p id="question">Question: </p><p id="question-text">{qA.question}</p></div>
    );
    returnArray.push(
        <label key="answer" id="answer">Answer: <input placeholder={qA.answer} /></label>
    );
    returnArray.push(
        <h3 key="referenceTitle" id="referenceTitle">Reference contexts</h3>
    );

    for (let index = 0; index < qA.references.length; index++) {
        returnArray.push(
            <Reference key={Math.random()} reference={qA.references[index]} referenceIndex={index} iframeRef={iframeRef} {...otherProps} />
        )
    }

    returnArray.push(
        <h4 key="userAddedRefs" id="userAddedRefs">User contributions</h4>
    )
    returnArray.push(
        <button key="addReference" className="addReference" onClick={() => createReferenceFromSelection()}>add selected text to references</button>
    );

    return returnArray;
}
