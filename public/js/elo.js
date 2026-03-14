// js/elo.js
// Pure ELO calculation — no side effects, no DOM access.

const K_FACTOR = 40;

/**
 * Expected score for player A against player B.
 * @param {number} ratingA
 * @param {number} ratingB
 * @returns {number} value in [0, 1]
 */
function expectedScore(ratingA, ratingB) {
    const rA = parseInt(ratingA, 10);
    const rB = parseInt(ratingB, 10);
    return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

/**
 * Compute new ratings after a match.
 * @param {number|string} ratingA
 * @param {number|string} ratingB
 * @param {'left'|'right'|'draw'} result  'left' means A wins
 * @returns {{ newA: number, newB: number, deltaA: number, deltaB: number }}
 */
function updateRatings(ratingA, ratingB, result) {
    const rA = parseInt(ratingA, 10);
    const rB = parseInt(ratingB, 10);

    const eA = expectedScore(rA, rB);
    const eB = 1 - eA;
    const sA = result === 'left' ? 1 : result === 'draw' ? 0.5 : 0;
    const sB = 1 - sA;
    const newA = Math.round(rA + K_FACTOR * (sA - eA));
    const newB = Math.round(rB + K_FACTOR * (sB - eB));
    return {
        newA,
        newB,
        deltaA: newA - rA,
        deltaB: newB - rB,
    };
}
