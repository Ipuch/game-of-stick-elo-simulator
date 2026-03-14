// js/ui.js
// Modern ELO Battle DOM rendering and micro-animations

// ---- Avatar helpers -------------------------------------------------------

function playerInitials(name) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

function renderAvatar(player) {
    if (player.photo) {
        return `<img src="${player.photo}" alt="${player.name}" class="avatar-img" />`;
    }
    return `<div class="avatar-placeholder">${playerInitials(player.name)}</div>`;
}

// ---- Battle Card ----------------------------------------------------------

function renderBattleCard(player, side) {
    const enterClass = side === 'left' ? 'anim-enter-left' : 'anim-enter-right';
    return `
    <div class="battle-card ${enterClass}" id="card-${side}" onclick="handleVote('${side}')">
      <div class="vote-overlay">
        <i class="fa-solid fa-check-circle"></i> STICK !
      </div>
      <div class="avatar-wrap">${renderAvatar(player)}</div>
      
      <div class="player-info">
        <div class="player-ig">
          ${player.link ? `<a href="${player.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${player.instagram}</a>` : (player.instagram || '')}
        </div>
        <div class="player-name">${player.name}</div>
        
        <div class="player-elo">
          <span class="elo-label">Rating</span>
          <span class="elo-value" id="elo-val-${side}" data-value="${player.elo}">${player.elo}</span>
        </div>
        
        <div class="player-stats">
          <span class="stat-w">${player.wins}W</span>
          <span class="stat-l">${player.losses}L</span>
          <span class="stat-d">${player.draws}D</span>
        </div>
      </div>
      
      <div class="elo-delta" id="delta-${side}"></div>
    </div>`;
}

// Number ticking animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        obj.innerHTML = current;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function showEloDelta(side, delta) {
    const el = document.getElementById(`delta-${side}`);
    if (!el) return;

    const sign = delta > 0 ? '+' : (delta < 0 ? '' : '');
    const colorClass = delta > 0 ? 'delta-pos' : (delta < 0 ? 'delta-neg' : 'delta-zero');

    el.textContent = `${sign}${delta}`;
    el.className = `elo-delta ${colorClass} visible`;

    // Animate ELO value
    const eloEl = document.getElementById(`elo-val-${side}`);
    if (eloEl) {
        const start = parseInt(eloEl.dataset.value, 10);
        const end = start + delta;
        animateValue(eloEl, start, end, 800);
        eloEl.dataset.value = end;
    }

    setTimeout(() => {
        if (el) el.className = `elo-delta ${colorClass}`;
    }, 2500);
}

// ---- States & Confetti ----------------------------------------------------

function flashResult(winningSide) {
    const cards = document.querySelectorAll('.battle-card');
    const glow = document.getElementById('ambient-glow');

    cards.forEach(c => c.classList.remove('state-win', 'state-loss', 'state-draw'));
    glow.className = 'ambient-glow';

    if (winningSide === 'draw') {
        cards.forEach(c => c.classList.add('state-draw'));
        glow.classList.add('glow-draw');
    } else {
        document.getElementById('card-left')?.classList.add(winningSide === 'left' ? 'state-win' : 'state-loss');
        document.getElementById('card-right')?.classList.add(winningSide === 'right' ? 'state-win' : 'state-loss');
        glow.classList.add(`glow-${winningSide}`);
    }

    launchConfetti(winningSide);

    setTimeout(() => {
        cards.forEach(c => c.classList.remove('state-win', 'state-loss', 'state-draw'));
        glow.className = 'ambient-glow';
    }, 1800);
}

function launchConfetti(winningSide) {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';

    const colorsLeft = ['#ec4899', '#be185d', '#ffffff', '#fbcfe8'];
    const colorsRight = ['#3b82f6', '#1d4ed8', '#ffffff', '#bfdbfe'];
    const colorsDraw = ['#eab308', '#ca8a04', '#ffffff', '#fef08a'];

    const colors = winningSide === 'left' ? colorsLeft :
        winningSide === 'right' ? colorsRight : colorsDraw;

    const count = 80;
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'confetti-dot';

        // Random physics configuration using CSS variables
        const tx = (Math.random() - 0.5) * 600 + 'px';
        const ty = (Math.random() - 1) * 600 + 'px';
        const rot = Math.random() * 720 + 'deg';

        dot.style.cssText = `
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${Math.random() * 12 + 6}px;
      height: ${Math.random() * 6 + 4}px;
      --tx: ${tx};
      --ty: ${ty};
      --rot: ${rot};
      animation-duration: ${Math.random() * 0.8 + 0.8}s;
    `;
        container.appendChild(dot);
    }

    setTimeout(() => { container.innerHTML = ''; }, 2000);
}

// ---- Leaderboard ----------------------------------------------------------

function computeRecentDiff(players, matches) {
    const diff = {};
    const recent = matches.slice(0, 30);
    recent.forEach((m) => {
        if (!(m.left in diff)) diff[m.left] = 0;
        if (!(m.right in diff)) diff[m.right] = 0;
        diff[m.left] += m.leftEloAfter - m.leftEloBefore;
        diff[m.right] += m.rightEloAfter - m.rightEloBefore;
    });
    return diff;
}

function renderLeaderboard(players, matches) {
    const recentDiff = computeRecentDiff(players, matches);
    const sorted = [...players].sort((a, b) => b.elo - a.elo);
    const medals = ['🥇', '🥈', '🥉'];

    const rows = sorted.map((p, i) => {
        const rank = i + 1;
        const medal = medals[i] || `<span class="rank-text">${rank}</span>`;
        const diff = recentDiff[p.name] ?? 0;

        let diffHtml = '';
        if (diff > 0) diffHtml = `<span class="elo-diff delta-pos"><i class="fa-solid fa-arrow-up"></i> ${diff}</span>`;
        else if (diff < 0) diffHtml = `<span class="elo-diff delta-neg"><i class="fa-solid fa-arrow-down"></i> ${Math.abs(diff)}</span>`;

        return `
      <tr>
        <td class="rank-cell"><span class="rank-medal">${medal}</span></td>
        <td class="player-cell">
          <div class="player-content">
            <span class="lb-avatar">${renderAvatar(p)}</span>
            <span class="lb-name">${p.name}</span>
          </div>
        </td>
        <td class="elo-cell">
          <div class="elo-content">
            <span class="elo-value">${p.elo}</span>
            ${diffHtml}
          </div>
        </td>
        <td class="stats-cell">
          <span class="stat-w">${p.wins}</span> - 
          <span class="stat-l">${p.losses}</span> - 
          <span class="stat-d">${p.draws}</span>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('leaderboard-body').innerHTML = rows;
}

