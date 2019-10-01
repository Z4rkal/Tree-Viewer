import React, { Component } from 'react';

import SkillTree from './controller/SkillTree';

class App extends Component {
    constructor() {
        super();

        this.handleCanvasScroll = this.handleCanvasScroll.bind(this);
    }

    componentDidMount() {
        document.addEventListener('wheel', this.handleCanvasScroll, { passive: false });
    }

    componentWillUnmount() {
        document.removeEventListener('wheel', this.handleCanvasScroll, { passive: false });
    }

    handleCanvasScroll(event) {
        if (event.target.className === 'skill-canvas')
            event.preventDefault();
    }

    render() {
        return (
            <div id='app-container'>
                <SkillTree />
            </div>
        )
    }
}

export default App;