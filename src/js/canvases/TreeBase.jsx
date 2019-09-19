import React, { Component } from 'React';

import { passiveSkillTreeData } from '../../data/Tree';
const { skillSprites, imageZoomLevels } = passiveSkillTreeData;
const { min_x, max_x, min_y, max_y } = passiveSkillTreeData

class TreeBase extends Component {
    constructor() {
        super()

        this.canvasRef = React.createRef();
    }

    componentDidUpdate() {
        this.updateCanvas();
    }

    updateCanvas() {
        const { groups, nodes } = this.props;
        const { canX, canY } = this.props;
        const { scale, zoomLvl } = this.props;

        if (Object.values(groups).length !== 0 && Object.values(nodes).length !== 0) {
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(min_x - 1000, min_y - 1000, max_x - min_x + 2000, max_y - min_y + 2000);
            ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale * 2, 767 / 2 + canY * scale * 2);

            Object.values(groups).map((group, groupIndex) => {
                group.n.map((nodeId, nodeIndex) => {
                    if (nodes[nodeId]) {
                        const node = nodes[nodeId];
                        const { icon, srcRoot, nX, nY } = node;
                        const { nodeType, active } = node;
                        const { arcs, paths } = node;
                        //const coords  = node.coords[`z${zoomLvl}`];

                        const spriteType = active !== null ? nodeType + (active ? 'Active' : 'Inactive') : nodeType;
                        const srcId = srcRoot + (active === null || active ? '' : 'disabled-') + `${zoomLvl}`;

                        const imgData = skillSprites[spriteType][zoomLvl];
                        const coords = imgData.coords[icon];

                        const src = document.getElementById(`${srcId}`);

                        ctx.save();
                        ctx.fillStyle = '#f7c8d8';

                        let destWidth = coords.w / imageZoomLevels[zoomLvl];
                        let destHeight = coords.h / imageZoomLevels[zoomLvl];

                        ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, nX - (destWidth / 2), nY - (destHeight / 2), destWidth, destHeight);
                        ctx.restore();

                        arcs.map((arc) => {
                            ctx.save();
                            ctx.globalCompositeOperation = 'destination-over';
                            ctx.lineWidth = 4;
                            ctx.fillStyle = "rgba(200,0,0,.5)";
                            ctx.strokeStyle = "rgba(150,150,0,.8)";

                            const { x, y, radius, øStart, øEnd, aClock } = arc;

                            ctx.beginPath();
                            ctx.arc(x, y, radius, øStart, øEnd, aClock);
                            ctx.stroke();

                            ctx.restore();
                        });

                        paths.map((path) => {
                            ctx.save();
                            ctx.globalCompositeOperation = 'destination-over';
                            ctx.lineWidth = 4;
                            ctx.fillStyle = "rgba(200,0,0,.5)";
                            ctx.strokeStyle = "rgba(150,150,0,.8)";

                            const { x1, y1, x2, y2 } = path;

                            ctx.beginPath();
                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            ctx.stroke();

                            ctx.restore();
                        })
                    }
                })
            });
        }
    }

    render() {
        const { scale } = this.props;
        const { isDragging, canClick } = this.props;
        const { handleCanvasMouseDown, handleDrag, handleCanvasMouseUp, handleZoom, checkHit, handleNodeClick } = this.props;

        return (
            <>
                <div id='zoom-debug'>{Math.floor(scale * 1000) / 1000}</div>
                <canvas className='skill-canvas' width='916' height='767' ref={this.canvasRef} onWheel={(e) => { if (!isDragging) handleZoom(e); }} onMouseDown={(e) => handleCanvasMouseDown(e)} onMouseMove={(e) => { if (isDragging) { handleDrag(e); } else { checkHit(e, () => console.log('Hit!')) }; }} onMouseUp={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onMouseLeave={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onClick={(e) => { if (canClick) { checkHit(e, handleNodeClick); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;