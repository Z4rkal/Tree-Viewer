import React, { Component } from 'React';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii } = constants;
const { imageRoot, skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;

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
        this.getOrbitAngle = this.getOrbitAngle.bind(this);
    }

    componentDidMount() {
        const { canX, canY } = this.state;

        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.fillRect(canX + 500, canY + 500, 50, 50);
    }

    //const test = new CanvasRenderingContext2D();
    //image drawing plan:
    //ctx.drawImage('url(skills_0 etc)',dx,dy)

    getOrbitAngle(orbitIndex, numOnOrbit) {
        const degToRad = .017453293;
        if (40 == numOnOrbit) switch (orbitIndex) {
            case 0:
                return this.getOrbitAngle(0, 12);
            case 1:
                return this.getOrbitAngle(0, 12) + 10 * degToRad;
            case 2:
                return this.getOrbitAngle(0, 12) + 20 * degToRad;
            case 3:
                return this.getOrbitAngle(1, 12);
            case 4:
                return this.getOrbitAngle(1, 12) + 10 * degToRad;
            case 5:
                return this.getOrbitAngle(1, 12) + 15 * degToRad;
            case 6:
                return this.getOrbitAngle(1, 12) + 20 * degToRad;
            case 7:
                return this.getOrbitAngle(2, 12);
            case 8:
                return this.getOrbitAngle(2, 12) + 10 * degToRad;
            case 9:
                return this.getOrbitAngle(2, 12) + 20 * degToRad;
            case 10:
                return this.getOrbitAngle(3, 12);
            case 11:
                return this.getOrbitAngle(3, 12) + 10 * degToRad;
            case 12:
                return this.getOrbitAngle(3, 12) + 20 * degToRad;
            case 13:
                return this.getOrbitAngle(4, 12);
            case 14:
                return this.getOrbitAngle(4, 12) + 10 * degToRad;
            case 15:
                return this.getOrbitAngle(4, 12) + 15 * degToRad;
            case 16:
                return this.getOrbitAngle(4, 12) + 20 * degToRad;
            case 17:
                return this.getOrbitAngle(5, 12);
            case 18:
                return this.getOrbitAngle(5, 12) + 10 * degToRad;
            case 19:
                return this.getOrbitAngle(5, 12) + 20 * degToRad;
            case 20:
                return this.getOrbitAngle(6, 12);
            case 21:
                return this.getOrbitAngle(6, 12) + 10 * degToRad;
            case 22:
                return this.getOrbitAngle(6, 12) + 20 * degToRad;
            case 23:
                return this.getOrbitAngle(7, 12);
            case 24:
                return this.getOrbitAngle(7, 12) + 10 * degToRad;
            case 25:
                return this.getOrbitAngle(7, 12) + 15 * degToRad;
            case 26:
                return this.getOrbitAngle(7, 12) + 20 * degToRad;
            case 27:
                return this.getOrbitAngle(8, 12);
            case 28:
                return this.getOrbitAngle(8, 12) + 10 * degToRad;
            case 29:
                return this.getOrbitAngle(8, 12) + 20 * degToRad;
            case 30:
                return this.getOrbitAngle(9, 12);
            case 31:
                return this.getOrbitAngle(9, 12) + 10 * degToRad;
            case 32:
                return this.getOrbitAngle(9, 12) + 20 * degToRad;
            case 33:
                return this.getOrbitAngle(10, 12);
            case 34:
                return this.getOrbitAngle(10, 12) + 10 * degToRad;
            case 35:
                return this.getOrbitAngle(10, 12) + 15 * degToRad;
            case 36:
                return this.getOrbitAngle(10, 12) + 20 * degToRad;
            case 37:
                return this.getOrbitAngle(11, 12);
            case 38:
                return this.getOrbitAngle(11, 12) + 10 * degToRad;
            case 39:
                return this.getOrbitAngle(11, 12) + 20 * degToRad
        }
        return 2 * Math.PI * orbitIndex / numOnOrbit
    }

    updateCanvas(canX, canY, canScale) {
        const scale = canScale || this.state.scale;
        const zoomLvl = canScale ? canScale < imageZoomLevels[0] ? 0 : canScale < imageZoomLevels[1] ? 1 : canScale < imageZoomLevels[2] ? 2 : 3 : this.state.zoomLvl;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(-20000, -20000, 40000, 40000);
        ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale * 2, 767 / 2 + canY * scale * 2);
        // ctx.fillRect(-25 + 525 / scale, -25 + 525 / scale, 50, 50);


        let toDraw = [];
        Object.values(groups).map((group, groupIndex) => {
            //ctx.fillRect(group.x + 10, group.y + 10, 20, 20);
            group.n.map((nodeId, gNIndex) => {
                if (nodes[nodeId]) {
                    const node = nodes[nodeId];
                    const { icon, o, oidx } = node;
                    const { ks, not, m } = node;
                    const { out } = node;

                    const nodeType = (m ? 'mastery' : ks ? 'keystone' : not ? 'notable' : 'normal') + (!m ? 'Active' : '');
                    const srcId = (m ? 'groups-' : 'skills-') + `${zoomLvl}`;

                    const imgData = skillSprites[nodeType][zoomLvl];
                    const coords = imgData.coords[icon];

                    const src = document.getElementById(`${srcId}`);

                    const radius = orbitRadii[o];
                    const numOnOrbit = skillsPerOrbit[o];

                    let ø = 90 * Math.PI / 180 - this.getOrbitAngle(oidx, numOnOrbit);
                    //let ø = 90 * Math.PI / 180 - 2 * Math.PI * (oidx / numOnOrbit);

                    let xAdjust = radius * Math.cos(-ø);
                    let yAdjust = radius * Math.sin(-ø);

                    ctx.save();
                    ctx.fillStyle = '#f7c8d8';
                    //ctx.fillRect(group.x + xAdjust + 6 + 10, group.y + yAdjust + 6 + 10, 12, 12);

                    //To Do: draw images last so they don't get painted over by the lines
                    let destWidth = coords.w * (1 / (1 + (Math.max(scale, 0.15) - 1) / 1.20));
                    let destHeight = coords.h * (1 / (1 + (Math.max(scale, 0.15) - 1) / 1.20));
                    ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, group.x + xAdjust - (destWidth / 2), group.y + yAdjust - (destHeight / 2), destWidth, destHeight);
                    ctx.restore();

                    out.map((outId) => {
                        ctx.save();
                        ctx.lineWidth = 4;
                        ctx.fillStyle = "rgba(200,0,0,.5)";
                        ctx.strokeStyle = "rgba(150,150,0,.8)";

                        const outNode = nodes[outId];
                        if (outNode.g === node.g) {
                            if (outNode.o === node.o) {
                                let øOut = 90 * Math.PI / 180 - this.getOrbitAngle(outNode.oidx, numOnOrbit);
                                ctx.beginPath();

                                let clockDist = 0;
                                let antiDist = 0;
                                if (outNode.oidx > oidx) {
                                    clockDist = outNode.oidx - oidx;
                                    antiDist = numOnOrbit - clockDist;
                                }
                                else {
                                    antiDist = oidx - outNode.oidx;
                                    clockDist = numOnOrbit - antiDist;
                                }

                                if (clockDist > antiDist)
                                    ctx.arc(group.x, group.y, radius, -ø, -øOut, true);
                                else
                                    ctx.arc(group.x, group.y, radius, -ø, -øOut);
                                ctx.stroke();
                            }
                            else {
                                const outRadius = orbitRadii[outNode.o];
                                const outNumOnOrbit = skillsPerOrbit[outNode.o];

                                let ø = 90 * Math.PI / 180 - this.getOrbitAngle(outNode.oidx, outNumOnOrbit);
                                //let ø = 90 * Math.PI / 180 - 2 * Math.PI * (oidx / numOnOrbit);

                                let outXAdjust = outRadius * Math.cos(-ø);
                                let outYAdjust = outRadius * Math.sin(-ø);

                                let outNodeX = group.x + outXAdjust;
                                let outNodeY = group.y + outYAdjust;

                                let nodeX = group.x + xAdjust;
                                let nodeY = group.y + yAdjust;

                                ctx.beginPath();
                                ctx.moveTo(nodeX, nodeY);
                                ctx.lineTo(outNodeX, outNodeY);
                                ctx.stroke();
                            }
                        }
                        else if (!((!outNode.ascendancyName && node.ascendancyName) || (outNode.ascendancyName && !node.ascendancyName))) {
                            const outGroup = groups[outNode.g];

                            const outRadius = orbitRadii[outNode.o];
                            const outNumOnOrbit = skillsPerOrbit[outNode.o];

                            let ø = 90 * Math.PI / 180 - this.getOrbitAngle(outNode.oidx, outNumOnOrbit);
                            //let ø = 90 * Math.PI / 180 - 2 * Math.PI * (oidx / numOnOrbit);

                            let outXAdjust = outRadius * Math.cos(-ø);
                            let outYAdjust = outRadius * Math.sin(-ø);

                            let outNodeX = outGroup.x + outXAdjust;
                            let outNodeY = outGroup.y + outYAdjust;

                            let nodeX = group.x + xAdjust;
                            let nodeY = group.y + yAdjust;

                            ctx.beginPath();
                            ctx.moveTo(nodeX, nodeY);
                            ctx.lineTo(outNodeX, outNodeY);
                            ctx.stroke();
                        }
                        ctx.restore();
                    });
                }
            })
        });
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

    render() {
        const { isDragging } = this.state;

        return (
            <>
                <div id='zoom-debug'>{Math.floor(this.state.scale * 1000) / 1000}</div>
                <canvas className='skill-canvas' width='916' height='767' ref={this.canvasRef} onWheel={(e) => this.handleZoom(e)} onMouseDown={(e) => this.startTracking(e)} onMouseMove={(e) => { if (isDragging) { this.handleDrag(e); }; }} onMouseUp={(e) => { if (isDragging) { this.stopTracking(e); }; }} onMouseLeave={(e) => { if (isDragging) { this.stopTracking(e); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;