import React, { Component } from 'react';

import { passiveSkillTreeData } from '../../data/Tree';
const { skillSprites, imageZoomLevels } = passiveSkillTreeData;
const { min_x, max_x, min_y, max_y } = passiveSkillTreeData;

import checkForVisibleIntersect from '../lib/checkForVisibleIntersect';

class TreeBase extends Component {
    constructor() {
        super()

        this.groupCanvases = {}
        this.canvasRef = React.createRef();
    }

    componentDidUpdate(prevProps) { //Check for node changes here
        const { loaded: loadedNow } = this.props;
        const { loaded: loadedThen } = prevProps;

        if (!loadedThen && loadedNow)
            this.intializeGroupCanvases();
        else if (loadedThen && loadedNow)
            this.handleTreeChanges(prevProps);

        this.updateCanvas();
    }

    intializeGroupCanvases() {
        const { groups } = this.props;
        Object.values(groups).map((group) => {
            this.drawGroup(group, 0);
            this.drawGroup(group, 1);
            this.drawGroup(group, 2);
            this.drawGroup(group, 3);
        });
    }

    handleTreeChanges(prevProps) {
        const { activeNodes, groups, nodes } = this.props;
        const { activeNodes: oldActiveNodes, nodes: oldNodes } = prevProps;

        let groupsToRedraw = {};

        Object.keys(activeNodes).map((nodeId) => { //Find new active nodes, and mark their groups for redraw
            const { g: groupId, adjacent } = nodes[nodeId];

            if (!groupsToRedraw[groupId] && !oldActiveNodes[nodeId])
                groupsToRedraw[groupId] = true;

            adjacent.map((adjNodeId) => {
                const adjNode = nodes[adjNodeId];
                const { g: adjGroupId } = adjNode;
                const oldAdjNode = oldNodes[adjNodeId];

                if (adjGroupId !== groupId && !groupsToRedraw[adjGroupId]
                    && (oldAdjNode.canTake === 0 && adjNode.canTake !== 0))
                    groupsToRedraw[adjGroupId] = true;
            });
        });

        Object.keys(oldActiveNodes).map((nodeId) => { //Find new inactive nodes, and mark their groups for redraw
            const { g: groupId, adjacent } = nodes[nodeId];

            if (!groupsToRedraw[groupId] && !activeNodes[nodeId])
                groupsToRedraw[groupId] = true;

            adjacent.map((adjNodeId) => {
                const adjNode = nodes[adjNodeId];
                const { g: adjGroupId } = adjNode;
                const oldAdjNode = oldNodes[adjNodeId];

                if (adjGroupId !== groupId && !groupsToRedraw[adjGroupId]
                    && (oldAdjNode.canTake !== 0 && adjNode.canTake === 0))
                    groupsToRedraw[adjGroupId] = true;
            });
        });

        Object.keys(groupsToRedraw).map((groupId) => {
            const group = groups[groupId];
            this.drawGroup(group, 0);
            this.drawGroup(group, 1);
            this.drawGroup(group, 2);
            this.drawGroup(group, 3);
        });
    }

    //Strength/Dex/Int Fill colors;
    //"rgb(235,46,16)";"rgb(1,217,1)";"rgb(88,130,255)";
    updateCanvas() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
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

