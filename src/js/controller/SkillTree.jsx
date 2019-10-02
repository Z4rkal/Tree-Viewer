import React, { Component } from 'react';
import Cookies from 'js-cookie';

import getOrbitAngle from '../lib/getOrbitAngle';
import findLargestOrbit from '../lib/findLargestOrbit';
import decodeTreeUrl from '../lib/decodeTreeUrl';
import encodeTreeUrl from '../lib/encodeTreeUrl';

import ImageSource from '../components/ImageSource';
import PreCanvasContent from '../components/PreCanvasContent';
import TreeBase from '../canvases/TreeBase';
import TreeOverlay from '../canvases/TreeOverlay';
import PostCanvasContent from '../components/PostCanvasContent';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii, classes } = constants;
const { skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;
const { ascClasses } = opts;

const CAN_WIDTH = 916;
const CAN_HEIGHT = 742;

class SkillTree extends Component {
    constructor() {
        super();

        this.state = {
            groups: {},
            nodes: {},
            activeNodes: {},
            classStartingNodeId: 0,
            ascClassId: 0,
            ascClassname: '',
            pointsUsed: 0,
            ascPointsUsed: 0,
            banditQuestOutcome: 'Einhar',
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
            loaded: false,
            treeActionIndex: 0,
            treeActions: []
        };

        this.handleDecode = this.handleDecode.bind(this);
        this.handleEncode = this.handleEncode.bind(this);
        this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleCanvasMouseUp = this.handleCanvasMouseUp.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
        this.checkHit = this.checkHit.bind(this);
        this.handleNodeClick = this.handleNodeClick.bind(this);
        this.finishedLoadingAssets = this.finishedLoadingAssets.bind(this);
        this.resetTree = this.resetTree.bind(this);
        this.setAscClass = this.setAscClass.bind(this);
        this.toggleNode = this.toggleNode.bind(this);
        this.findPathToNode = this.findPathToNode.bind(this);
        this.findHangingNodes = this.findHangingNodes.bind(this);
        this.beginNextAction = this.beginNextAction.bind(this);
        this.keyEventHandler = this.keyEventHandler.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
    }

    componentDidMount() {
        let cb;

        //Set tree state from a cookie if it exists on load
        if (Cookies.get('last-session-tree')) {
            const lastTreeBase64 = Cookies.get('last-session-tree');
            if (lastTreeBase64 !== undefined);
            cb = () => this.handleDecode(lastTreeBase64);
        }
        this.handlePreCalcs(cb);

        if (true) { //Need to check whether the user wants cookies, but for now it's just me so I'll figure it out later
            window.onbeforeunload = () => { if (this.state.loaded) Cookies.set('last-session-tree', this.handleEncode()); };
        }

        document.addEventListener('keydown', this.keyEventHandler);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.keyEventHandler);
    }

    handleDecode(base64Str) {
        const { startingNodes, nodes } = this.state;

        const loadedTreeState = decodeTreeUrl(base64Str);
        const { startingClass, ascId, nodes: loadedNodes } = loadedTreeState;

        this.beginNextAction(() => this.resetTree(Object.values(startingNodes).find((node) => node.id === startingClass).id, () => this.setAscClass(ascId, () => loadedNodes.map((nodeId) => this.toggleNode(nodeId)))));
    }

    handleEncode() {
        const { activeNodes, startingNodes, classStartingNodeId, ascClassId } = this.state;
        return encodeTreeUrl(4, startingNodes[classStartingNodeId].id, ascClassId, activeNodes, 0);
    }

    handlePreCalcs(cb) {
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

                            let outXAdjust = radius * Math.cos(-øOut);
                            let outYAdjust = radius * Math.sin(-øOut);

                            let outNodeX = group.x + outXAdjust;
                            let outNodeY = group.y + outYAdjust;

                            let thisDist = 0;
                            for (let i = oidx; i != outNode.oidx && i < 100; i = (i + 1) % numOnOrbit) thisDist++;

                            let outDist = 0;
                            for (let i = outNode.oidx; i != oidx && i < 100; i = (i + 1) % numOnOrbit) outDist++;

                            let thisFirst = (thisDist <= outDist);

                            let øBetween = Math.abs(Math.round((thisFirst ? øOut - ø : ø - øOut) * 180 / Math.PI % 360));
                            øBetween = Math.min(øBetween, 360 - øBetween);

                            let gt90 = false;
                            if (øBetween > 90) gt90 = true;

                            øBetween = øBetween * Math.PI / 180;

                            arcs[arcId] = {
                                orbit: node.o,
                                radius: radius,
                                x: thisFirst ? outNodeX : nX,
                                y: thisFirst ? outNodeY : nY,
                                ø: thisFirst ? -øOut : -ø,
                                øBetween: øBetween,
                                startId: thisFirst ? nodeId : outId,
                                outId: thisFirst ? outId : nodeId,
                                gt90
                            };

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
                        //Unnecessary nowwww
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

                        let classId = 0;
                        let ascId = 0;
                        for (let i = 0; i < Object.keys(ascClasses).length; i++) {
                            let curClass = ascClasses[i];
                            for (let n = 1; n < 4; n++) {
                                if (curClass.classes[n] && curClass.classes[n].name === ourNodes[nodeId].ascendancyName) {
                                    classId = i;
                                    ascId = n;
                                }
                            }
                        }

                        ascStartingNodes[nodeId] = {
                            nodeId: nodeId,
                            classId,
                            ascId,
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

        if (cb === undefined) cb = () => this.resetTree(0);

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
        }, cb);
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

        for (let x = -(Math.floor(widest / 2)); x < Math.ceil(widest / 2); x++) {
            if (hitPoints[offX + x]) {
                for (let y = -(Math.floor(tallest / 2)); y < Math.ceil(tallest / 2); y++) {
                    if (hitPoints[offX + x][offY + y] && nodes[hitPoints[offX + x][offY + y]]) {
                        const node = nodes[hitPoints[offX + x][offY + y]];
                        switch (node.nodeType) {
                            case 'normal':
                                if (Math.abs(x) <= Math.round(normal[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(normal[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(node, event);
                                    return true;
                                }
                                return false;
                            case 'notable':
                                if (Math.abs(x) <= Math.round(notable[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(notable[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(node, event);
                                    return true;
                                }
                                return false;
                            case 'keystone':
                                if (Math.abs(x) <= Math.round(keystone[`z${zoomLvl}`].w / 2) && Math.abs(y) <= Math.round(keystone[`z${zoomLvl}`].h / 2)) {
                                    if (cb && typeof cb === 'function') cb(node, event);
                                    return true;
                                }
                                return false;
                            default: throw new Error(`Bad hit point value in checkHit`);
                        }
                    }
                }
            }
        }
        if (cb && typeof cb === 'function') cb(false, event);
        return false;
    }

    handleNodeClick(node) {
        if (node && node.spc.length === 0 && !node.isAscendancyStart) {

            if (node.canTake === 1 || node.isBlighted) {
                this.beginNextAction(() => this.toggleNode(node.id));
            }
            else if (node.canTake > 1) {
                //TODO: determine whether removing a node with more than one adjacent active node will break the tree
                //If it will, then remove the hanging nodes
                if (node.active) this.beginNextAction(() => this.toggleNode(node.id, () => this.findHangingNodes(this.toggleNode)));
                else this.beginNextAction(() => this.toggleNode(node.id));
            }
            else {
                //Node canTake is 0, so take every node along the shortest path to the node
                this.beginNextAction(() => this.findPathToNode(node.id, this.toggleNode));
            }
        }
    }

    toggleNode(nodeId, cb, notAction) {
        this.setState((state) => {
            const node = state.nodes[nodeId];
            if (!node) throw new Error(`Invalid Node Id: ${nodeId}`);

            const adjacentChange = !node.active ? 1 : -1;
            let activeNodes = { ...state.activeNodes };
            let nodes = { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: !state.nodes[nodeId].active } };
            let { pointsUsed, ascPointsUsed } = state;

            for (let i = 0; i < node.adjacent.length; i++) {
                const outNode = state.nodes[node.adjacent[i]];

                if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);
                if (outNode.canTake + adjacentChange < 0) throw new Error(`Tried to decrement ${outNode.id}'s canTake below 0 >:(\nNode: ${node}\nOut Node: ${JSON.stringify(outNode)}`);

                nodes[outNode.id] = { ...state.nodes[outNode.id], canTake: state.nodes[outNode.id].canTake + adjacentChange };
            }

            if (!state.startingNodes[nodeId] && !state.ascStartingNodes[nodeId]) {
                if (!nodes[nodeId].isBlighted) {
                    if (!nodes[nodeId].ascendancyName) {
                        if (nodes[nodeId].passivePointsGranted === 0) pointsUsed += adjacentChange;
                        else pointsUsed -= adjacentChange * nodes[nodeId].passivePointsGranted;
                    }
                    else {
                        if (nodes[nodeId].passivePointsGranted !== 0) pointsUsed -= adjacentChange * nodes[nodeId].passivePointsGranted;
                        ascPointsUsed += adjacentChange;
                    }
                }

                if (!state.nodes[nodeId].active) {
                    activeNodes[nodeId] = true;
                }
                else {
                    if (!activeNodes[nodeId]) throw new Error(`Tried to remove an inactive node from activeNodes`);
                    delete activeNodes[nodeId];
                }
            }

            if (notAction) {
                return {
                    nodes,
                    activeNodes,
                    pointsUsed,
                    ascPointsUsed
                }
            }

            const currentAction = state.treeActions[0] ? [...(state.treeActions[0])] : [];
            currentAction.push(nodeId);

            return {
                nodes,
                activeNodes,
                pointsUsed,
                ascPointsUsed,
                treeActions: [currentAction, ...state.treeActions.slice(1)]
            }
        }, cb);
    }

    resetTree(classId, cb) {
        this.setState((state) => {
            if (typeof classId !== 'number') {
                classId = parseInt(classId);
            }

            let nodes = { ...state.nodes };

            const targetStartingNode = Object.values(state.startingNodes).find((node) => node.id === classId);
            if (!targetStartingNode) throw new Error(`Tried to set character using invalid class Id: ${classId}`);
            const targetNode = nodes[targetStartingNode.nodeId];

            const currentAction = state.treeActions[0] ? [...(state.treeActions[0])] : [];
            Object.values(nodes).map((node) => {
                const nodeId = node.id;

                if (node.active && nodeId !== targetNode.id) {
                    nodes[nodeId] = { ...nodes[nodeId], active: false };

                    for (let i = 0; i < node.adjacent.length; i++) {
                        const outNode = nodes[node.adjacent[i]];

                        if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);
                        if (outNode.canTake - 1 < 0) throw new Error(`Tried to decrement ${outNode.id}'s canTake below 0 >:(\nNode: ${node}\nOut Node: ${JSON.stringify(outNode)}`);

                        nodes[outNode.id] = { ...nodes[outNode.id], canTake: nodes[outNode.id].canTake - 1 };
                    }

                    if (state.startingNodes[nodeId]) {
                        currentAction.push({ changeType: 'prev-class', node: nodeId, classId: state.startingNodes[nodeId].id, class: state.startingNodes[nodeId].class });
                    }
                    else if (node.isAscendancyStart) {
                        currentAction.push({ changeType: 'asc-change', node: nodeId, prevAscId: state.ascStartingNodes[nodeId].ascId, prevAscName: node.ascendancyName, newAscId: 0, newAscName: '' });
                    }
                    else currentAction.push(nodeId);
                }
                else if (nodeId === targetNode.id && !node.active) {
                    nodes[nodeId] = { ...nodes[nodeId], active: true };

                    for (let i = 0; i < node.adjacent.length; i++) {
                        const outNode = nodes[node.adjacent[i]];

                        if (!outNode) throw new Error(`Invalid Adjacent Node in handleNodeClick: ${outNode.id}`);

                        nodes[outNode.id] = { ...nodes[outNode.id], canTake: nodes[outNode.id].canTake + 1 };
                    }

                    currentAction.push({ changeType: 'new-class', node: nodeId, classId: state.startingNodes[nodeId].id, class: state.startingNodes[nodeId].class });
                }
            });

            return {
                nodes,
                activeNodes: {},
                pointsUsed: 0,
                ascPointsUsed: 0,
                classStartingNodeId: targetNode.id,
                ascClassId: 0,
                ascClassname: '',
                treeActions: [currentAction, ...state.treeActions.slice(1)]
            }
        }, cb);
    }

    setAscClass(ascId, cb) {
        const { startingNodes, ascStartingNodes, classStartingNodeId, ascClassId, nodes, activeNodes } = this.state;

        if (ascId !== ascClassId) {
            if (ascId < 0 || ascId > 3) throw new Error(`Tried to set ascendancy using invalid id: ${ascId}`);
            if (ascId !== 0) {

                const characterClass = startingNodes[classStartingNodeId];
                const ascClass = Object.values(ascStartingNodes).find((node) => node.classId === characterClass.id && node.ascId === ascId);

                if (!ascClass) throw new Error(`Failed to find ascension class for character ${characterClass.id}, with id: ${ascId}`);

                Object.keys(activeNodes).map((nodeId) => {
                    if (nodes[nodeId].ascendancyName && nodes[nodeId].active && nodes[nodeId].ascendancyName !== ascClass.ascName) this.toggleNode(nodeId);
                });

                Object.values(ascStartingNodes).map((node) => {
                    if (nodes[node.nodeId].active) this.toggleNode(node.nodeId);
                });

                this.setState(() => {
                    return {
                        ascClassId: ascId,
                        ascClassname: ascClass.ascName
                    }
                }, () => this.toggleNode(ascClass.nodeId, cb));
            }
            else {
                Object.keys(activeNodes).map((nodeId) => {
                    if (nodes[nodeId].ascendancyName && nodes[nodeId].active) this.toggleNode(nodeId);
                });

                Object.values(ascStartingNodes).map((node) => {
                    if (nodes[node.nodeId].active) this.toggleNode(node.nodeId);
                });

                this.setState(() => {
                    return {
                        ascClassId: ascId,
                        ascClassname: ''
                    }
                }, cb);
            }
        }
        else {
            if (typeof cb === 'function')
                cb();
        }
    }

    findPathToNode(nodeId, cb) {
        function findLength(nodeId, visited) {
            let curId = nodeId;
            let len = 0;

            while (visited[curId] !== 'root') {
                curId = visited[curId];
                len++;
            }

            return len;
        }

        const { nodes, startingNodes, ascClassname } = this.state;

        const startingNode = nodes[nodeId];
        if (!startingNode) throw new Error(`Invalid starting Node Id in findPathToNode: ${nodeId}`);

        let visited = { [nodeId]: 'root' };
        let queue = [nodeId];

        let found = false;
        let shortest = undefined;
        while (queue.length !== 0) {
            let curNode = nodes[queue.shift()];

            if (curNode.canTake) {
                let len = findLength(curNode.id, visited)
                if (!shortest || len < shortest[1]) {
                    shortest = [curNode.id, len];
                }
            }

            let adjLen = findLength(curNode.id, visited) + 1;
            if (!shortest || adjLen <= shortest) {
                for (let i = 0; i < curNode.adjacent.length; i++) {
                    if (!visited[curNode.adjacent[i]]) {
                        if (!startingNodes[curNode.adjacent[i]] && (!nodes[curNode.adjacent[i]].ascendancyName || nodes[curNode.adjacent[i]].ascendancyName === ascClassname)) {
                            visited[curNode.adjacent[i]] = curNode.id;
                            queue.push(nodes[curNode.adjacent[i]].id);
                        }
                    }
                    else if (curNode.adjacent[i] !== visited[curNode.id] && adjLen < findLength(curNode.adjacent[i], visited)) {
                        visited[curNode.adjacent[i]] = curNode.id;
                        if (shortest !== undefined && findLength(shortest[0]) < shortest[1]) shortest[1] = findLength(shortest[0]);
                    }
                }
            }
            if (queue.length === 0 && shortest) found = true;
        }

        if (found) {
            if (typeof cb === 'function') { //Use the callback for each node on the shortest path
                for (let pathNodeId = shortest[0]; pathNodeId !== 'root' && visited[pathNodeId]; pathNodeId = visited[pathNodeId]) {
                    cb(pathNodeId); //Goes through the path in reverse, just something to note
                }
            }
            return true;
        }

        return false;
    }

    findHangingNodes(cb) {
        const { nodes, activeNodes, classStartingNodeId, ascClassname } = this.state;

        let visited = { [classStartingNodeId]: true };
        let queue = [classStartingNodeId];

        while (queue.length !== 0) {
            let curNode = nodes[queue.shift()];
            if (!curNode || !curNode.adjacent) {
                console.log(this.state, classStartingNodeId, curNode);
            }
            for (let i = 0; i < curNode.adjacent.length; i++) {
                if ((activeNodes[curNode.adjacent[i]] || (nodes[curNode.adjacent[i]].isAscendancyStart && nodes[curNode.adjacent[i]].ascendancyName === ascClassname)) && !visited[curNode.adjacent[i]]) {
                    visited[curNode.adjacent[i]] = curNode.id;
                    queue.push(nodes[curNode.adjacent[i]].id);
                }
            }
        }

        if (typeof cb === 'function') { //Use the callback for each node on the hanging parts of the tree
            Object.keys(activeNodes).map((nodeId) => {
                if (!visited[nodeId] && !nodes[nodeId].isBlighted) {
                    cb(parseInt(nodeId));
                }
            });
        };
    }

    beginNextAction(cb) {
        this.setState((state) => {
            const { treeActions, treeActionIndex } = state;

            if (treeActionIndex !== 0) {
                return {
                    treeActions: [[], ...treeActions.slice(treeActionIndex)],
                    treeActionIndex: 0
                }
            }

            if (treeActions.length >= 20) {
                return {
                    treeActions: [[], ...treeActions.slice(0, treeActions.length - 1)]
                }
            }

            return {
                treeActions: [[], ...treeActions]
            }
        }, cb);
    }

    keyEventHandler(event) {
        if (event.target.localName !== 'input' && event.key === 'z' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.handleUndo();
        }
        else if (event.target.localName !== 'input' && event.key === 'Z' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.handleRedo();
        }
    }


    handleUndo() {
        this.setState((state) => {
            const { treeActions, treeActionIndex } = state;

            if (treeActionIndex + 1 < treeActions.length) {
                const currentAction = [...treeActions[treeActionIndex]];
                let { classStartingNodeId, ascClassId, ascClassname } = state;

                currentAction.map((action) => {
                    if (typeof action === 'object') {
                        switch (action.changeType) {
                            case 'prev-class':
                                classStartingNodeId = action.node;
                                break;
                            case 'new-class':
                                break;
                            case 'asc-change':
                                ascClassId = action.prevAscId;
                                ascClassname = action.prevAscName;
                                break;
                        }
                        this.toggleNode(action.node, null, true);
                    }
                    else if (typeof action === 'number') {
                        this.toggleNode(action, null, true);
                    }
                    else throw new Error(`Bad action (${action}, type: ${typeof action}) in handleUndo`);
                });

                return {
                    classStartingNodeId,
                    ascClassId,
                    ascClassname,
                    treeActionIndex: state.treeActionIndex + 1
                }
            }

            return null;
        });
    }

    handleRedo() {
        this.setState((state) => {
            const { treeActions, treeActionIndex } = state;

            if (treeActionIndex - 1 >= 0) {
                const currentAction = [...treeActions[treeActionIndex - 1]];
                let { classStartingNodeId, ascClassId, ascClassname } = state;

                currentAction.map((action) => {
                    if (typeof action === 'object') {
                        switch (action.changeType) {
                            case 'prev-class':
                                break;
                            case 'new-class':
                                classStartingNodeId = action.node;
                                break;
                            case 'asc-change':
                                ascClassId = action.newAscId;
                                ascClassname = action.newAscName;
                                break;
                        }
                        this.toggleNode(action.node, null, true);
                    }
                    else if (typeof action === 'number') {
                        this.toggleNode(action, null, true);
                    }
                    else throw new Error(`Bad action (${action}) in handleRedo`);
                });

                return {
                    classStartingNodeId,
                    ascClassId,
                    ascClassname,
                    treeActionIndex: state.treeActionIndex - 1
                }
            }

            return null;
        });
    }

    render() {
        const { groups, nodes, startingNodes, ascStartingNodes, hitPoints, sizeConstants, loaded } = this.state;
        const { canX, canY, scale, zoomLvl, isDragging, canClick } = this.state;
        const { pointsUsed, ascPointsUsed, classStartingNodeId, ascClassId } = this.state;

        return (
            <>
                <div id='tree-container'>
                    <ImageSource finishedLoadingAssets={this.finishedLoadingAssets} />
                    <div id='upper-tree-space' className='tree-row'>
                        <PreCanvasContent startingNodes={startingNodes} ascStartingNodes={ascStartingNodes} ascClassId={ascClassId} classStartingNodeId={classStartingNodeId} pointsUsed={pointsUsed} ascPointsUsed={ascPointsUsed} loaded={loaded}
                            beginNextAction={this.beginNextAction} resetTree={this.resetTree} setAscClass={this.setAscClass} />
                    </div>
                    <div id='tree-canvas-container' className='tree-row' style={{ width: `${CAN_WIDTH}px`, height: `${CAN_HEIGHT}px` }}>
                        <TreeBase CAN_WIDTH={CAN_WIDTH} CAN_HEIGHT={CAN_HEIGHT}
                            groups={groups} nodes={nodes} startingNodes={startingNodes} ascStartingNodes={ascStartingNodes} hitPoints={hitPoints} sizeConstants={sizeConstants} loaded={loaded}
                            canX={canX} canY={canY} scale={scale} zoomLvl={zoomLvl} />
                        <TreeOverlay CAN_WIDTH={CAN_WIDTH} CAN_HEIGHT={CAN_HEIGHT}
                            nodes={nodes} hitPoints={hitPoints} sizeConstants={sizeConstants} loaded={loaded}
                            canX={canX} canY={canY} scale={scale} zoomLvl={zoomLvl} isDragging={isDragging} canClick={canClick}
                            handleCanvasMouseDown={this.handleCanvasMouseDown} handleDrag={this.handleDrag} handleCanvasMouseUp={this.handleCanvasMouseUp} handleZoom={this.handleZoom} checkHit={this.checkHit} handleNodeClick={this.handleNodeClick}
                            findPathToNode={this.findPathToNode} />
                    </div>
                    <div id='lower-tree-space' className='tree-row'>
                        <PostCanvasContent loaded={loaded}
                            handleDecode={this.handleDecode} handleEncode={this.handleEncode} />
                    </div>
                </div>
            </>
        )
    }
}

export default SkillTree;

//TODO: First Week, all done more or less
/*
    Pre-format some data to cut down on calculations:
        - node :
                -- Priority --
            - *DONE* add boolean for being activated
            - *DONE* calculate node type, maybe get rid of some of the booleans since they should be obsolete afterward
            - *DONE* calculate position based on group once
            - *DONE* calculate coordinates for in-group arcs and paths
                -- Secondary --
            - *DONE* add string containing name and stats for eventual search purposes
            - add object describing stats for eventual skill calculator stuff
            - *DONE* calculate position for out-group paths

    Find the rest of the assets: *DONE*
        - *DONE* Circles
        - *DONE* Class images
        - *DONE* Ascendency images
        - *DONE* Path images
        - *DONE* Arc images
        - *DONE* skill circles / notable borders / keystone borders
        - *DONE* maybe the little path end fancies

    Add hit detection: *DONE*
        - look into ctx.addHitRegion(), may need to calculate the paths and attach them to nodes ahead of time.

    Add overlay functionality *DONE*:
        - the second canvas is where the hover tooltips will go, hit detection needs to be working first
*/

//TODO
/*
    *DONE* Implement BFS algorithm for finding paths to nodes
        - Probably start from the destination node, and go until it finds a node the user can take -> node.canTake > 0

    *DONE* Implement another graph traversal algorithm to clear hanging nodes when the user deselects a node

    Expand the hitboxes around nodes to be the size of their frame, they feel way too small right now

    *DONE* Add undo/redo? -> Might want to move away from nested setState calls, but from my current testing it seems to work fine and just spook react
        -Shouldn't be too hard to do, just build an array with nodes that were toggled since the last action

    Make sure that a broken cookie can't dismantle everything and stop the app from working

    Add a cookie yes/no prompt, or swap from automatically saving on exit to using save slots and a save/saveas button

    Add character stats around the starting plaque

    Next Steps: Weeks 3/4
        --Primary: Start working on the stat handler
            -Decide how it'll interact with SkillTree
                -Current thoughts: have it sit above the skill tree and get updates whenever a node is toggled
                    -Could have a handleNodeChange function passed down as a prop, and call it with the node being toggled
                    and a boolean for whether the node is being taken or removed inside of the updater toggleNode creates

        --Secondary: Optimization for existing stuff
            -Do an optimization pass on SkillTree.jsx methods
                -I've optimized the canvas a fair bit since I got it working, but most of the SkillTree methods are unecessarily
                expensive and haven't been touched since I slapped them together
            -Optimize the Base Canvas some more:
                -Could make one clip region per group that covers all the arcs to cut down on ctx.save/restore even further
                    -ctx.save and ctx.restore are the --wooorst-- when it comes to performance, but there's somehow no alternatives
                    for clearing clip regions (whyyyy????)
                -Figure out how to save the image into tiles and only update the tiles when necessary, then simply draw the
                tiles as the canvas is moved/zoomed around
                    -seems like a big task, but should be a sizable performance boost over drawing all the paths
                    and especially arcs every single update
*/