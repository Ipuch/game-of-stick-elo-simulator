// js/storage.js
// LocalStorage read/write helpers.

const STORAGE_KEYS = {
    PLAYERS: 'elo_players',
    MATCHES: 'elo_matches',
};

function savePlayers(players) {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}

function loadPlayers() {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!data) return null;

    const savedPlayers = JSON.parse(data);
    // Sync non-ELO data from INITIAL_PLAYERS in case it was updated in code
    return savedPlayers.map(saved => {
        const initial = INITIAL_PLAYERS.find(p => p.name === saved.name);
        if (initial) {
            saved.photo = initial.photo;
            saved.instagram = initial.instagram;
            saved.link = initial.link;
        }
        return saved;
    });
}

function saveMatches(matches) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
}

function loadMatches() {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return data ? JSON.parse(data) : [];
}

function clearAll() {
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
}

/**
 * Initialise players from INITIAL_PLAYERS if localStorage is empty.
 * Returns the current players array (persisted).
 */
function initPlayers() {
    let players = loadPlayers();
    if (!players) {
        players = INITIAL_PLAYERS.map((p) => ({
            name: p.name,
            instagram: p.instagram,
            photo: p.photo,
            elo: INITIAL_ELO,
            wins: 0,
            losses: 0,
            draws: 0,
        }));
        savePlayers(players);
    }
    return players;
}
