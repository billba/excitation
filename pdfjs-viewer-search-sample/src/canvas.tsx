// import React from 'react'
import useCanvas from './useCanvas'

const Canvas = (props) => {
    const { draw, style, ...otherProps } = props
    const ref = useCanvas(draw, style)

    return <canvas ref={ref} {...otherProps} />
}

export default Canvas