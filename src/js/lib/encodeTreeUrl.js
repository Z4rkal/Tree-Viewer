var Buffer = require('buffer/').Buffer;

//https://github.com/eps1lon/TreeStats/blob/74e5979fbc04b4def2b1020caf08a9cdb36b8a48/src/poe/PassiveTreeUrl.js
function encodeTreeUrl(version, starting_class, ascendancy, nodes, fullscreen = 0) {
    const size = Object.keys(nodes).length * 2 + 6 + (version > 0 ? 1 : 0);
    let i = 0;

    const buf = new Buffer(size);

    buf.writeInt32BE(version, i);
    i += 4;

    buf.writeInt8(starting_class, i);
    i += 1;

    buf.writeInt8(ascendancy, i);
    i += 1;

    if (version > 0) {
        buf.writeInt8(fullscreen, i);
        i += 1;
    }

    Object.keys(nodes).map((nodeId) => {
        buf.writeUInt16BE(nodeId, i);

        i += 2;
    });

    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

module.exports = encodeTreeUrl;