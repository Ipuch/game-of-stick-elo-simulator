// js/app.js
// Main application logic: init, pair selection, event listeners.

/** @type {Array} players */
let players = [];
/** @type {Array} matches */
let matches = [];
/** @type {{left: object, right: object}} current pair */
let currentPair = null;

// ---- Pair selection -------------------------------------------------------

/**
 * Pick a pair of players.
 * Strategy: player with fewest matches goes first; opponent picked randomly
 * from the rest, with slight bias toward players with similar ELO.
 */
function pickPair() {
    const sorted = [...players].sort((a, b) => {
        const mA = a.wins + a.losses + a.draws;
        const mB = b.wins + b.losses + b.draws;
        return mA - mB;
    });
    const left = sorted[0];
    const pool = sorted.slice(1);
    const right = pool[Math.floor(Math.random() * pool.length)];
    return { left, right };
}

// ---- Render current battle ------------------------------------------------

function renderBattle() {
    currentPair = pickPair();
    const battleArea = document.getElementById('battle-area');

    // Swap animation by quickly fading out area
    battleArea.style.opacity = '0';
    battleArea.style.transform = 'scale(0.95)';
    battleArea.style.transition = 'opacity 0.2s, transform 0.2s';

    setTimeout(() => {
        battleArea.innerHTML = `
      ${renderBattleCard(currentPair.left, 'left')}
      <div class="vs-divider"><div class="vs-icon">VS</div></div>
      ${renderBattleCard(currentPair.right, 'right')}
    `;

        // Fade in
        requestAnimationFrame(() => {
            battleArea.style.opacity = '1';
            battleArea.style.transform = 'scale(1)';
        });
    }, 200);
}

// ---- Handle vote ----------------------------------------------------------

let isVoting = false;

function handleVote(result) {
    if (!currentPair || isVoting) return;
    isVoting = true;

    const { left, right } = currentPair;

    // Cache the before values before mutating the objects!
    const originalLeftElo = left.elo;
    const originalRightElo = right.elo;

    const { newA, newB, deltaA, deltaB } = updateRatings(originalLeftElo, originalRightElo, result);

    // Update player stats
    const leftPlayer = players.find((p) => p.name === left.name);
    const rightPlayer = players.find((p) => p.name === right.name);

    leftPlayer.elo = newA;
    rightPlayer.elo = newB;

    if (result === 'left') {
        leftPlayer.wins++;
        rightPlayer.losses++;
    } else if (result === 'right') {
        rightPlayer.wins++;
        leftPlayer.losses++;
    } else {
        leftPlayer.draws++;
        rightPlayer.draws++;
    }

    // Record match
    const record = {
        left: left.name,
        right: right.name,
        result,
        leftEloBefore: originalLeftElo,
        rightEloBefore: originalRightElo,
        leftEloAfter: newA,
        rightEloAfter: newB,
        timestamp: new Date().toISOString(),
    };
    matches.unshift(record); // prepend (newest first)

    // Persist
    savePlayers(players);
    saveMatches(matches);

    // Visual feedback
    showEloDelta('left', deltaA);
    showEloDelta('right', deltaB);
    flashResult(result);

    // Animate the swiped card off screen (if we swiped)
    if (result === 'left' || result === 'right') {
        const loserCard = document.getElementById(result === 'left' ? 'card-right' : 'card-left');
        const winnerCard = document.getElementById(result === 'left' ? 'card-left' : 'card-right');

        if (winnerCard) {
            winnerCard.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            winnerCard.style.transform = `translate(0px, -20px) rotate(0deg) scale(1.05)`;
        }
        if (loserCard) {
            loserCard.style.transition = 'transform 0.5s ease-in, opacity 0.4s';
            loserCard.style.transform = `translate(${result === 'left' ? '200%' : '-200%'}, 100px) rotate(${result === 'left' ? 45 : -45}deg)`;
            loserCard.style.opacity = '0';
        }
    }

    // Next pair after longer delay to enjoy the animation!
    setTimeout(() => {
        isVoting = false;
        renderBattle();
    }, 2300);
}

