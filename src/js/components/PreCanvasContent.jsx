import React, { Component } from 'react';

class PreCanvasContent extends Component {
    render() {
        const { startingNodes, ascStartingNodes, classStartingNodeId, ascClassId, pointsUsed, ascPointsUsed, loaded } = this.props;
        const { setCharacter, setAscClass } = this.props;

        if (!loaded)
            return (
                <div></div>
            )

        const characterClass = startingNodes[classStartingNodeId];

        const maxPoints = 124;
        const maxAscPoints = 8;

        return (
            <>
                <div id='level-container' className='canvas-info-container'>
                    <p id='skill-points'>{`${pointsUsed} / ${maxPoints}`}</p>
                    <p id='asc-points'>{`${ascPointsUsed} / ${maxAscPoints}`}</p>
                </div>
                <div id='class-selector' className='canvas-info-container'>
                    <select value={characterClass.id} onChange={(e) => setCharacter(parseInt(e.target.value))}>
                        {Object.values(startingNodes).map((node) => (
                            <option key={node.class} value={node.id}>{node.class}</option>
                        ))}
                    </select>
                </div>
                <div id='asc-class-selector' className='canvas-info-container'>
                    <select value={ascClassId} onChange={(e) => setAscClass(parseInt(e.target.value))}>
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