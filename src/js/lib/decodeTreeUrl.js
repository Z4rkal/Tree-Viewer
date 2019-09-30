var Buffer = require('buffer/').Buffer;

//https://github.com/eps1lon/TreeStats/blob/74e5979fbc04b4def2b1020caf08a9cdb36b8a48/src/poe/PassiveTreeUrl.js
function decodeTreeUrl(Base64TreeStr) {
    // deduced from loadHistoryUrl
    const buf = Buffer(Base64TreeStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    let i = 0;

    const version = buf.readInt32BE(i);
    i += 4;

    const starting_class = buf.readInt8(i);
    i += 1;

    const ascendancy = buf.readInt8(i);
    i += 1;

    let fullscreen = 0;
    // source says > 0, PoESkillTree > 3
    // we will adjust our offset before we start looping
    if (version > 0) {
        fullscreen = buf.readInt8(i);
        i += 1;
    }

    const nodes = [];

    // see version comment
    for (i -= (buf.length - i) % 2; i < buf.length; i += 2) {
        nodes.push(buf.readUInt16BE(i));
    }

    return {
        version: version,
        startingClass: starting_class,
        ascId: ascendancy,
        fullscreen: fullscreen,
        nodes: nodes,
    };
}


module.exports = decodeTreeUrl;