import React, { Component } from 'react';

class PreCanvasContent extends Component {
    render() {
        const { startingNodes, ascStartingNodes, classStartingNodeId, ascClassId, pointsUsed, ascPointsUsed, loaded } = this.props;
        const { beginNextAction, resetTree, setAscClass } = this.props;

        if (!loaded || classStartingNodeId === 0)
            return (
                <div></div>
            )

        const characterClass = startingNodes[classStartingNodeId];

        const maxPoints = 123; //99 possible from leveling, 22 possible from quests, 2 possible from bandit reward
        const maxAscPoints = 8;

        return (
            <>
                <div id='level-container' className='canvas-info-container'>
                    <p id='skill-points'>{`${pointsUsed} / ${maxPoints}`}</p>
                    <p id='asc-points'>{`${ascPointsUsed} / ${maxAscPoints}`}</p>
                </div>
                <div id='class-selector' className='canvas-info-container'>
                    <select value={characterClass.id} onChange={(e) => { const value = e.target.value; beginNextAction(() => resetTree(parseInt(value))); }}>
                        {Object.values(startingNodes).map((node) => (
                            <option key={node.class} value={node.id}>{node.class}</option>
                        ))}
                    </select>
                </div>
                <div id='asc-class-selector' className='canvas-info-container'>
                    <select value={ascClassId} onChange={(e) => { const value = e.target.value; beginNextAction(() => setAscClass(parseInt(value))); }}>
                        <option value='0'>None</option>
                        {Object.values(ascStartingNodes).filter((node) => node.classId === characterClass.id).map((node) => (
                            <option key={`${node.classId} ${node.ascId}`} value={node.ascId}>{node.ascName}</option>
                        ))}
                    </select>
                </div>
            </>
        );
    }
}

export default PreCanvasContent;