// ---- Swipe / Drag Logic ---------------------------------------------------

function setupSwipe(cardElement, sideProperty) {
    if (!cardElement) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerDown = (e) => {
        if (isVoting || (e.pointerType === 'mouse' && e.button !== 0)) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        cardElement.classList.add('dragging');
        cardElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;

        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        // Calculate rotation based on X movement
        const rotate = currentX * 0.05;

        // Apply transform visually
        cardElement.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;
    };

    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        cardElement.classList.remove('dragging');
        cardElement.releasePointerCapture(e.pointerId);

        const threshold = window.innerWidth * 0.25; // 25% of screen width to swipe

        if (currentX > threshold) {
            // Swiped Right -> if we dragged the LEFT card right, left wins. If dragged RIGHT card right, right wins.
            handleVote(sideProperty);
        } else if (currentX < -threshold) {
            // Swiped Left
            handleVote(sideProperty === 'left' ? 'right' : 'left'); // Opponent wins
        } else if (currentY > threshold) {
            // Swiped Down -> Draw
            handleVote('draw');
        } else {
            // Return to center
            cardElement.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            cardElement.style.transform = 'translate(0px, 0px) rotate(0deg)';

            // Clean up inline styles so CSS animations work again
            setTimeout(() => {
                if (!isVoting) {
                    cardElement.style.transition = '';
                    cardElement.style.transform = '';
                }
            }, 400);
        }

        currentX = 0;
        currentY = 0;
    };

    cardElement.addEventListener('pointerdown', onPointerDown);
    cardElement.addEventListener('pointermove', onPointerMove);
    cardElement.addEventListener('pointerup', onPointerUp);
    cardElement.addEventListener('pointercancel', onPointerUp);
}

// Hook it into render action
const originalRenderBattle = renderBattle;
renderBattle = function () {
    originalRenderBattle();
    setTimeout(() => {
        setupSwipe(document.getElementById('card-left'), 'left');
        setupSwipe(document.getElementById('card-right'), 'right');
    }, 250); // wait for DOM to mount
};

// ---- Tab navigation -------------------------------------------------------

function activateTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.view').forEach((v) => {
        if (v.id === `view-${tabId}`) {
            v.classList.add('active');
            // Reset animation
            v.style.animation = 'none';
            v.offsetHeight; // trigger reflow
            v.style.animation = null;
        } else {
            v.classList.remove('active');
        }
    });

    if (tabId === 'leaderboard') renderLeaderboard(players, matches);
    if (tabId === 'history') renderHistory(matches);
}

// ---- Reset ----------------------------------------------------------------

function handleReset() {
    if (!confirm('⚠️ Protocol Reset Initiated.\n\nAre you sure you want to completely erase all global rankings and history? This action is irreversible.')) return;

    clearAll();
    players = initPlayers();
    matches = [];

    renderBattle();
    activateTab('battle');
}

// ---- Init -----------------------------------------------------------------

function init() {
    players = initPlayers();
    matches = loadMatches();

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // Home to Battle transition
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            activateTab('battle');
            const mainHeader = document.getElementById('main-header');
            if (mainHeader) mainHeader.style.display = 'block';
        });
    }

    // Vote buttons
    document.getElementById('btn-left').addEventListener('click', () => handleVote('left'));
    document.getElementById('btn-draw').addEventListener('click', () => handleVote('draw'));
    document.getElementById('btn-right').addEventListener('click', () => handleVote('right'));

    // Skip
    document.getElementById('btn-skip').addEventListener('click', () => renderBattle());

    // Reset
    document.getElementById('btn-reset').addEventListener('click', handleReset);

    // First battle
    renderBattle();
}

document.addEventListener('DOMContentLoaded', init);
