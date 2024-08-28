import { useRef, useEffect } from 'react'
import { docIntResponse } from './interfaces';
import di from "../../di.json"

const response = di as docIntResponse;

const useCanvas = (
    draw: (context: CanvasRenderingContext2D | null,
        scale: number, polygon: number[]) => void,
    style: { height: number, width: number, scale: number }
) => {
    // Creating a highlight canvas
    const ref = useRef<HTMLCanvasElement>(null);
    const paragraphs = response.analyzeResult.paragraphs;
    // loop through paragraphs object
    // get relevant paragraph
    let boundingRegions;
    paragraphs.forEach((paragraph) => {
        if (paragraph.boundingRegions[0].pageNumber == 1) {
            boundingRegions = paragraph.boundingRegions;
        }
    })


    // things we need:
    // page number for the iframe
    // bounding box
    useEffect(() => {
        const canvas = ref.current;
        // const outputScale = window.devicePixelRatio || 1;
        let context = null;
        // this would be the iframe viewport
        if (canvas) {
            canvas.height = Math.floor(style.height * style.scale);
            canvas.width = Math.floor(style.width * style.scale);
            canvas.style.width = `${style.width}px`;
            canvas.style.height = `${style.height}px`;
            context = canvas.getContext('2d')
        }
        if (boundingRegions) {
            const { polygon } = boundingRegions[0];
            draw(context, 1, polygon);
        }
    }, [draw, style, boundingRegions])
    return ref
}

export default useCanvas