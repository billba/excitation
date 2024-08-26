import { useRef, useEffect } from 'react'

const useCanvas = (draw: (context: CanvasRenderingContext2D | null) => void, setRenderCanvas: React.Dispatch<React.SetStateAction<boolean>>, height: number, width: number, outputScale: number) => {
    // Creating a highlight canvas
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current;
        // const outputScale = window.devicePixelRatio || 1;
        let context = null;
        // this would be the iframe viewport
        if (canvas) {
            canvas.height = Math.floor(height * outputScale);
            canvas.width = Math.floor(width * outputScale);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context = canvas.getContext('2d')
        }
        const renderer = () => {
            draw(context)
            setRenderCanvas(true)
        }
        renderer()
    }, [draw, setRenderCanvas, height, width, outputScale])
    return ref
}

export default useCanvas