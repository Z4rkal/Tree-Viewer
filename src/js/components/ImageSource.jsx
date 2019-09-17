import React, { Component } from 'react';

import opts from '../../data/Tree';
const { imageRoot } = opts.passiveSkillTreeData;

class ImageSource extends Component {


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

    fetchAssets() {

    }

    render() {
        return (
            <>
                <div id='asset-source'>
                    {this.buildSprites('groups-', 4, '.png')}
                    {this.buildSprites('skills-', 4, '.jpg')}
                    {this.buildSprites('skills-disabled-', 4, '.jpg')}
                </div>
            </>
        );
    }
}

export default ImageSource;