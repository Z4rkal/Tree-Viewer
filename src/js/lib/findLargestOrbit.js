function findLargestOrbit(orbits) {
    let largest = Object.keys(orbits).reduce((largest, orbitNum) => {
        if (largest < parseInt(orbitNum)) return parseInt(orbitNum);
        return largest;
    }, 0);

    if (largest === 0) return false;
    if (largest === 1) return 'small';
    if (largest === 2) return 'medium';
    if (largest >= 3 && orbits['3']) return 'large';
    return false;
}

module.exports = findLargestOrbit;