// ---- History --------------------------------------------------------------

function renderHistory(matches) {
    const container = document.getElementById('history-list');

    if (matches.length === 0) {
        container.innerHTML = '<li style="text-align:center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-ghost fa-2x" style="margin-bottom:1rem;opacity:0.5;"></i><br/>No battles yet. Be the first to strike!</li>';
        return;
    }

    const items = matches.slice(0, 200).map((m) => {
        let resultHtml = '';
        if (m.result === 'left') resultHtml = `<span style="color: var(--accent-left)"><i class="fa-solid fa-trophy"></i> ${m.left} Wins</span>`;
        else if (m.result === 'right') resultHtml = `<span style="color: var(--accent-right)"><i class="fa-solid fa-trophy"></i> ${m.right} Wins</span>`;
        else resultHtml = `<span style="color: var(--accent-draw)"><i class="fa-solid fa-handshake"></i> Draw</span>`;

        const dA = m.leftEloAfter - m.leftEloBefore;
        const dB = m.rightEloAfter - m.rightEloBefore;

        const ts = new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

        return `
      <li class="history-item">
        <div class="history-main">
          <span class="history-match">
            ${m.left} <span class="history-vs">VS</span> ${m.right}
          </span>
          <span class="history-result">${resultHtml}</span>
        </div>
        <div class="history-meta">
          <span class="history-deltas">
            <span class="${dA > 0 ? 'delta-pos' : 'delta-neg'}">${dA > 0 ? '+' : ''}${dA}</span>
            <span style="color: var(--border-light)">|</span>
            <span class="${dB > 0 ? 'delta-pos' : 'delta-neg'}">${dB > 0 ? '+' : ''}${dB}</span>
          </span>
          <span class="history-time">${ts}</span>
        </div>
      </li>`;
    }).join('');

    container.innerHTML = items;
}
