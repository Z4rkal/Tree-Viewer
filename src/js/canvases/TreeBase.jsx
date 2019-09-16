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

    updateCanvas(canX, canY) {
        const { scale } = this.state;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(-20000, -20000, 40000, 40000);
        ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale * 5, 767 / 2 + canY * scale * 5);
        // ctx.fillRect(-25 + 525 / scale, -25 + 525 / scale, 50, 50);

        Object.values(groups).map((group, groupIndex) => {
            ctx.fillRect(group.x + 10, group.y + 10, 20, 20);
            group.n.map((nodeId, gNIndex) => {
                if (nodes[nodeId]) {
                    const node = nodes[nodeId];
                    const { icon, o, oidx } = node;
                    const { ks, not, m } = node;
                    const { zoomLvl } = this.state;

                    const nodeType = (m ? 'mastery' : ks ? 'keystone' : not ? 'notable' : 'normal') + (!m ? 'Active' : '');
                    const srcId = (m ? 'groups-' : 'skills-') + `${zoomLvl}`;

                    const imgData = skillSprites[nodeType][zoomLvl];
                    const fName = imgData.filename;
                    const coords = imgData.coords[icon];

                    const src = document.getElementById(`${srcId}`);

                    const radius = orbitRadii[o];
                    const numOnOrbit = skillsPerOrbit[o];

                    // if (numOnOrbit === 40) {
                    //     console.log(2 * Math.PI * (oidx / numOnOrbit), ` GGG func: `, this.getOrbitAngle(oidx, numOnOrbit));
                    // }

                    let ø = 90 * Math.PI / 180 + this.getOrbitAngle(oidx, numOnOrbit); //2 * Math.PI * (oidx / numOnOrbit);

                    let xAdjust = - radius * Math.cos(-ø);
                    let yAdjust = radius * Math.sin(-ø);

                    ctx.save();
                    ctx.fillStyle = '#f7c8d8';
                    //ctx.fillRect(group.x + xAdjust + 6 + 10, group.y + yAdjust + 6 + 10, 12, 12);
                    ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, group.x + xAdjust - (coords.w / 2) + 10, group.y + yAdjust - (coords.h / 2) + 10, coords.w, coords.h);
                    ctx.restore();
                }
            })
        });
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
        const { canX, canY, downX, downY } = this.state;

        let offX = canX + event.nativeEvent.offsetX - downX;
        let offY = canY + event.nativeEvent.offsetY - downY;

        this.setState({
            isDragging: false,
            canX: offX,
            canY: offY
        });

        this.updateCanvas(offX, offY);
    }

    handleDrag(event) {
        const { canX, canY, downX, downY } = this.state;

        let offX = canX + event.nativeEvent.offsetX - downX;
        let offY = canY + event.nativeEvent.offsetY - downY;

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

        this.updateCanvas(canX, canY);
    }

    render() {
        const { isDragging } = this.state;

        return (
            <>
                <div>{this.state.scale}</div>
                <canvas width='916' height='767' ref={this.canvasRef} onWheel={(e) => this.handleZoom(e)} onMouseDown={(e) => this.startTracking(e)} onMouseMove={(e) => { if (isDragging) { this.handleDrag(e); }; }} onMouseUp={(e) => { if (isDragging) { this.stopTracking(e); }; }} onMouseLeave={(e) => { if (isDragging) { this.stopTracking(e); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;