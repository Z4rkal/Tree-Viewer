//This is ripped from the js on GGG's site,

//The only difference between this and the way I was originally calculating orbit positions
//is that this treats nodes on the 4th 40 member orbit differently, and without this a lot of nodes and paths
//don't get placed in the proper position

//I'd like to look into this more to get why they came to this implementation, but for now I'm just using it as is
function getOrbitAngle(orbitIndex, numOnOrbit) {
    const degToRad = .017453293;
    if (40 == numOnOrbit) switch (orbitIndex) {
        case 0:
            return getOrbitAngle(0, 12);
        case 1:
            return getOrbitAngle(0, 12) + 10 * degToRad;
        case 2:
            return getOrbitAngle(0, 12) + 20 * degToRad;
        case 3:
            return getOrbitAngle(1, 12);
        case 4:
            return getOrbitAngle(1, 12) + 10 * degToRad;
        case 5:
            return getOrbitAngle(1, 12) + 15 * degToRad;
        case 6:
            return getOrbitAngle(1, 12) + 20 * degToRad;
        case 7:
            return getOrbitAngle(2, 12);
        case 8:
            return getOrbitAngle(2, 12) + 10 * degToRad;
        case 9:
            return getOrbitAngle(2, 12) + 20 * degToRad;
        case 10:
            return getOrbitAngle(3, 12);
        case 11:
            return getOrbitAngle(3, 12) + 10 * degToRad;
        case 12:
            return getOrbitAngle(3, 12) + 20 * degToRad;
        case 13:
            return getOrbitAngle(4, 12);
        case 14:
            return getOrbitAngle(4, 12) + 10 * degToRad;
        case 15:
            return getOrbitAngle(4, 12) + 15 * degToRad;
        case 16:
            return getOrbitAngle(4, 12) + 20 * degToRad;
        case 17:
            return getOrbitAngle(5, 12);
        case 18:
            return getOrbitAngle(5, 12) + 10 * degToRad;
        case 19:
            return getOrbitAngle(5, 12) + 20 * degToRad;
        case 20:
            return getOrbitAngle(6, 12);
        case 21:
            return getOrbitAngle(6, 12) + 10 * degToRad;
        case 22:
            return getOrbitAngle(6, 12) + 20 * degToRad;
        case 23:
            return getOrbitAngle(7, 12);
        case 24:
            return getOrbitAngle(7, 12) + 10 * degToRad;
        case 25:
            return getOrbitAngle(7, 12) + 15 * degToRad;
        case 26:
            return getOrbitAngle(7, 12) + 20 * degToRad;
        case 27:
            return getOrbitAngle(8, 12);
        case 28:
            return getOrbitAngle(8, 12) + 10 * degToRad;
        case 29:
            return getOrbitAngle(8, 12) + 20 * degToRad;
        case 30:
            return getOrbitAngle(9, 12);
        case 31:
            return getOrbitAngle(9, 12) + 10 * degToRad;
        case 32:
            return getOrbitAngle(9, 12) + 20 * degToRad;
        case 33:
            return getOrbitAngle(10, 12);
        case 34:
            return getOrbitAngle(10, 12) + 10 * degToRad;
        case 35:
            return getOrbitAngle(10, 12) + 15 * degToRad;
        case 36:
            return getOrbitAngle(10, 12) + 20 * degToRad;
        case 37:
            return getOrbitAngle(11, 12);
        case 38:
            return getOrbitAngle(11, 12) + 10 * degToRad;
        case 39:
            return getOrbitAngle(11, 12) + 20 * degToRad
    }
    return 2 * Math.PI * orbitIndex / numOnOrbit
}

module.exports = getOrbitAngle;