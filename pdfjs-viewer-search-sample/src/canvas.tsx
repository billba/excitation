// import React from 'react'
import useCanvas from './useCanvas.tsx'

const Canvas = (props) => {
    const { draw, setRenderCanvas, height, width, outputScale, ...otherProps } = props
    const ref = useCanvas(draw, setRenderCanvas, height, width, outputScale)

    return <canvas ref={ref} {...otherProps} />
}

export default Canvas