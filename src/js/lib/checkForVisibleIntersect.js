function checkForVisibleIntersect(path, canX, canY, CAN_WIDTH, CAN_HEIGHT, scale) {
    const { x0, y0, x1, y1, w, ø, startId, outId } = path;

    const leftVisExtent = -canX - CAN_WIDTH / (2 * scale);
    const rightVisExtent = -canX + CAN_WIDTH / (2 * scale);
    const topVisExtent = -canY - CAN_HEIGHT / (2 * scale);
    const bottomVisExtent = -canY + CAN_HEIGHT / (2 * scale);

    if ( //Check if the line would cut across a corner
        ((Math.min(x0, x1) <= leftVisExtent && Math.max(x0, x1) >= leftVisExtent)
            || (Math.min(x0, x1) <= rightVisExtent && Math.max(x0, x1) >= rightVisExtent))
        && ((Math.min(y0, y1) <= topVisExtent && Math.max(y0, y1) >= topVisExtent)
            || (Math.min(y0, y1) <= bottomVisExtent && Math.max(y0, y1) >= bottomVisExtent))
    ) return true;


    return false;
}

module.exports = checkForVisibleIntersect;