import React, { Component } from 'react';

import { passiveSkillTreeData } from '../../data/Tree';
const { imageRoot, assets } = passiveSkillTreeData;

const ASSET_ROOT = `https://web.poecdn.com`;

class ImageSource extends Component {
    constructor() {
        super();

        this.state = {
            spriteSources: [],
            assetSources: [],
            stillLoading: 0,
            doneBuilding: false
        };
    }

    componentDidMount() {
        this.buildSprites('groups-', 4, '.png');
        this.buildSprites('skills-', 4, '.jpg');
        this.buildSprites('skills-disabled-', 4, '.jpg');
        this.fetchAssets();

        this.setState(() => {
            return { doneBuilding: true }
        });
    }

    addToLoads() {
        this.setState((state) => {
            return { stillLoading: state.stillLoading + 1 };
        });
    }

    doneLoading() {
        this.setState((state) => {
            return { stillLoading: state.stillLoading - 1 };
        }, () => {
            const { doneBuilding, stillLoading } = this.state;

            if (doneBuilding && stillLoading === 0)
                this.props.finishedLoadingAssets();

        });
    }

    buildSprites(root, num, ext) {
        let imgs = [];

        for (let i = 0; i < num; i++) {
            this.addToLoads();
            imgs[i] = <img key={`Sprite Sheet ${root}${i}`} id={`${root}${i}`}
                src={`${imageRoot}/${root}${i}${ext}`} onLoad={() => this.doneLoading()} />
        }

        this.setState((state) => {
            return { spriteSources: [...state.spriteSources, imgs] };
        });
    }

    fetchAssets() {
        let imgs = [];
        let imgIndex = 0;

        Object.entries(assets).map(([assetName, assetValues], assetIndex) => {
            Object.values(assetValues).map((value, valueIndex) => {
                this.addToLoads();
                imgs[imgIndex] = (<img key={`Asset: ${assetName} ${assetIndex}, Value: ${valueIndex}`}
                    id={`${assetName}-${valueIndex}`} src={`${ASSET_ROOT}${value}`} onLoad={() => this.doneLoading()} />);
                imgIndex++;
            });
        });

        this.setState(() => {
            return { assetSources: imgs };
        });
    }

    renderSpriteSources() {
        const { spriteSources } = this.state;

        return (
            <>
                {spriteSources.map((img) => img)}
            </>
        )
    }

    renderAssetSources() {
        const { assetSources } = this.state;

        return (
            <>
                {assetSources.map((img) => img)}
            </>
        );
    }

    render() {
        return (
            <>
                <div id='asset-source'>
                    {this.renderSpriteSources()}
                    {this.renderAssetSources()}
                </div>
            </>
        );
    }
}

export default ImageSource;