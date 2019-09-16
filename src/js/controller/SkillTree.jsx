import React, { Component } from 'React';

import TreeBase from '../canvases/TreeBase';

import opts from '../../data/Tree';
const { groups, nodes, constants } = opts.passiveSkillTreeData;
const { skillsPerOrbit, orbitRadii } = constants;
const { imageRoot, skillSprites, imageZoomLevels } = opts.passiveSkillTreeData;

class SkillTree extends Component {
    constructor() {
        super();

        this.buildSprites = this.buildSprites.bind(this);
    }

    buildSprites(root, num, ext) {
        let imgs = [];

        for (let i = 0; i < num; i++) {
            imgs[i] = <img id={`${root}${i}`} src={`${imageRoot}/${root}${i}${ext}`} />
        }

        return (
            <>
                {imgs.map((img, index) =>
                    <React.Fragment key={`Sprite Sheet ${root}${index}`}>
                        {img}
                    </React.Fragment>
                )}
            </>
        )
    }

    render() {
        return (
            <>
                <div id='asset-source'>
                    {this.buildSprites('groups-', 4, '.png')}
                    {this.buildSprites('skills-', 4, '.jpg')}
                    {this.buildSprites('skills-disabled-', 4, '.jpg')}
                </div>
                <TreeBase />
            </>
        )
    }
}

export default SkillTree;