import React, { Component } from 'react';

class Readme extends Component {
    constructor() {
        super();

        this.state = {
            visible: false
        };

        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    toggleVisibility() {
        this.setState((state) => {
            return { visible: !state.visible }
        });
    }

    render() {
        const { visible } = this.state;

        if (visible)
            return (
                <>
                    <div id='readme-container'>
                        <h3 className='readme-head'>Useful Info:</h3>
                        <p className='readme-body'>
                            This web page acts as a simple skill tree planner for Grinding Gear Game's <a href='https://www.pathofexile.com/news' className='readme-link'>Path of Exile</a>.
                            You can use it to plan out your characters before the start of a league or to share builds you've been planning with other people.
                    </p>
                        <p className='readme-body'>
                            Here's how GGG describes the skill tree on the official site:
                    </p>
                        <p className='readme-body'>
                            "This is Path of Exile's passive skill tree.
                            It is a vast web of 1325 skills that provide passive bonuses to your character.
                            Each time you level up or complete certain quests, you can allocate a skill and explore deeper into the tree.
                            All character classes share the same tree, but start at different locations that are aligned with their primary specialties.
                            You're able to either focus on improving your core abilities or travel across the tree to allocate exotic skills that your class normally wouldn't have access to."
                    </p>
                        <h3 className='readme-head'>Controls:</h3>
                        <p className='readme-body'>
                            You can drag the skill tree around with your mouse or touchpad, and zoom in and out with with the scroll wheel or your touchpad's scroll command.
                    </p>
                        <p className='readme-body'>
                            While hovering your mouse over a skill node, you can click on it to allocate or deallocate it, which will add or remove it from your tree.
                    </p>
                        <p className='readme-body'>
                            You can use 'ctrl+z' or 'command+z' to undo changes to the tree, and 'shift+ctrl+z' or 'shift+command+z' to redo changes to the tree
                    </p>
                        <p className='readme-body'>
                            The dropdowns above the canvas can be used to change your starting class and ascendancy,
                            and the import and export buttons below the canvas can be used to import/export your build.
                    </p>
                        <p className='readme-body'>
                            The search field below the canvas can be used to look for specific nodes; 
                            you can type in something like 'minions deal #% increased damage' and all nodes that contain that text will be highlighted.
                            
                        </p>
                        <h3 className='readme-head'>Useful Links:</h3>
                        <p className='readme-body'>
                            <a href='https://pathofexile.gamepedia.com/Path_of_Exile_Wiki' className='readme-link'>Path of Exile Gamepedia</a>
                        </p>
                        <p className='readme-body'>
                            <a href='https://www.pathofexile.com/news' className='readme-link'>Path of Exile Official Site</a>
                        </p>
                        <button id='close-readme' className='readme-button' onClick={this.toggleVisibility}>Close</button>
                    </div>
                </>
            );

        return (
            <>
                <button id='summon-readme' className='readme-button' onClick={this.toggleVisibility}>Help</button>
            </>
        );
    }
}

export default Readme;