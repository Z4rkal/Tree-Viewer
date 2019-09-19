import React, { Component } from 'react';

import { passiveSkillTreeData } from '../../data/Tree';
const { imageRoot, assets } = passiveSkillTreeData;

const ASSET_ROOT = `https://web.poecdn.com`;

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

    fetchAssets() { //Should probably only fetch assets as they're needed
        return (
            <>
                {Object.entries(assets).map(([assetName, assetValues], assetIndex) => (
                    <React.Fragment key={`Asset: ${assetName} ${assetIndex}`}>
                        {Object.values(assetValues).map((value, valueIndex) => (
                            <img key={`Asset: ${assetName} ${assetIndex}, Value: ${valueIndex}`}
                                id={`${assetName}-${valueIndex}`} src={`${ASSET_ROOT}${value}`} />
                        ))}
                    </React.Fragment>
                ))}
            </>
        );
    }

    render() {
        return (
            <>
                <div id='asset-source'>
                    {this.buildSprites('groups-', 4, '.png')}
                    {this.buildSprites('skills-', 4, '.jpg')}
                    {this.buildSprites('skills-disabled-', 4, '.jpg')}
                    {this.fetchAssets()}
                </div>
            </>
        );
    }
}

export default ImageSource;