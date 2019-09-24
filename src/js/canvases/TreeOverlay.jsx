import React, { Component } from 'react';

class TreeOverlay extends Component {
    constructor() {
        super();

        this.canvasRef = React.createRef();

        this.displayHover = this.displayHover.bind(this);
    }

    displayHover(node, event) {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 916, 767);

        if (node) {
            const { dn: name, sd } = node;

            const headFont = '12pt FontinBold';
            const bodyFont = '10pt FontinBold';

            ctx.font = headFont;
            let longest = ctx.measureText(name).width;
            ctx.font = bodyFont;
            for (let i = 0; i < sd.length; i++) {
                let cur = ctx.measureText(sd[i]).width;
                if (cur > longest) longest = cur;
            }

            const x = event.nativeEvent.offsetX;
            const y = event.nativeEvent.offsetY;


            const wOff = 20;
            const hOff = 40;
            const hLine = 20;

            let xOff = 0;
            let yOff = 0;
            if (x + longest + wOff > CAN_WIDTH)
                xOff = x + longest + wOff - CAN_WIDTH;
            if (y + hOff + sd.length * hLine > CAN_HEIGHT)
                yOff = y + hOff + sd.length * hLine - CAN_HEIGHT;

            ctx.translate(x - xOff, y - yOff);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'seashell';
            ctx.fillStyle = '#000000cc';
            ctx.fillRect(0, 0, longest + wOff, hOff + sd.length * hLine);
            ctx.strokeRect(0, 0, longest + wOff, hOff + sd.length * hLine);

            ctx.fillStyle = 'rgb(200,200,200)';
            ctx.font = headFont;
            ctx.fillText(name, wOff / 2, hOff / 2);

            ctx.font = bodyFont;
            for (let i = 0; i < sd.length; i++) {
                ctx.fillText(sd[i], wOff / 2, hOff / 2 + hLine * (i + 1));
            }

            ctx.translate(-(x - xOff), -(y - yOff));
        }
    }

    render() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { isDragging, canClick } = this.props;
        const { handleCanvasMouseDown, handleDrag, handleCanvasMouseUp, handleZoom, checkHit, handleNodeClick } = this.props;

        return (
            <>
                <canvas className='skill-canvas' width={CAN_WIDTH} height={CAN_HEIGHT} ref={this.canvasRef} onWheel={(e) => { if (!isDragging) handleZoom(e); }} onMouseDown={(e) => handleCanvasMouseDown(e)} onMouseMove={(e) => { if (isDragging) { handleDrag(e); } else { checkHit(e, this.displayHover); }; }} onMouseUp={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onMouseLeave={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onClick={(e) => { if (canClick) { checkHit(e, handleNodeClick); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeOverlay;
