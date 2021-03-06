import React, { Component } from 'react';

class TreeOverlay extends Component {
    constructor() {
        super();

        this.state = {
            isHovering: false,
            hoverNode: {},
            hoverX: 0,
            hoverY: 0,
            lastHoveredNode: 0,
            pathToHoveredNode: []
        };

        this.canvasRef = React.createRef();

        this.handleNodeHover = this.handleNodeHover.bind(this);
        this.addToHoverPath = this.addToHoverPath.bind(this);
    }

    componentDidUpdate() {
        const { loaded } = this.props;

        if (loaded) {
            this.updateCanvas();
        }
    }

    updateCanvas() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { isHovering } = this.state;

        ctx.clearRect(0, 0, CAN_WIDTH, CAN_HEIGHT);

        this.highlightSearchNodes();
        if (isHovering) {
            this.drawPathToHoveredNode();
            this.displayHoverTooltip();
        }
    }

    highlightSearchNodes() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { canX, canY, scale } = this.props;
        const { searchedNodes, nodes } = this.props;

        if (searchedNodes.length !== 0) {
            const canvas = this.canvasRef.current;
            const ctx = canvas.getContext('2d');

            const styleHolder = ctx.fillStyle;
            ctx.fillStyle = '#ffbf2055';
            ctx.translate(CAN_WIDTH / 2 + canX * scale, CAN_HEIGHT / 2 + canY * scale);
            ctx.scale(scale, scale)

            searchedNodes.map((nodeId) => {
                const node = nodes[nodeId];

                ctx.beginPath();
                ctx.arc(node.nX, node.nY, 100, 0, 2 * Math.PI);
                ctx.fill();
            });

            ctx.scale(1 / scale, 1 / scale);
            ctx.translate(-(CAN_WIDTH / 2 + canX * scale), -(CAN_HEIGHT / 2 + canY * scale));
            ctx.fillStyle = styleHolder;
        }
    }

    drawPathToHoveredNode() {
        function drawArc(ctx, arc) {
            const { orbit, radius, x, y, ø, øBetween, startId, outId, gt90 } = arc;

            ctx.translate(x, y);
            ctx.rotate(ø + (Math.PI / 2));
            ctx.beginPath();
            ctx.arc(0, radius, radius, -(Math.PI / 2), -(Math.PI / 2) - øBetween, true);
            ctx.stroke();
            ctx.rotate(-(ø + (Math.PI / 2)));
            ctx.translate(-x, -y);
        }

        function drawPath(ctx, pathId, paths) {
            const path = paths[pathId];
            const { x0, y0, w, ø, startId, outId } = path;

            ctx.translate(x0, y0);
            ctx.rotate(ø);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w, 0);
            ctx.stroke();
            ctx.rotate(-ø);
            ctx.translate(-x0, -y0);
        }

        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { nodes, paths } = this.props;
        const { canX, canY, scale } = this.props;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        let drawnPaths = {};

        const { pathToHoveredNode } = this.state;
        if (pathToHoveredNode.length !== 0) {
            try {
                ctx.save();
            }
            catch (error) {
                throw new Error(`ctx.save() failed in drawPathToHoveredNode : Failed at 111 in TreeOverlay.jsx`)
            }
            ctx.setTransform(scale, 0, 0, scale, CAN_WIDTH / 2 + canX * scale, CAN_HEIGHT / 2 + canY * scale);

            ctx.strokeStyle = '#f7c8d8dd';
            ctx.fillStyle = '#f7c8d8dd';

            pathToHoveredNode.map((nodeId) => {
                const node = nodes[nodeId];
                const { nX, nY, adjacent, arcs, pathKeys } = node;

                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(nX, nY, 100, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.lineWidth = 12;

                adjacent.map((adjNodeId) => {
                    const adjNode = nodes[adjNodeId];
                    if (pathToHoveredNode.some((pathNodeId) => pathNodeId === adjNodeId) || adjNode.active) {
                        const arcToTheCurrentNode = adjNode.arcs.find((arc) => arc.outId === nodeId || arc.startId === nodeId);
                        let foundArcOrPath = false;
                        if (arcToTheCurrentNode) {
                            foundArcOrPath = true;
                            drawArc(ctx, arcToTheCurrentNode);
                        }
                        else {
                            const pathIdToTheCurrentNode = adjNode.pathKeys.find((pathId) => paths[pathId].outId === nodeId);

                            if (pathIdToTheCurrentNode && !drawnPaths[pathIdToTheCurrentNode]) {
                                drawnPaths[pathIdToTheCurrentNode] = true;
                                foundArcOrPath = true;
                                drawPath(ctx, pathIdToTheCurrentNode, paths);
                            }
                        }
                        if (adjNode.active && !foundArcOrPath) {
                            arcs.map((arc) => {
                                if (arc.startId === adjNode.id || arc.outId === adjNode.id)
                                    drawArc(ctx, arc);
                            });
                            pathKeys.map((pathId) => {
                                const path = paths[pathId];
                                if (path.outId === adjNode.id && !drawnPaths[pathId]) {
                                    drawnPaths[pathId] = true;
                                    drawPath(ctx, pathId, paths);
                                }
                            });
                        }
                    }
                });
            });

            ctx.restore();
        }
    }

    displayHoverTooltip() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        const { hoverNode: node, hoverX: x, hoverY: y } = this.state;
        const { dn: name, sd } = node;

        /////////////////////// Box Size Calculations /////////////////////////
        /////////// Node Name and Description
        const headFont = '12pt FontinBold';
        const bodyFont = '10pt FontinBold';

        ctx.font = headFont;
        let longest = ctx.measureText(name).width;
        ctx.font = bodyFont;
        for (let i = 0; i < sd.length; i++) {
            let cur = ctx.measureText(sd[i]).width;
            if (cur > longest) longest = cur;
        }

        const wOff = 20;
        const hOff = 40;
        const hLine = 20;
        /////////// Extra Info
        const { pathToHoveredNode } = this.state;
        const debugFont = '8pt FontInBold';

        let extraHOff = 30;

        const nodeIdText = `Node ID: ${node.id}`;
        ctx.font = debugFont;
        const nodeIdLength = ctx.measureText(nodeIdText).width;

        let alloCostText = '';
        let dispAlloCost = false;
        if (pathToHoveredNode.length >= 1 && !node.active && node.spc.length === 0 && !node.isAscendancyStart) {
            dispAlloCost = true;
            const pointsToNode = pathToHoveredNode.length;

            ctx.font = bodyFont;
            alloCostText = `${pointsToNode} Point${pointsToNode !== 1 ? `s` : ``} to Allocate`;
            const alloCostLength = ctx.measureText(alloCostText).width;

            if (longest < alloCostLength + nodeIdLength + 5) {
                longest = alloCostLength + nodeIdLength + 5;
            }
        }
        else if (longest < nodeIdLength) longest = nodeIdLength;
        ///////////////////////////////////////////////////////////////////////
        let xOff = 0;
        let yOff = 0;
        if (x + longest + wOff > CAN_WIDTH)
            xOff = x + longest + wOff - CAN_WIDTH;
        if (y + hOff + sd.length * hLine + extraHOff > CAN_HEIGHT)
            yOff = y + hOff + sd.length * hLine + extraHOff - CAN_HEIGHT;

        ctx.translate(x - xOff, y - yOff);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'seashell';
        ctx.fillStyle = '#000000cc';
        ctx.textBaseline = 'middle';
        ctx.fillRect(0, 0, longest + wOff, hOff + sd.length * hLine + extraHOff);
        ctx.strokeRect(0, 0, longest + wOff, hOff + sd.length * hLine + extraHOff);

        ctx.fillStyle = '#c8c8c8';
        ctx.font = headFont;
        ctx.fillText(name, wOff / 2, hOff / 2);

        ctx.font = bodyFont;
        for (let i = 0; i < sd.length; i++) {
            ctx.fillText(sd[i], wOff / 2, hOff / 2 + hLine * (i + 1));
        }

        ctx.translate(0, hOff + sd.length * hLine);

        ctx.lineWidth = 2;
        ctx.beginPath()
        ctx.moveTo(0, 0);
        ctx.lineTo(longest + wOff, 0);
        ctx.stroke();

        if (dispAlloCost) {
            ctx.font = bodyFont;
            ctx.fillText(alloCostText, wOff / 2, hLine - 5);
        }

        ctx.textAlign = 'end';
        ctx.font = debugFont;
        ctx.fillStyle = '#a5a5a5';
        ctx.fillText(nodeIdText, longest + wOff / 2, hLine - 5);

        ctx.textAlign = 'start';
        ctx.translate(0, -(hOff + sd.length * hLine));
        ctx.translate(-(x - xOff), -(y - yOff));
    }

    handleNodeHover(node, event) {
        const { hoverNode } = this.state;
        const { findPathToNode } = this.props;
        const x = event.nativeEvent.offsetX;
        const y = event.nativeEvent.offsetY;

        if (node && node.id !== hoverNode.id) {
            this.setState(() => {
                return {
                    isHovering: true,
                    hoverNode: { ...node },
                    hoverX: x,
                    hoverY: y
                }
            }, () => {
                if (this.state.pathToHoveredNode.length === 0 || this.state.hoverNode.id !== this.state.lastHoveredNode) {
                    this.setState(() => {
                        return { pathToHoveredNode: [] };
                    });
                    findPathToNode(node.id, this.addToHoverPath);
                }
            });

        }
        else if (node && node.id === hoverNode.id) {
            this.setState(() => {
                return {
                    hoverX: x,
                    hoverY: y
                };
            });
        }
        else {
            this.setState((state) => {
                return {
                    isHovering: false,
                    hoverNode: {},
                    hoverX: 0,
                    hoverY: 0,
                    lastHoveredNode: state.hoverNode.id
                }
            })
        }
    }

    addToHoverPath(nodeId) {
        this.setState((state) => {
            return { pathToHoveredNode: [...state.pathToHoveredNode, nodeId] }
        });
    }

    render() {
        const { CAN_WIDTH, CAN_HEIGHT } = this.props;
        const { isDragging, canClick } = this.props;
        const { handleCanvasMouseDown, handleDrag, handleCanvasMouseUp, handleZoom, checkHit, handleNodeClick } = this.props;

        return (
            <>
                <canvas className='skill-canvas' width={CAN_WIDTH} height={CAN_HEIGHT} ref={this.canvasRef} onWheel={(e) => { if (!isDragging) handleZoom(e); }} onMouseDown={(e) => handleCanvasMouseDown(e)} onMouseMove={(e) => { if (isDragging) { handleDrag(e); } else { /*Can check if event.nativeEvent.shiftKey here for different functionality later*/ checkHit(e, this.handleNodeHover); }; }} onMouseUp={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onMouseLeave={(e) => { if (isDragging) { handleCanvasMouseUp(e); }; }} onClick={(e) => { if (canClick) { checkHit(e, handleNodeClick); }; }}>
                    Sorry, your browser can't read canvas elements, normally the skill tree would render here :(
                </canvas>
            </>
        )
    }
}

export default TreeOverlay;