            ctx.fillText(loadingMessage, CAN_WIDTH / 2 - (textLength.width / 2), CAN_HEIGHT / 2);
            ctx.restore();
            return 0;
        }

        const { canX, canY, scale } = this.props;

        //Redraw whole tree, later I'd like to only redraw the specific things that change if the state change
        //is something like a node being taken or the search bar updating
        ctx.setTransform(scale, 0, 0, scale, CAN_WIDTH / 2 + canX * scale, CAN_HEIGHT / 2 + canY * scale);
        ctx.clearRect(-(CAN_WIDTH / (2 * scale) + canX), -(CAN_HEIGHT / (2 * scale) + canY), Math.round(CAN_WIDTH / scale), Math.round(CAN_HEIGHT / scale));
        this.drawTreeStructure();
        this.drawBackGround();
    }

    drawTreeStructure() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { groups, nodes, paths } = this.props;
        const { canX, canY } = this.props;
        const { scale, zoomLvl } = this.props;
        const { keystone } = this.props.sizeConstants;
        const scaleAtCurrentZoomLevel = imageZoomLevels[zoomLvl];

        let drawnPaths = {};

        if (Object.values(groups).length !== 0 && Object.values(nodes).length !== 0) {
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

            Object.values(groups).map((group, groupIndex) => {
                //Determine whether group is visible
                const x0 = group.min_x + canX;
                const x1 = group.max_x + canX;
                const y0 = group.min_y + canY;
                const y1 = group.max_y + canY;

                const keystoneRadius = keystone[`z${zoomLvl}`].r;

                if (
                    (Math.abs(x0 - keystoneRadius) <= (CAN_WIDTH) / (2 * scale)
                        || Math.abs(x0 + keystoneRadius) <= (CAN_WIDTH) / (2 * scale)
                        || Math.abs(x1 - keystoneRadius) <= (CAN_WIDTH) / (2 * scale)
                        || Math.abs(x1 + keystoneRadius) <= (CAN_WIDTH) / (2 * scale))
                    && (Math.abs(y0 - keystoneRadius) <= (CAN_HEIGHT) / (2 * scale)
                        || Math.abs(y0 + keystoneRadius) <= (CAN_HEIGHT) / (2 * scale)
                        || Math.abs(y1 - keystoneRadius) <= (CAN_HEIGHT) / (2 * scale)
                        || Math.abs(y1 + keystoneRadius) <= (CAN_HEIGHT) / (2 * scale))
                ) {
                    if (!this.groupCanvases[group.id] || !this.groupCanvases[group.id][zoomLvl])
                        this.drawGroup(group, zoomLvl);
                    const gCanvas = this.groupCanvases[group.id][zoomLvl];
                    ctx.drawImage(gCanvas, group.x - (gCanvas.width / 2), group.y - (gCanvas.height / 2));

                    group.n.map((nodeId) => { //Still a little slow, should use tiles instead of group canvases to avoid all these operations as well
                        const node = nodes[nodeId];
                        const { pathKeys } = node;

                        ctx.globalCompositeOperation = 'destination-over';
                        pathKeys.map((pathId) => {
                            if (!drawnPaths[pathId]) {
                                drawnPaths[pathId] = true;
                                const path = paths[pathId];
                                const { x0, y0, w, ø, startId, outId } = path;

                                const lineId = `LineConnector${nodes[startId].active ? (nodes[outId].active ? 'Active' : 'Intermediate') : (nodes[outId].active ? 'Intermediate' : 'Normal')}-${zoomLvl}`;
                                const lineSrc = document.getElementById(`${lineId}`);

                                if (ø === undefined || w === undefined) throw new Error(`Path calculation broke for node ${nodeId}`);

                                const lineHeight = Math.round(lineSrc.height / scaleAtCurrentZoomLevel);

                                const decoId = `PSLineDeco${nodes[startId].active && nodes[outId].active ? 'Highlighted' : ''}-${zoomLvl}`;
                                const decoSrc = document.getElementById(`${decoId}`);

                                const decoWidth = Math.round(decoSrc.width / scaleAtCurrentZoomLevel);
                                const decoHeight = Math.round(decoSrc.height / scaleAtCurrentZoomLevel);

                                ctx.translate(x0, y0);
                                ctx.rotate(ø);
                                ctx.drawImage(decoSrc, 25, 0 - (decoHeight / 2), decoWidth, decoHeight);
                                ctx.scale(-1, 1);
                                ctx.drawImage(decoSrc, -w + 25, 0 - (decoHeight / 2), decoWidth, decoHeight);
                                ctx.scale(-1, 1);
                                ctx.drawImage(lineSrc, 0, 0 - (lineHeight / 2), Math.round(w), lineHeight)
                                ctx.rotate(-ø);
                                ctx.translate(-x0, -y0);
                            }
                        });
                        ctx.globalCompositeOperation = 'source-over';
                    });
                }
            });

            paths.map((path, pathId) => {
                if (!drawnPaths[pathId]) { //Search for any paths that intersect the visible canvas and draw them
                    if (checkForVisibleIntersect(path, canX, canY, CAN_WIDTH, CAN_HEIGHT, scale)) {
                        drawnPaths[pathId] = true;
                        const path = paths[pathId];
                        const { x0, y0, w, ø, startId, outId } = path;

                        const lineId = `LineConnector${nodes[startId].active ? (nodes[outId].active ? 'Active' : 'Intermediate') : (nodes[outId].active ? 'Intermediate' : 'Normal')}-${zoomLvl}`;
                        const lineSrc = document.getElementById(`${lineId}`);

                        if (ø === undefined || w === undefined) throw new Error(`Path calculation broke for node ${nodeId}`);

                        const lineHeight = Math.round(lineSrc.height / scaleAtCurrentZoomLevel);

                        const decoId = `PSLineDeco${nodes[startId].active && nodes[outId].active ? 'Highlighted' : ''}-${zoomLvl}`;
                        const decoSrc = document.getElementById(`${decoId}`);

                        const decoWidth = Math.round(decoSrc.width / scaleAtCurrentZoomLevel);
                        const decoHeight = Math.round(decoSrc.height / scaleAtCurrentZoomLevel);

                        ctx.translate(x0, y0);
                        ctx.rotate(ø);
                        ctx.drawImage(decoSrc, 25, 0 - (decoHeight / 2), decoWidth, decoHeight);
                        ctx.scale(-1, 1);
                        ctx.drawImage(decoSrc, -w + 25, 0 - (decoHeight / 2), decoWidth, decoHeight);
                        ctx.scale(-1, 1);
                        ctx.drawImage(lineSrc, 0, 0 - (lineHeight / 2), Math.round(w), lineHeight)
                        ctx.rotate(-ø);
                        ctx.translate(-x0, -y0);
                    }
                }
            });
        }
    }

    drawBackGround() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { groups, nodes, startingNodes, ascStartingNodes } = this.props;
        const { ascClassname } = this.props;
        const { canX, canY } = this.props;
        const { scale, zoomLvl } = this.props;
        const scaleAtCurrentZoomLevel = imageZoomLevels[zoomLvl];

        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.globalCompositeOperation = 'destination-over';

        if (Object.values(startingNodes).length !== 0) {
            Object.values(startingNodes).map((node) => {
                const plaqueId = nodes[node.nodeId].active ? `${node.activeImageRoot}-${zoomLvl}` : `PSStartNodeBackgroundInactive-${zoomLvl}`;
                const plaqueSrc = document.getElementById(`${plaqueId}`);

                const plaqueWidth = Math.round(plaqueSrc.width / scaleAtCurrentZoomLevel);
                const plaqueHeight = Math.round(plaqueSrc.height / scaleAtCurrentZoomLevel);

                const { nX, nY } = nodes[node.nodeId];

                if ((Math.abs((nX + canX) - plaqueWidth / 2) <= (CAN_WIDTH) / (2 * scale) || Math.abs((nX + canX) + plaqueWidth / 2) <= (CAN_WIDTH) / (2 * scale))
                    && (Math.abs((nY + canY) - plaqueHeight / 2) <= (CAN_HEIGHT) / (2 * scale) || Math.abs((nY + canY) + plaqueHeight / 2) <= (CAN_HEIGHT) / (2 * scale))) {
                    ctx.drawImage(plaqueSrc, nX - (plaqueWidth / 2), nY - (plaqueHeight / 2), plaqueWidth, plaqueHeight);
                }
            });
        }

        if (Object.values(ascStartingNodes).length !== 0) {
            Object.values(ascStartingNodes).map((node) => {
                const ascBackgroundId = `Classes${node.ascName}-${zoomLvl}`;
                const ascBackgroundSrc = document.getElementById(`${ascBackgroundId}`);

                const ascBackgroundWidth = Math.round(ascBackgroundSrc.width / scaleAtCurrentZoomLevel);
                const ascBackgroundHeight = Math.round(ascBackgroundSrc.height / scaleAtCurrentZoomLevel);

                const { nX, nY } = nodes[node.nodeId];

                if (Math.abs(nX + canX) <= CAN_WIDTH / scale && Math.abs(nY + canY) <= CAN_HEIGHT / scale) {
                    // || ((Math.abs((nX + canX) - ascBackgroundWidth / 2) <= (CAN_WIDTH) / (2 * scale) || Math.abs((nX + canX) + ascBackgroundWidth / 2) <= (CAN_WIDTH) / (2 * scale))
                    // && (Math.abs((nY + canY) - ascBackgroundHeight / 2) <= (CAN_HEIGHT) / (2 * scale) || Math.abs((nY + canY) + ascBackgroundHeight / 2) <= (CAN_HEIGHT) / (2 * scale)))) {
                    ctx.drawImage(ascBackgroundSrc, nX - (ascBackgroundWidth / 2), nY - (ascBackgroundHeight / 2), ascBackgroundWidth, ascBackgroundHeight);

                    if (node.ascName !== ascClassname) {
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = `#00000055`;

                        ctx.translate(nX, nY);
                        ctx.beginPath();
                        ctx.arc(0, 0, Math.max(ascBackgroundWidth, ascBackgroundHeight) / 2, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.translate(-nX, -nY);
                        ctx.globalCompositeOperation = 'destination-over';
                    }
                }
            });
        }

        if (Object.values(groups).length !== 0) {
            Object.values(groups).map((group, groupIndex) => {
                if (group.circleType) {
                    const { x, y } = group;
                    let circleId, circleSrc;
                    let circleWidth, circleHeight;

                    if (group.circleType !== 'large') {
                        if (group.circleType === 'small') circleId = `PSGroupBackground1-${zoomLvl}`;
                        else if (group.circleType === 'medium') circleId = `PSGroupBackground2-${zoomLvl}`;
                        else throw new Error(`Oops, unrecognized circleType ${group.circleType} in drawBackGround`);

                        circleSrc = document.getElementById(`${circleId}`)

                        circleWidth = Math.round(circleSrc.width / scaleAtCurrentZoomLevel);
                        circleHeight = Math.round(circleSrc.height / scaleAtCurrentZoomLevel);

                        if ((Math.abs((x + canX) - circleWidth / 2) <= (CAN_WIDTH) / (2 * scale) || Math.abs((x + canX) + circleWidth / 2) <= (CAN_WIDTH) / (2 * scale))
                            && (Math.abs((y + canY) - circleHeight / 2) <= (CAN_HEIGHT) / (2 * scale) || Math.abs((y + canY) + circleHeight / 2) <= (CAN_HEIGHT) / (2 * scale))) {
                            ctx.drawImage(circleSrc, x - (circleWidth / 2), y - (circleHeight / 2), circleWidth, circleHeight);
                        }
                    }
                    else {
                        circleId = `PSGroupBackground3-${zoomLvl}`
                        circleSrc = document.getElementById(`${circleId}`)

                        circleWidth = Math.round(circleSrc.width / scaleAtCurrentZoomLevel);
                        circleHeight = Math.round(circleSrc.height / scaleAtCurrentZoomLevel);

                        //Minus full image height since it's a half circle
                        if ((Math.abs((x + canX) - circleWidth / 2) <= (CAN_WIDTH) / (2 * scale) || Math.abs((x + canX) + circleWidth / 2) <= (CAN_WIDTH) / (2 * scale))
                            && (Math.abs((y + canY) - circleHeight) <= (CAN_HEIGHT) / (2 * scale) || Math.abs((y + canY) + circleHeight) <= (CAN_HEIGHT) / (2 * scale))) {
                            ctx.drawImage(circleSrc, x - (circleWidth / 2), y - circleHeight + 2 / scaleAtCurrentZoomLevel, circleWidth, circleHeight);
                            ctx.translate(x, y);
                            ctx.rotate(Math.PI);
                            ctx.drawImage(circleSrc, 0 - (circleWidth / 2) + 1 / scaleAtCurrentZoomLevel, 0 - circleHeight + 2 / scaleAtCurrentZoomLevel, circleWidth, circleHeight);
                            ctx.rotate(-Math.PI);
                            ctx.translate(-x, -y);
                        }
                    }
                }
            });
            let fillHolder = ctx.fillStyle;
            ctx.fillStyle = ctx.createPattern(document.getElementById(`Background1-${zoomLvl}`), 'repeat');
            ctx.fillRect(-(CAN_WIDTH / (2 * scale) + canX), -(CAN_HEIGHT / (2 * scale) + canY), Math.round(CAN_WIDTH / scale), Math.round(CAN_HEIGHT / scale));
            ctx.fillStyle = fillHolder;
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    drawGroup(group, zoomLvl) {
        if (group === undefined || typeof group !== 'object') throw new Error(`drawGroup needs a group object as the first argument`);
        if (zoomLvl === undefined) throw new Error(`drawGroup needs a zoomLvl as the second argument`);

        const { nodes } = this.props;
        const { keystone } = this.props.sizeConstants;
        const scaleAtCurrentZoomLevel = imageZoomLevels[zoomLvl];

        let gCanvas = document.createElement('canvas');
        gCanvas.width = 2 * Math.max(group.x - group.min_x, group.max_x - group.x) + keystone[`z${zoomLvl}`].w;
        gCanvas.height = 2 * Math.max(group.y - group.min_y, group.max_y - group.y) + keystone[`z${zoomLvl}`].h;

        let ctx = gCanvas.getContext('2d');
        ctx.clearRect(0, 0, gCanvas.width, gCanvas.height);
        // ctx.fillStyle = `#f7c8d8aa`; //Should add a debug option to enable stuff like this
        // ctx.fillRect(0, 0, gCanvas.width, gCanvas.height);

        ctx.translate(-group.x + gCanvas.width / 2, -group.y + gCanvas.height / 2);
        group.n.map((nodeId, nodeIndex) => {
            if (nodes[nodeId]) {
                const node = nodes[nodeId];
                const { icon, srcRoot, nX, nY } = node;
                const { nodeType, active, canTake } = node;
                const { arcs } = node;

                const spriteType = active !== null ? nodeType + (active ? 'Active' : 'Inactive') : nodeType;
                const srcId = srcRoot + (active === null || active ? '' : 'disabled-') + `${zoomLvl}`;

                const imgData = skillSprites[spriteType][zoomLvl];
                const coords = imgData.coords[icon];

                const src = document.getElementById(`${srcId}`);

                let destWidth = Math.round(coords.w / scaleAtCurrentZoomLevel);
                let destHeight = Math.round(coords.h / scaleAtCurrentZoomLevel);

                if (node.spc.length === 0) {
                    if (!node.isAscendancyStart)
                        ctx.drawImage(src, coords.x, coords.y, coords.w, coords.h, nX - (destWidth / 2), nY - (destHeight / 2), destWidth, destHeight);

                    if (!node.ascendancyName) {
                        let frameId, frameSrc;
                        let frameWidth, frameHeight;
                        if (nodeType === 'normal' && !node.isJewelSocket) {
                            frameId = `PSSkillFrame${active ? `Active` : canTake ? `Highlighted` : ``}-${zoomLvl}`
                            frameSrc = document.getElementById(`${frameId}`)

                            frameWidth = Math.round(frameSrc.width / scaleAtCurrentZoomLevel);
                            frameHeight = Math.round(frameSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                        }
                        else if (nodeType === 'notable') {
                            frameId = `${node.isBlighted ? `Blighted` : ``}NotableFrame${active ? `Allocated` : canTake ? `CanAllocate` : `Unallocated`}-${zoomLvl}`
                            frameSrc = document.getElementById(`${frameId}`)

                            frameWidth = Math.round(frameSrc.width / scaleAtCurrentZoomLevel);
                            frameHeight = Math.round(frameSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                        }
                        else if (nodeType === 'keystone') {
                            frameId = `KeystoneFrame${active ? `Allocated` : canTake ? `CanAllocate` : `Unallocated`}-${zoomLvl}`
                            frameSrc = document.getElementById(`${frameId}`)

                            frameWidth = Math.round(frameSrc.width / scaleAtCurrentZoomLevel);
                            frameHeight = Math.round(frameSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                        }
                        else if (node.isJewelSocket) {
                            frameId = `JewelFrame${active ? `Allocated` : canTake ? `CanAllocate` : `Unallocated`}-${zoomLvl}`
                            frameSrc = document.getElementById(`${frameId}`)

                            frameWidth = Math.round(frameSrc.width / scaleAtCurrentZoomLevel);
                            frameHeight = Math.round(frameSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(frameSrc, nX - (frameWidth / 2), nY - (frameHeight / 2), frameWidth, frameHeight);
                        }
                    }
                    else {
                        if (node.isAscendancyStart) {
                            const ascStartId = `PassiveSkillScreenAscendancyMiddle-${zoomLvl}`;
                            const ascStartSrc = document.getElementById(`${ascStartId}`);

                            const ascStartWidth = Math.round(ascStartSrc.width / scaleAtCurrentZoomLevel);
                            const ascStartHeight = Math.round(ascStartSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(ascStartSrc, nX - (ascStartWidth / 2), nY - (ascStartHeight / 2), ascStartWidth, ascStartHeight);
                        }
                        else if (nodeType === 'normal') {
                            const ascSmallId = `PassiveSkillScreenAscendancyFrameSmall${active ? `Allocated` : canTake ? `CanAllocate` : `Normal`}-${zoomLvl}`;
                            const ascSmallSrc = document.getElementById(`${ascSmallId}`);

                            const ascSmallWidth = Math.round(ascSmallSrc.width / scaleAtCurrentZoomLevel);
                            const ascSmallHeight = Math.round(ascSmallSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(ascSmallSrc, nX - (ascSmallWidth / 2), nY - (ascSmallHeight / 2), ascSmallWidth, ascSmallHeight);
                        }
                        else if (nodeType === 'notable') {
                            const ascStartId = `PassiveSkillScreenAscendancyFrameLarge${active ? `Allocated` : canTake ? `CanAllocate` : `Normal`}-${zoomLvl}`;
                            const ascStartSrc = document.getElementById(`${ascStartId}`);

                            const ascStartWidth = Math.round(ascStartSrc.width / scaleAtCurrentZoomLevel);
                            const ascStartHeight = Math.round(ascStartSrc.height / scaleAtCurrentZoomLevel);

                            ctx.drawImage(ascStartSrc, nX - (ascStartWidth / 2), nY - (ascStartHeight / 2), ascStartWidth, ascStartHeight);
                        }
                    }
                }

                ctx.globalCompositeOperation = 'destination-over';
                arcs.map((arc) => {
                    ctx.save();
                    const { orbit, radius, x, y, ø, øBetween, startId, outId, gt90 } = arc;

                    const arcId = `Orbit${orbit}${nodes[startId].active ? (nodes[outId].active ? 'Active' : 'Intermediate') : (nodes[outId].active ? 'Intermediate' : 'Normal')}-${zoomLvl}`;
                    const arcSrc = document.getElementById(`${arcId}`);

                    const arcWidth = Math.round(arcSrc.width / scaleAtCurrentZoomLevel);
                    const arcHeight = Math.round(arcSrc.height / scaleAtCurrentZoomLevel);

                    const offY = nodes[startId].active && nodes[outId].active ? 10 / imageZoomLevels[3] : 3 / imageZoomLevels[3];

                    ctx.translate(x, y);
                    ctx.rotate(ø + (Math.PI / 2));
                    ctx.beginPath();
                    ctx.moveTo(0, radius);
                    ctx.lineTo(0, 0);
                    ctx.arc(0, radius, radius + offY + 1, -(Math.PI / 2), -(Math.PI / 2) - øBetween, true);
                    ctx.clip();
                    ctx.drawImage(arcSrc, -arcWidth, -offY, arcWidth, arcHeight);

                    if (gt90) { //Draw part of another arc if ø is greater than 90 degrees
                        ctx.translate(-arcWidth, arcHeight);
                        ctx.rotate(-(Math.PI / 2));
                        ctx.drawImage(arcSrc, -(arcWidth - offY - 1), 0, arcWidth, arcHeight);
                    }

                    ctx.restore();
                });
                ctx.globalCompositeOperation = 'source-over';
            }
        });
        ctx.translate(-(-group.x + gCanvas.width / 2), -(-group.y + gCanvas.height / 2));

        if (!this.groupCanvases[group.id]) this.groupCanvases[group.id] = [];
        this.groupCanvases[group.id][zoomLvl] = gCanvas; //Could store additional properties, to minimize canvas size: eg. offset to allow just covering nodes
    }

    render() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;

        return (
            <>
                {/* <div id='zoom-debug'>{Math.floor(scale * 1000) / 1000}</div> */}
                <canvas className='skill-canvas' width={CAN_WIDTH} height={CAN_HEIGHT} ref={this.canvasRef}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeBase;