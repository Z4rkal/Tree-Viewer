import React, { Component } from 'react';

import SkillTree from './controller/SkillTree';

class App extends Component {
    constructor() {
        super();

        this.state = {
            errorMsg: ''
        };

        this.handleCanvasScroll = this.handleCanvasScroll.bind(this);
    }

    componentDidMount() {
        //Add the listener for detecting in-canvas scrolling
        document.addEventListener('wheel', this.handleCanvasScroll, { passive: false });

        //TODO: Calculate available screen space

        //Stat tab should be left 30%? on non-mobile
        //Canvas should be able to go up to 8k height/width and still work on any browser I'm aware of, but that seems way bigger than necessary
        //Should go up to 2k maybe
    }

    componentWillUnmount() {
        document.removeEventListener('wheel', this.handleCanvasScroll, { passive: false });
    }

    handleCanvasScroll(event) {
        if (event.target.className === 'skill-canvas')
            event.preventDefault();
    }

    componentDidCatch(error) {
        console.log(error);
        this.setState(() => {
            return { errorMsg: error }
        });
    }

    clearErr() {
        this.setState(() => {
            return { errorMsg: '' }
        });
    }

    render() {
        const { errorMsg } = this.state;

        if (errorMsg)
            return (
                <div id='app-container'>
                    {`${errorMsg.name} : ${errorMsg.message}\n\n\n${errorMsg.stack}`}
                    <button id='clear-state' onClick={() => this.clearErr()}>Reset</button>
                </div>
            )

        return (
            <div id='app-container'>
                <SkillTree />
            </div>
        )
    }
}

export default App;