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
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!this.props.loaded) {
            ctx.save();
            ctx.fillStyle = '#f7c8d8';
            ctx.fillRect(min_x - 1000, min_y - 1000, max_x + Math.abs(min_x) + 2000, max_y + Math.abs(min_y) + 2000);

            const loadingMessage = `Loading Assets, Please Wait :)`;

            ctx.font = '50px serif';
            ctx.textBaseLine = 'middle';
            ctx.fillStyle = '#55c8d8';

            let textLength = ctx.measureText(loadingMessage);

            ctx.fillText(loadingMessage, 916 / 2 - (textLength.width / 2), 767 / 2);
            ctx.restore();
            return 0;
        }

        const { canX, canY, scale } = this.props;

        ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale, 767 / 2 + canY * scale);
        ctx.clearRect(-(916 / (2 * scale) + canX), -(767 / (2 * scale) + canY), 916 / scale, 767 / scale);

        this.drawTreeStructure();
        this.drawBackGround();
    }

    drawTreeStructure() {
        const { groups, nodes } = this.props;
        const { canX, canY } = this.props;
        const { scale, zoomLvl } = this.props;

        if (Object.values(groups).length !== 0 && Object.values(nodes).length !== 0) {
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

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

                        let destWidth = coords.w / imageZoomLevels[zoomLvl];
                        let destHeight = coords.h / imageZoomLevels[zoomLvl];

                        if (node.spc.length === 0) {
                            ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, nX - (destWidth / 2), nY - (destHeight / 2), destWidth, destHeight);

                            if (!node.ascendancyName) {
                                let frameId, frameSrc;
                                let frameWidth, frameHeight;
                                if (nodeType === 'normal' && !node.isJewelSocket) {
                                    frameId = `PSSkillFrame${active ? `Active` : ``}-${zoomLvl}`
                                    frameSrc = document.getElementById(`${frameId}`)

                                    frameWidth = frameSrc.width / imageZoomLevels[zoomLvl];
                                    frameHeight = frameSrc.height / imageZoomLevels[zoomLvl];

                                    ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                                }
                                else if (nodeType === 'notable') {
                                    frameId = `NotableFrame${active ? `Allocated` : `Unallocated`}-${zoomLvl}`
                                    frameSrc = document.getElementById(`${frameId}`)

                                    frameWidth = frameSrc.width / imageZoomLevels[zoomLvl];
                                    frameHeight = frameSrc.height / imageZoomLevels[zoomLvl];

                                    ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                                }
                                else if (nodeType === 'keystone') {
                                    frameId = `KeystoneFrame${active ? `Allocated` : `Unallocated`}-${zoomLvl}`
                                    frameSrc = document.getElementById(`${frameId}`)

                                    frameWidth = frameSrc.width / imageZoomLevels[zoomLvl];
                                    frameHeight = frameSrc.height / imageZoomLevels[zoomLvl];

                                    ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                                }
                                else if (node.isJewelSocket) {
                                    frameId = `JewelFrame${active ? `Allocated` : `Unallocated`}-${zoomLvl}`
                                    frameSrc = document.getElementById(`${frameId}`)

                                    frameWidth = frameSrc.width / imageZoomLevels[zoomLvl];
                                    frameHeight = frameSrc.height / imageZoomLevels[zoomLvl];

                                    ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                                }
                            }
                        }

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

    drawBackGround() {
        const { groups, nodes } = this.props;
        const { canX, canY } = this.props;
        const { scale, zoomLvl } = this.props;

        if (Object.values(groups).length !== 0 && Object.values(nodes).length !== 0) {
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';

            Object.values(groups).map((group, groupIndex) => {
                if (group.circleType) {
                    const { x, y } = group;
                    let circleId, circleSrc;
                    let circleWidth, circleHeight;

                    switch (group.circleType) {
                        case 'small':
                            circleId = `PSGroupBackground1-${zoomLvl}`
                            circleSrc = document.getElementById(`${circleId}`)

                            circleWidth = circleSrc.width / imageZoomLevels[zoomLvl];
                            circleHeight = circleSrc.height / imageZoomLevels[zoomLvl];

                            ctx.drawImage(circleSrc, x - (circleWidth / 2), y - (circleHeight / 2), circleWidth, circleHeight);
                            break;
                        case 'medium':
                            circleId = `PSGroupBackground2-${zoomLvl}`
                            circleSrc = document.getElementById(`${circleId}`)

                            circleWidth = circleSrc.width / imageZoomLevels[zoomLvl];
                            circleHeight = circleSrc.height / imageZoomLevels[zoomLvl];

                            ctx.drawImage(circleSrc, x - (circleWidth / 2), y - (circleHeight / 2), circleWidth, circleHeight);
                            break;
                        case 'large':
                            circleId = `PSGroupBackground3-${zoomLvl}`
                            circleSrc = document.getElementById(`${circleId}`)

                            circleWidth = circleSrc.width / imageZoomLevels[zoomLvl];
                            circleHeight = circleSrc.height / imageZoomLevels[zoomLvl];

                            ctx.save(); //Minus full image height since it's a half circle
                            ctx.drawImage(circleSrc, x - (circleWidth / 2), y - circleHeight, circleWidth, circleHeight);
                            ctx.translate(x, y);
                            ctx.rotate(Math.PI);
                            ctx.drawImage(circleSrc, 0 - (circleWidth / 2), 0 - circleHeight, circleWidth, circleHeight);
                            ctx.restore();
                            break;
                    }
                }
            });

            ctx.fillStyle = ctx.createPattern(document.getElementById(`Background1-${zoomLvl}`), 'repeat');
            ctx.fillRect(-(916 / (2 * scale) + canX), -(767 / (2 * scale) + canY), 916 / scale, 767 / scale);

            ctx.restore();
        }
    }

    render() {
        const { scale } = this.props;
        const { isDragging, canClick } = this.props;
        const { handleCanvasMouseDown, handleDrag, handleCanvasMouseUp, handleZoom, checkHit, handleNodeClick } = this.props;

        return (
            <>
                <div id='zoom-debug'>{Math.floor(scale * 1000) / 1000}</div>
                <canvas className='skill-canvas' width='916' height='767' ref={this.canvasRef} onWheel={(e) => { if (!isDragging) handleZoom(e); }} onMouseDown={(e) => handleCanvasMouseDown(e)} onMouseMove={(e) => { if (isDragging) { handleDrag(e); }; }} onMouseUp={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onMouseLeave={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onClick={(e) => { if (canClick) { checkHit(e, handleNodeClick); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;