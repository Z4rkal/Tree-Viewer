import React, { Component } from 'React';

import getOrbitAngle from '../lib/getOrbitAngle';

import ImageSource from '../components/ImageSource';
import TreeBase from '../canvases/TreeBase';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii } = constants;
const { imageRoot, skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;
const { min_x, max_x, min_y, max_y } = opts.passiveSkillTreeData;

class SkillTree extends Component {
    constructor() {
        super();

        this.state = {
            groups: {},
            nodes: {},
            hitPoints: {},
            sizeConstants: {}
            // canX: 0,
            // canY: 0,
            // scale: 1,
            // zoomLvl: 3,
            // isDragging: false,
            // downX: 0,
            // downY: 0,
            // offX: 0,
            // offY: 0
        };

        this.buildNodes = this.handlePreCalcs.bind(this);
        this.handleNodeClick = this.handleNodeClick.bind(this);
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
            })
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

    handleNodeClick(nodeId) {
        const { nodes } = this.state;

        if (nodes[nodeId]) {
            this.setState((state) => {
                return { nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], active: !state.nodes[nodeId].active } } }
            });
        }
    }

    render() {
        const { groups, nodes, hitPoints, sizeConstants } = this.state;

        return (
            <>
                <div id='tree-container'>
                    <ImageSource />
                    <TreeBase groups={groups} nodes={nodes} hitPoints={hitPoints} sizeConstants={sizeConstants} handleNodeClick={this.handleNodeClick} />
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
        - Circles
        - Class images
        - Ascendency images
        - Path/arc images
        - skill circles / notable borders / keystone borders
        - maybe the little path end fancies

    Add hit detection:
        - look into ctx.addHitRegion(), may need to calculate the paths and attach them to nodes ahead of time.

    Add Middle tree functionality:
        - the middle canvas is where the hover tooltips will go, hit detection needs to be working first

    Add Top tree functionality:
        - the top canvas is where the searchbar and number of points spent go in the original version, maybe not required for this
*/