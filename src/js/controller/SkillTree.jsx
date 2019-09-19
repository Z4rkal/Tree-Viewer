import React, { Component } from 'React';

import getOrbitAngle from '../lib/getOrbitAngle';
import findLargestOrbit from '../lib/findLargestOrbit';

import ImageSource from '../components/ImageSource';
import TreeBase from '../canvases/TreeBase';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii } = constants;
const { skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;


class SkillTree extends Component {
    constructor() {
        super();

        this.state = {
            groups: {},
            nodes: {},
            hitPoints: {},
            sizeConstants: {},
            canX: 0,
            canY: 0,
            scale: 0.1,
            zoomLvl: 0,
            isDragging: false,
            canClick: false,
            latestCursorX: 0,
            latestCursorY: 0,
            loaded: false
        };

        this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleCanvasMouseUp = this.handleCanvasMouseUp.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
        this.checkHit = this.checkHit.bind(this);
        this.handleNodeClick = this.handleNodeClick.bind(this);
        this.finishedLoadingAssets = this.finishedLoadingAssets.bind(this);
    }

    componentDidMount() {
        this.handlePreCalcs();
    }

    handlePreCalcs() {
        let ourGroups = {};
        let ourNodes = {};
        let hitPoints = {};

        let normal = false;
        let notable = false;
        let keystone = false;
        Object.entries(groups).map(([groupKey, group]/*,groupIndex*/) => {
            ourGroups[groupKey] = groups[groupKey]; //Should do a deep clone probably
            group.n.map((nodeId/*,nodeIndex*/) => {
                if (nodes[nodeId]) {

                    /* example node
                    "30225": {
                        "id": 30225, 
                        "icon": "Art\/2DArt\/SkillIcons\/passives\/stormborn.png", 
                        "ks": false, 
                        "not": true, 
                        "dn": "Lightning Walker", 
                        "m": false, 
                        "isJewelSocket": false, 
                        "isMultipleChoice": false, 
                        "isMultipleChoiceOption": false, 
                        "passivePointsGranted": 0, 
                        "spc": [], 
                        "sd": ["25% increased Lightning Damage", "5% increased Cast Speed with Lightning Skills", "+15% to Lightning Resistance"], 
                        "g": 1, 
                        "o": 0, 
                        "oidx": 0, 
                        "sa": 0, 
                        "da": 0, 
                        "ia": 0, 
                        "out": [58604, 4184], 
                        "in": []
                    }
                    */

                    const node = nodes[nodeId];
                    const { icon, o, oidx } = node;
                    const { ks, not, m } = node;
                    const { out } = node;

                    ourNodes[nodeId] = node;

                    const nodeType = m ? 'mastery' : ks ? 'keystone' : not ? 'notable' : 'normal';// + (!m ? 'Active' : '');
                    const srcRoot = (m ? 'groups-' : 'skills-');// + `${zoomLvl}`;

                    //const coords = skillSprites[nodeType][zoomLvl].coords[icon];
                    let z0, z1, z2, z3;
                    if (!m) {
                        z0 = { ...skillSprites[`${nodeType}Active`][0].coords[icon] };

                        z1 = { ...skillSprites[`${nodeType}Active`][1].coords[icon] };

                        z2 = { ...skillSprites[`${nodeType}Active`][2].coords[icon] };

                        z3 = { ...skillSprites[`${nodeType}Active`][3].coords[icon] };
                    }
                    else {
                        z0 = { ...skillSprites[`${nodeType}`][0].coords[icon] };

                        z1 = { ...skillSprites[`${nodeType}`][1].coords[icon] };

                        z2 = { ...skillSprites[`${nodeType}`][2].coords[icon] };

                        z3 = { ...skillSprites[`${nodeType}`][3].coords[icon] };
                    }

                    //Get node size measurments for hit calculations
                    if (!normal && nodeType === 'normal') {
                        normal = {
                            z0: { w: Math.round(z0.w / imageZoomLevels[0]), h: Math.round(z0.h / imageZoomLevels[0]) },
                            z1: { w: Math.round(z1.w / imageZoomLevels[1]), h: Math.round(z1.h / imageZoomLevels[1]) },
                            z2: { w: Math.round(z2.w / imageZoomLevels[2]), h: Math.round(z2.h / imageZoomLevels[2]) },
                            z3: { w: Math.round(z3.w / imageZoomLevels[3]), h: Math.round(z3.h / imageZoomLevels[3]) }
                        }
                        //console.log('normal', normal);
                    }
                    if (!notable && nodeType === 'notable') {
                        notable = {
                            z0: { w: Math.round(z0.w / imageZoomLevels[0]), h: Math.round(z0.h / imageZoomLevels[0]) },
                            z1: { w: Math.round(z1.w / imageZoomLevels[1]), h: Math.round(z1.h / imageZoomLevels[1]) },
                            z2: { w: Math.round(z2.w / imageZoomLevels[2]), h: Math.round(z2.h / imageZoomLevels[2]) },
                            z3: { w: Math.round(z3.w / imageZoomLevels[3]), h: Math.round(z3.h / imageZoomLevels[3]) }
                        }
                        //console.log('notable', notable);
                    }
                    if (!keystone && nodeType === 'keystone') {
                        keystone = {
                            z0: { w: Math.round(z0.w / imageZoomLevels[0]), h: Math.round(z0.h / imageZoomLevels[0]) },
                            z1: { w: Math.round(z1.w / imageZoomLevels[1]), h: Math.round(z1.h / imageZoomLevels[1]) },
                            z2: { w: Math.round(z2.w / imageZoomLevels[2]), h: Math.round(z2.h / imageZoomLevels[2]) },
                            z3: { w: Math.round(z3.w / imageZoomLevels[3]), h: Math.round(z3.h / imageZoomLevels[3]) }
                        }
                        //console.log('keystone', keystone);
                    }

                    const radius = orbitRadii[o];
                    const numOnOrbit = skillsPerOrbit[o];

                    let ø = 90 * Math.PI / 180 - getOrbitAngle(oidx, numOnOrbit);

                    let xAdjust = radius * Math.cos(-ø);
                    let yAdjust = radius * Math.sin(-ø);

                    let nX = group.x + xAdjust;
                    let nY = group.y + yAdjust;

                    let fullString = [nodeType, node.dn, node.sd.join(' ')].join(' ');

                    if (!m) { //No hitboxes for mastery sprites
                        //Build hitboxes, just use a single point to save memory
                        let intX = Math.round(nX);
                        let intY = Math.round(nY);

                        if (!hitPoints[intX]) hitPoints[intX] = {};
                        hitPoints[intX][intY] = nodeId;
                    }


                    //Should deep clone the node and any objects we're putting in to it to avoid side effects
                    ourNodes[nodeId].srcRoot = srcRoot;
                    ourNodes[nodeId].nodeType = nodeType;
                    ourNodes[nodeId].nX = nX;
                    ourNodes[nodeId].nY = nY;
                    ourNodes[nodeId].coords = [z0, z1, z2, z3];
                    ourNodes[nodeId].ø = ø;
                    ourNodes[nodeId].fullString = fullString;
                    ourNodes[nodeId].active = !m ? false : null;

                    let arcs = [];
                    let paths = [];
                    let arcId = 0;
                    let pathId = 0;
                    out.map((outId) => {
                        const outNode = nodes[outId];
                        if (outNode.g === node.g) {
                            if (outNode.o === node.o) {
                                let øOut = 90 * Math.PI / 180 - getOrbitAngle(outNode.oidx, numOnOrbit);

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

                                if (clockDist > antiDist) {
                                    arcs[arcId] = {
                                        x: group.x,
                                        y: group.y,
                                        radius,
                                        øStart: -ø,
                                        øEnd: -øOut,
                                        aClock: true
                                    };
                                }
                                else {
                                    arcs[arcId] = {
                                        x: group.x,
                                        y: group.y,
                                        radius,
                                        øStart: -ø,
                                        øEnd: -øOut,
                                        aClock: false
                                    };
                                }

                                arcId++;
                            }
                            else {
                                const outRadius = orbitRadii[outNode.o];
                                const outNumOnOrbit = skillsPerOrbit[outNode.o];

                                let ø = 90 * Math.PI / 180 - getOrbitAngle(outNode.oidx, outNumOnOrbit);

                                let outXAdjust = outRadius * Math.cos(-ø);
                                let outYAdjust = outRadius * Math.sin(-ø);

                                let outNodeX = group.x + outXAdjust;
                                let outNodeY = group.y + outYAdjust;

                                paths[pathId] = {
                                    x1: nX,
                                    y1: nY,
                                    x2: outNodeX,
                                    y2: outNodeY
                                }

                                pathId++;
                            }
                        }
                        else if (!((!outNode.ascendancyName && node.ascendancyName) || (outNode.ascendancyName && !node.ascendancyName))) {
                            const outGroup = groups[outNode.g];

                            const outRadius = orbitRadii[outNode.o];
                            const outNumOnOrbit = skillsPerOrbit[outNode.o];

                            let ø = 90 * Math.PI / 180 - getOrbitAngle(outNode.oidx, outNumOnOrbit);

                            let outXAdjust = outRadius * Math.cos(-ø);
                            let outYAdjust = outRadius * Math.sin(-ø);

                            let outNodeX = outGroup.x + outXAdjust;
                            let outNodeY = outGroup.y + outYAdjust;

                            paths[pathId] = {
                                x1: nX,
                                y1: nY,
                                x2: outNodeX,
                                y2: outNodeY
                            }

                            pathId++;
                        }
                    });

                    ourNodes[nodeId].arcs = arcs;
                    ourNodes[nodeId].paths = paths;
                }

                if (!ourGroups[groupKey].isAscendancy && ourNodes[nodeId].ascendancyName)
                    ourGroups[groupKey].isAscendancy = true;

                if (!ourGroups[groupKey].hasStartingNode && ourNodes[nodeId].spc.length !== 0)
                    ourGroups[groupKey].hasStartingNode = true;
            });

            if (!ourGroups[groupKey].isAscendancy && !ourGroups[groupKey].hasStartingNode)
                ourGroups[groupKey].circleType = findLargestOrbit(group.oo);
        });

        let widest = 0;
        let tallest = 0;

        for (let i = 0; i < 4; i++) {
            if (normal[`z${i}`].w > widest) widest = normal[`z${i}`].w;
            if (normal[`z${i}`].h > tallest) tallest = normal[`z${i}`].h;
            if (notable[`z${i}`].w > widest) widest = notable[`z${i}`].w;
            if (notable[`z${i}`].h > tallest) tallest = notable[`z${i}`].h;
            if (keystone[`z${i}`].w > widest) widest = keystone[`z${i}`].w;
            if (keystone[`z${i}`].h > tallest) tallest = keystone[`z${i}`].h;
        }

        //console.log(`Widest: ${widest}, Tallest: ${tallest}`);

        this.setState({
            groups: ourGroups,
            nodes: ourNodes,
            hitPoints: hitPoints,
            sizeConstants: {
                widest: widest,
                tallest: tallest,
                normal: normal,
                notable: notable,
                keystone: keystone
            }
        });
    }

    handleCanvasMouseDown(event) {
        let eventX = event.nativeEvent.offsetX;
        let eventY = event.nativeEvent.offsetY;

        this.setState(() => {
            return {
                isDragging: true,
                canClick: true,
                latestCursorX: eventX,
                latestCursorY: eventY
            }
        });
    }

    handleDrag(event) {
        const { latestCursorX, latestCursorY, canClick } = this.state;

        if (canClick === false || Math.abs(event.nativeEvent.offsetX - latestCursorX) >= 10 || Math.abs(event.nativeEvent.offsetY - latestCursorY) >= 10) {
            let eventX = event.nativeEvent.offsetX;
            let eventY = event.nativeEvent.offsetY;

            this.setState((state) => {
                return {
                    canClick: false,
                    canX: state.canX + (eventX - state.latestCursorX) * 2 / state.scale,
                    canY: state.canY + (eventY - state.latestCursorY) * 2 / state.scale,
                    latestCursorX: eventX,
                    latestCursorY: eventY
                };
            });
        }
    }

    handleCanvasMouseUp(event) {
        const { latestCursorX, latestCursorY } = this.state;

        let eventX = event.nativeEvent.offsetX;
        let eventY = event.nativeEvent.offsetY;

        this.setState((state) => {
            return {
                isDragging: false,
                canX: !state.canClick ? state.canX + (eventX - latestCursorX) * 2 / state.scale : state.canX,
                canY: !state.canClick ? state.canY + (eventY - latestCursorY) * 2 / state.scale : state.canY
            };
        });
    }

    handleZoom(event) {
        const { scale } = this.state;

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

        this.setState(() => {
            return {
                scale: newScale,
                zoomLvl: newZoom
            }
        });
    }

    checkHit(event, cb) {
        const { canX, canY, scale, zoomLvl } = this.state;
        const { hitPoints, nodes } = this.state;
        const { widest, tallest, normal, notable, keystone } = this.state.sizeConstants;

        let offX = Math.round((event.nativeEvent.offsetX - ((916 / 2) + (canX * scale))) / scale);
        let offY = Math.round((event.nativeEvent.offsetY - ((767 / 2) + (canY * scale))) / scale);

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

    handleNodeClick(nodeId) { //TODO: Check that node can be taken --> LATER: Take all nodes on shortest path to node if possible
        const { nodes } = this.state;

        if (nodes[nodeId] && nodes[nodeId].spc.length === 0) {
            this.setState((state) => {
                return { nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: !state.nodes[nodeId].active } } }
            });
        }
    }

    finishedLoadingAssets() {
        if (this.state.loaded) throw new Error(`Got loading done alert twice >:(`);

        this.setState(() => {
            return { loaded: true };
        });
    }

    render() {
        const { groups, nodes, hitPoints, sizeConstants, loaded } = this.state;
        const { canX, canY, scale, zoomLvl, isDragging, canClick } = this.state;

        return (
            <>
                <div id='tree-container'>
                    <ImageSource finishedLoadingAssets={this.finishedLoadingAssets} />
                    <TreeBase groups={groups} nodes={nodes} hitPoints={hitPoints} sizeConstants={sizeConstants} loaded={loaded}
                        canX={canX} canY={canY} scale={scale} zoomLvl={zoomLvl} isDragging={isDragging} canClick={canClick}
                        handleCanvasMouseDown={this.handleCanvasMouseDown} handleDrag={this.handleDrag} handleCanvasMouseUp={this.handleCanvasMouseUp} handleZoom={this.handleZoom} checkHit={this.checkHit} handleNodeClick={this.handleNodeClick} />
                </div>
            </>
        )
    }
}

export default SkillTree;

//TODO:
/*
    Pre-format some data to cut down on calculations:
        - node :
                -- Priority --
            - *DONE* add boolean for being activated
            - *DONE* calculate node type, maybe get rid of some of the booleans since they should be obsolete afterwards
            - replace 'icon' property with object describing which source to pull from and containing coords from the skillSprites object
            - *DONE* calculate position based on group once
            - *DONE* calculate coordinates for in-group arcs and paths
                -- Secondary --
            - *DONE* add string containing name and stats for eventual search purposes
            - add object describing stats for eventual skill calculator stuff
            - *DONE* calculate position for out-group paths

    Find the rest of the assets:
        - *DONE* Circles
        - Class images
        - Ascendency images
        - Path/arc images
        - *DONE* skill circles / notable borders / keystone borders
        - maybe the little path end fancies

    Add hit detection: *DONE*
        - look into ctx.addHitRegion(), may need to calculate the paths and attach them to nodes ahead of time.

    Add Middle tree functionality:
        - the middle canvas is where the hover tooltips will go, hit detection needs to be working first

    Add Top tree functionality:
        - the top canvas is where the searchbar and number of points spent go in the original version, maybe not required for this
*/