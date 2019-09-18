import React, { Component } from 'React';

import opts from '../../data/Tree';
// const { groups, nodes, constants } = opts.passiveSkillTreeData;
// const { skillsPerOrbit, orbitRadii } = constants;
const { imageRoot, skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;
const { min_x, max_x, min_y, max_y } = opts.passiveSkillTreeData

class TreeBase extends Component {
    constructor() {
        super()

        this.state = {
            canX: 0,
            canY: 0,
            scale: 1,
            zoomLvl: 3,
            isDragging: false,
            downX: 0,
            downY: 0,
            offX: 0,
            offY: 0,
        };

        this.canvasRef = React.createRef();
    }

    // componentDidMount() {
    //     const { canX, canY } = this.state;

    //     const canvas = this.canvasRef.current;
    //     const ctx = canvas.getContext('2d');

    //     ctx.fillRect(canX + 500, canY + 500, 50, 50);
    // }

    componentDidUpdate() {
        const { canX, canY } = this.state;
        this.updateCanvas(canX, canY);
    }

    updateCanvas(canX, canY, canScale) {
        const { groups, nodes } = this.props;

        if (Object.values(groups).length !== 0 && Object.values(nodes).length !== 0) {
            const scale = canScale || this.state.scale;
            const zoomLvl = canScale ? canScale < imageZoomLevels[0] ? 0 : canScale < imageZoomLevels[1] ? 1 : canScale < imageZoomLevels[2] ? 2 : 3 : this.state.zoomLvl;
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(min_x - 1000, min_y - 1000, max_x - min_x + 2000, max_y - min_y + 2000);
            ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale * 2, 767 / 2 + canY * scale * 2);

            Object.values(groups).map((group, groupIndex) => {
                //ctx.fillRect(group.x + 10, group.y + 10, 20, 20);
                group.n.map((nodeId, nodeIndex) => {
                    if (nodes[nodeId]) {
                        const node = nodes[nodeId];
                        const { icon, srcRoot, nX, nY } = node;
                        const { nodeType, active } = node;
                        const { arcs, paths } = node;

                        const spriteType = active !== null ? nodeType + (active ? 'Active' : 'Inactive') : nodeType;
                        const srcId = srcRoot + (active === null || active ? '' : 'disabled-') + `${zoomLvl}`;

                        const imgData = skillSprites[spriteType][zoomLvl];
                        const coords = imgData.coords[icon];

                        const src = document.getElementById(`${srcId}`);

                        // const radius = orbitRadii[o];
                        // const numOnOrbit = skillsPerOrbit[o];

                        // let ø = 90 * Math.PI / 180 - this.getOrbitAngle(oidx, numOnOrbit);
                        // //let ø = 90 * Math.PI / 180 - 2 * Math.PI * (oidx / numOnOrbit);

                        // let xAdjust = radius * Math.cos(-ø);
                        // let yAdjust = radius * Math.sin(-ø);

                        ctx.save();
                        ctx.fillStyle = '#f7c8d8';
                        //ctx.fillRect(group.x + xAdjust + 6 + 10, group.y + yAdjust + 6 + 10, 12, 12);

                        //To Do: draw images last so they don't get painted over by the lines
                        let destWidth = coords.w / imageZoomLevels[zoomLvl];//(1 + ((1 / scale) - 1) / 1.5);
                        let destHeight = coords.h / imageZoomLevels[zoomLvl];//(1 + ((1 / scale) - 1) / 1.5);

                        ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, nX - (destWidth / 2), nY - (destHeight / 2), destWidth, destHeight);
                        ctx.restore();

                        arcs.map((arc) => {
                            ctx.save();
                            ctx.globalCompositeOperation = 'destination-over';
                            ctx.lineWidth = 4;
                            ctx.fillStyle = "rgba(200,0,0,.5)";
                            ctx.strokeStyle = "rgba(150,150,0,.8)";

                            // arcs[arcId] = {
                            //     x: group.x,
                            //     y: group.y,
                            //     radius,
                            //     øStart: -ø,
                            //     øEnd: -øOut,
                            //     aClock: true
                            // };

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

                            // paths[pathId] = {
                            //     x1: nodeX,
                            //     y1: nodeY,
                            //     x2: outNodeX,
                            //     y2: outNodeY
                            // }

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

    drawLine() {

    }

    drawArc() {

    }

    startTracking(event) {
        let downX = event.nativeEvent.offsetX;
        let downY = event.nativeEvent.offsetY;

        this.setState({
            isDragging: true,
            downX: downX,
            downY: downY
        });
    }

    stopTracking(event) {
        const { canX, canY, downX, downY, scale } = this.state;

        let offX = canX + (event.nativeEvent.offsetX - downX) / scale;
        let offY = canY + (event.nativeEvent.offsetY - downY) / scale;

        this.setState({
            isDragging: false,
            canX: offX,
            canY: offY
        });

        this.updateCanvas(offX, offY);
    }

    handleDrag(event) {
        const { canX, canY, downX, downY, scale } = this.state;

        let offX = canX + (event.nativeEvent.offsetX - downX) / scale;
        let offY = canY + (event.nativeEvent.offsetY - downY) / scale;

        this.updateCanvas(offX, offY);
    }

    handleZoom(event) {
        const { scale, canX, canY } = this.state;

        const dY = Math.floor(event.deltaY) / 1000;

        let newScale = Math.max(Math.min(scale - dY, 1), 0.1)

        let newZoom;
        if (newScale <= imageZoomLevels[0]) {
            newZoom = 0;
        }
        else if (newScale <= imageZoomLevels[1]) {
            newZoom = 1;
        }
        else if (newScale <= imageZoomLevels[2]) {
            newZoom = 2;
        }
        else {
            newZoom = 3;
        }

        this.setState({
            scale: newScale,
            zoomLvl: newZoom
        });

        this.updateCanvas(canX, canY, newScale);
    }

    checkHit(event, cb) {
        const { canX, canY, scale, zoomLvl } = this.state;
        const { hitPoints, nodes } = this.props;
        const { widest, tallest, normal, notable, keystone } = this.props.sizeConstants;

        let offX = Math.round((event.nativeEvent.offsetX - ((916 / 2) + (canX * scale))) / scale - canX);
        let offY = Math.round((event.nativeEvent.offsetY - ((767 / 2) + (canY * scale))) / scale - canY);

        for (let x = -(Math.floor(widest / 2)); x < Math.ceil(widest / 2); x++) { //Widest is 100, so 100/2 is 50 units at most
            if (hitPoints[offX + x]) {//console.log(`Hit! ${hitPoints[offX + x]}`);
                for (let y = -(Math.floor(tallest / 2)); y < Math.ceil(tallest / 2); y++) { //Tallest is 100
                    if (hitPoints[offX + x][offY + y] && nodes[hitPoints[offX + x][offY + y]]) {//console.log(`Hit! ${hitPoints[offX + x]}`);
                        switch (nodes[hitPoints[offX + x][offY + y]].nodeType) {
                            case 'normal':
                                if (Math.abs(x) <= Math.round(normal[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(normal[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(hitPoints[offX + x][offY + y]);
                                    return true;//handleNodeClick(hitPoints[offX + x][offY + y]);//console.log(`Hit! Node: ${hitPoints[offX + x][offY + y]}, Type: ${nodes[hitPoints[offX + x][offY + y]].nodeType}`);
                                }
                                return false;
                            case 'notable':
                                if (Math.abs(x) <= Math.round(notable[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(notable[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(hitPoints[offX + x][offY + y]);
                                    return true; //console.log(`Hit! Node: ${hitPoints[offX + x][offY + y]}, Type: ${nodes[hitPoints[offX + x][offY + y]].nodeType}`);
                                }
                                return false;
                            case 'keystone':
                                if (Math.abs(x) <= Math.round(keystone[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(keystone[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(hitPoints[offX + x][offY + y]);
                                    return true; //console.log(`Hit! Node: ${hitPoints[offX + x][offY + y]}, Type: ${nodes[hitPoints[offX + x][offY + y]].nodeType}`);
                                }
                                return false;
                            default: throw new Error(`Bad hit point value in checkHit`);
                        }
                    }
                }
            }
        }
        return false;
    }

    render() {
        const { isDragging } = this.state;
        const { handleNodeClick } = this.props;

        return (
            <>
                <div id='zoom-debug'>{Math.floor(this.state.scale * 1000) / 1000}</div>
                <canvas className='skill-canvas' width='916' height='767' ref={this.canvasRef} onWheel={(e) => { if (!isDragging) this.handleZoom(e); }} onMouseDown={(e) => this.startTracking(e)} onMouseMove={(e) => { if (isDragging) { this.handleDrag(e); } else { this.checkHit(e, () => console.log('Hit!')) }; }} onMouseUp={(e) => { if (isDragging) { this.stopTracking(e); }; }} onMouseLeave={(e) => { if (isDragging) { this.stopTracking(e); }; }} onClick={(e) => this.checkHit(e, handleNodeClick)}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;