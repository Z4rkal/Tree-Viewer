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

        if (isHovering) {
            this.drawPathToHoveredNode();
            this.displayHoverTooltip();
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

        function drawPath(ctx, path) {
            const { x1, y1, w, ø, startId, outId } = path;

            ctx.translate(x1, y1);
            ctx.rotate(ø);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w, 0);
            ctx.stroke();
            ctx.rotate(-ø);
            ctx.translate(-x1, -y1);
        }

        const { nodes } = this.props;
        const { canX, canY, scale } = this.props;
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        const { pathToHoveredNode } = this.state;
        if (pathToHoveredNode.length !== 0) {
            ctx.save();
            ctx.setTransform(scale, 0, 0, scale, 916 / 2 + canX * scale, 767 / 2 + canY * scale);

            ctx.strokeStyle = '#f7c8d8dd';
            ctx.fillStyle = '#f7c8d8dd';

            pathToHoveredNode.map((nodeId) => {
                const node = nodes[nodeId];
                const { nX, nY, adjacent, arcs, paths } = node;

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
                            const pathToTheCurrentNode = adjNode.paths.find((path) => path.outId === nodeId);

                            if (pathToTheCurrentNode) {
                                foundArcOrPath = true;
                                drawPath(ctx, pathToTheCurrentNode);
                            }
                        }
                        if (adjNode.active && !foundArcOrPath) {
                            arcs.map((arc) => {
                                if (arc.startId === adjNode.id || arc.outId === adjNode.id)
                                    drawArc(ctx, arc);
                            });
                            paths.map((path) => {
                                if (path.outId === adjNode.id)
                                    drawPath(ctx, path);
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

        let xOff = 0;
        let yOff = 0;
        if (x + longest + wOff > CAN_WIDTH)
            xOff = x + longest + wOff - CAN_WIDTH;
        if (y + hOff + sd.length * hLine > CAN_HEIGHT)
            yOff = y + hOff + sd.length * hLine - CAN_HEIGHT;

        ctx.translate(x - xOff, y - yOff);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'seashell';
        ctx.fillStyle = '#000000cc';
        ctx.textBaseline = 'middle';
        ctx.fillRect(0, 0, longest + wOff, hOff + sd.length * hLine);
        ctx.strokeRect(0, 0, longest + wOff, hOff + sd.length * hLine);

        ctx.fillStyle = 'rgb(200,200,200)';
        ctx.font = headFont;
        ctx.fillText(name, wOff / 2, hOff / 2);

        ctx.font = bodyFont;
        for (let i = 0; i < sd.length; i++) {
            ctx.fillText(sd[i], wOff / 2, hOff / 2 + hLine * (i + 1));
        }

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
