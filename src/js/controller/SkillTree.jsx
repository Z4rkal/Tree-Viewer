import React, { Component } from 'React';

import getOrbitAngle from '../lib/getOrbitAngle';

import ImageSource from '../components/ImageSource';
import TreeBase from '../canvases/TreeBase';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii } = constants;
const { imageRoot, skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;

class SkillTree extends Component {
    constructor() {
        super();

        this.state = {
            groups: {},
            nodes: {}
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
        
        this.buildNodes = this.buildNodes.bind(this);
    }

    componentDidMount() {
        this.buildNodes();
    }

    buildNodes() {
        let ourGroups = {};
        let ourNodes = {};

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

                    const radius = orbitRadii[o];
                    const numOnOrbit = skillsPerOrbit[o];

                    let ø = 90 * Math.PI / 180 - getOrbitAngle(oidx, numOnOrbit);

                    let xAdjust = radius * Math.cos(-ø);
                    let yAdjust = radius * Math.sin(-ø);

                    let nodeX = group.x + xAdjust;
                    let nodeY = group.y + yAdjust;

                    let fullString = [nodeType, node.dn, node.sd.join(' ')].join(' ');

                    //Should deep clone the node and any objects we're putting in to it to avoid side effects
                    //delete ourNodes[nodeId].icon;
                    ourNodes[nodeId].srcRoot = srcRoot;
                    ourNodes[nodeId].nodeType = nodeType;
                    ourNodes[nodeId].nX = nodeX;
                    ourNodes[nodeId].nY = nodeY;
                    //ourNodes[nodeId].coords = coords;
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
                                    x1: nodeX,
                                    y1: nodeY,
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
                                x1: nodeX,
                                y1: nodeY,
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

        this.setState({
            groups: ourGroups,
            nodes: ourNodes
        });
    }

    render() {
        const { groups, nodes } = this.state;

        return (
            <>
                <div id='tree-container'>
                    <ImageSource />
                    <TreeBase groups={groups} nodes={nodes}/>
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