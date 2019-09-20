import React, { Component } from 'React';

import getOrbitAngle from '../lib/getOrbitAngle';
import findLargestOrbit from '../lib/findLargestOrbit';

import ImageSource from '../components/ImageSource';
import TreeBase from '../canvases/TreeBase';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii, classes } = constants;
const { skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;
const { ascClasses } = opts;


class SkillTree extends Component {
    constructor() {
        super();

        this.state = {
            groups: {},
            nodes: {},
            startingNodes: {},
            ascStartingNodes: {},
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
        this.resetTree = this.resetTree.bind(this);
        this.setCharacter = this.setCharacter.bind(this);
    }

    componentDidMount() {
        this.handlePreCalcs();
    }

    handlePreCalcs() {
        let ourGroups = {};
        let ourNodes = {};
        let startingNodes = {};
        let ascStartingNodes = {};
        let hitPoints = {};

        let initialActiveClass;
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

                    if (!ourNodes[nodeId])
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
                    ourNodes[nodeId].canTake = 0;

                    if (!ourNodes[nodeId].adjacent)
                        ourNodes[nodeId].adjacent = [];

                    let arcs = [];
                    let paths = [];
                    let arcId = 0;
                    let pathId = 0;
                    out.map((outId) => {
                        const outNode = nodes[outId];
                        if (!ourNodes[outId])
                            ourNodes[outId] = nodes[outId];

                        if (!ourNodes[outId].adjacent)
                            ourNodes[outId].adjacent = [];

                        if (ourNodes[outId].adjacent.find((value) => value === nodeId) === undefined)
                            ourNodes[outId].adjacent.push(nodeId);

                        if (ourNodes[nodeId].adjacent.find((value) => value === outId) === undefined)
                            ourNodes[nodeId].adjacent.push(outId);

                        if (outNode.g === node.g && outNode.o === node.o) {
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
                                    aClock: false,
                                    startId: nodeId,
                                    outId: outId
                                };
                            }

                            arcId++;
                        }
                        else if (!((!outNode.ascendancyName && node.ascendancyName) || (outNode.ascendancyName && !node.ascendancyName)) && (outNode.spc.length === 0 && node.spc.length === 0)) {
                            const outGroup = groups[outNode.g];

                            const outRadius = orbitRadii[outNode.o];
                            const outNumOnOrbit = skillsPerOrbit[outNode.o];

                            let ø = 90 * Math.PI / 180 - getOrbitAngle(outNode.oidx, outNumOnOrbit);

                            let outXAdjust = outRadius * Math.cos(-ø);
                            let outYAdjust = outRadius * Math.sin(-ø);

                            let outNodeX = outGroup.x + outXAdjust;
                            let outNodeY = outGroup.y + outYAdjust;

                            let øPath = Math.atan2(outNodeY - nY, outNodeX - nX);
                            let pathLength = Math.sqrt(Math.pow(outNodeY - nY, 2) + Math.pow(outNodeX - nX, 2));

                            paths[pathId] = {
                                x1: nX,
                                y1: nY,
                                w: pathLength,
                                ø: øPath,
                                startId: nodeId,
                                outId: outId
                            }

                            pathId++;
                        }
                    });

                    ourNodes[nodeId].arcs = arcs;
                    ourNodes[nodeId].paths = paths;

                    if (!ourGroups[groupKey].isAscendancy && ourNodes[nodeId].ascendancyName)
                        ourGroups[groupKey].isAscendancy = true;

                    if (ourNodes[nodeId].spc.length !== 0) {
                        if (!ourGroups[groupKey].hasStartingNode)
                            ourGroups[groupKey].hasStartingNode = true;

                        if (ourNodes[nodeId].spc.length > 1) console.log(`Nodes can have more than one starting node apparently`);

                        let nodeClass = Object.entries(classes).find(([classDesignation, classNumber]) => classNumber === ourNodes[nodeId].spc[0]);

                        if (nodeClass[1] === opts.startClass) initialActiveClass = nodeId;

                        switch (nodeClass[0].replace(/Class$/, ``)) {
                            case 'Str':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Marauder',
                                    activeImageRoot: 'centermarauder'
                                }
                                break;
                            case 'Dex':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Ranger',
                                    activeImageRoot: 'centerranger'
                                }
                                break;
                            case 'Int':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Witch',
                                    activeImageRoot: 'centerwitch'
                                }
                                break;
                            case 'StrDex':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Duelist',
                                    activeImageRoot: 'centerduelist'
                                }
                                break;
                            case 'StrInt':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Templar',
                                    activeImageRoot: 'centertemplar'
                                }
                                break;
                            case 'DexInt':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Shadow',
                                    activeImageRoot: 'centershadow'
                                }
                                break;
                            case 'StrDexInt':
                                startingNodes[nodeId] = {
                                    nodeId: nodeId,
                                    id: nodeClass[1],
                                    class: 'Scion',
                                    activeImageRoot: 'centerscion'
                                }
                                break;
                            default: throw new Error(`Something went wrong with determining the class type: nodeClass: ${nodeClass}`);
                        }
                    }

                    if (ourNodes[nodeId].isAscendancyStart) {
                        ascStartingNodes[nodeId] = {
                            nodeId: nodeId,
                            ascName: ourNodes[nodeId].ascendancyName
                        }
                    }
                }
            });

            if (!ourGroups[groupKey].isAscendancy)
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

        this.setState(() => {
            return {
                groups: ourGroups,
                nodes: ourNodes,
                startingNodes: startingNodes,
                ascStartingNodes: ascStartingNodes,
                hitPoints: hitPoints,
                sizeConstants: {
                    widest: widest,
                    tallest: tallest,
                    normal: normal,
                    notable: notable,
                    keystone: keystone
                }
            }
        }, () => {
            if (initialActiveClass === undefined) {
                console.log('Undefined Initial Active Class');
                try {
                    initialActiveClass = Object.values(ourNodes).find((node) => node.spc.length !== 0 && node.spc[0] === 0).id;
                }
                catch (error) {
                    throw new Error(`Something is pretty wrong, couldn't find an initial starting node to activate`);
                }
            }

            this.setCharacter(initialActiveClass);
        });
    }

    finishedLoadingAssets() {
        if (this.state.loaded) throw new Error(`Got loading done alert twice >:(`);

        this.setState(() => {
            return { loaded: true };
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
        const node = nodes[nodeId];

        if (node && node.spc.length === 0 && !node.isAscendancyStart) {
            if (node.canTake === 1 || node.isBlighted) {
                const adjacentChange = !node.active ? 1 : -1;

                this.setState((state) => {
                    return { nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: !state.nodes[nodeId].active } } }
                });

                for (let i = 0; i < node.adjacent.length; i++) {
                    this.setState((state) => {
                        const outNode = state.nodes[node.adjacent[i]];

                        if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);
                        if (outNode.canTake + adjacentChange < 0) throw new Error(`Tried to decrement ${outNode.id}'s canTake below 0 >:(`);

                        return { nodes: { ...state.nodes, [outNode.id]: { ...state.nodes[outNode.id], canTake: state.nodes[outNode.id].canTake + adjacentChange } } }
                    });
                }
            }
            else if (node.canTake > 1) {
                //TODO: determine whether removing a node with more than one adjacent active node will break the tree
                //If it will, then remove the hanging nodes
                const adjacentChange = !node.active ? 1 : -1;

                this.setState((state) => {
                    return { nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: !state.nodes[nodeId].active } } }
                });

                for (let i = 0; i < node.adjacent.length; i++) {
                    this.setState((state) => {
                        const outNode = state.nodes[node.adjacent[i]];

                        if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);
                        if (outNode.canTake + adjacentChange < 0) throw new Error(`Tried to decrement ${outNode.id}'s canTake below 0 >:(`);

                        return { nodes: { ...state.nodes, [outNode.id]: { ...state.nodes[outNode.id], canTake: state.nodes[outNode.id].canTake + adjacentChange } } }
                    });
                }
            }
            else {
                //Node canTake is 0, TODO: write algorithm for taking shortest path to node
            }
        }
    }

    resetTree() {
        const { nodes } = this.state;

        Object.values(nodes).map((node) => {
            this.setState((state) => {
                return { nodes: { ...state.nodes, [node.id]: { ...state.nodes[node.id], active: !state.nodes[node.id].m ? false : null, canTake: 0 } } }
            });
        });
    }

    setCharacter(nodeId) {
        const { nodes } = this.state;

        console.log(nodes[nodeId]);
        if (nodes[nodeId] && nodes[nodeId].spc.length !== 0) {
            if (nodes[nodeId].active === false) {
                this.resetTree();

                const node = nodes[nodeId];
                const adjacentChange = 1;

                this.setState((state) => {
                    return { nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: true } } }
                });

                for (let i = 0; i < node.adjacent.length; i++) {
                    this.setState((state) => {
                        const outNode = state.nodes[node.adjacent[i]];

                        if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);
                        if (outNode.canTake + adjacentChange < 0) throw new Error(`Tried to decrement ${outNode.id}'s canTake below 0 >:(`);

                        return { nodes: { ...state.nodes, [outNode.id]: { ...state.nodes[outNode.id], canTake: state.nodes[outNode.id].canTake + adjacentChange } } }
                    });
                }
            }
        }
        else throw new Error(`Tried to set character using invalid node: ${nodeId}`);
    }

    render() {
        const { groups, nodes, startingNodes, ascStartingNodes, hitPoints, sizeConstants, loaded } = this.state;
        const { canX, canY, scale, zoomLvl, isDragging, canClick } = this.state;

        return (
            <>
                <div id='tree-container'>
                    <ImageSource finishedLoadingAssets={this.finishedLoadingAssets} />
                    <TreeBase groups={groups} nodes={nodes} startingNodes={startingNodes} ascStartingNodes={ascStartingNodes} hitPoints={hitPoints} sizeConstants={sizeConstants} loaded={loaded}
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
        - *DONE* Class images
        - *DONE* Ascendency images
        - *DONE* Path images
        - Arc images
        - *DONE* skill circles / notable borders / keystone borders
        - *DONE* maybe the little path end fancies

    Add hit detection: *DONE*
        - look into ctx.addHitRegion(), may need to calculate the paths and attach them to nodes ahead of time.

    Add Middle tree functionality:
        - the middle canvas is where the hover tooltips will go, hit detection needs to be working first

    Add Top tree functionality:
        - the top canvas is where the searchbar and number of points spent go in the original version, maybe not required for this
*/