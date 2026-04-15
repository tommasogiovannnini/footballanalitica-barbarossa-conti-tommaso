const mysql = require('mysql2/promise');
const https = require('https');

const CONFIG = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'football_stats',
  },
  api: {
    baseUrl: 'https://api.football-data.org/v4',
    key: process.env.FOOTBALL_API_KEY || 'YOUR_API_KEY',
    competitionId: 'SA', 
    season: process.argv.includes('--season')
      ? process.argv[process.argv.indexOf('--season') + 1]
      : '2024',
  },
  useMock: process.argv.includes('--mock'),
};

const LOG = {
  info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} - ${msg}`),
  ok:   (msg) => console.log(`[OK]    ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} - ${msg}`),
  err:  (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
};

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'X-Auth-Token': CONFIG.api.key, ...headers },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    }).on('error', reject);
  });
}

function getMockData() {
  return {
    standings: [
      { team: { id: 109, name: 'Juventus FC', shortName: 'Juventus' }, points: 68, playedGames: 31, won: 21, draw: 5, lost: 5, goalsFor: 62, goalsAgainst: 28 },
      { team: { id: 108, name: 'Inter Milan',  shortName: 'Inter'    }, points: 65, playedGames: 31, won: 20, draw: 5, lost: 6, goalsFor: 58, goalsAgainst: 32 },
      { team: { id: 113, name: 'SSC Napoli',   shortName: 'Napoli'   }, points: 60, playedGames: 31, won: 18, draw: 6, lost: 7, goalsFor: 55, goalsAgainst: 35 },
    ],
    matches: [
      { id: 4001, homeTeam: { id: 109, name: 'Juventus FC' }, awayTeam: { id: 108, name: 'Inter Milan' },
        utcDate: '2025-04-20T18:45:00Z', status: 'SCHEDULED', matchday: 32, score: { fullTime: { home: null, away: null } } },
      { id: 4002, homeTeam: { id: 108, name: 'Inter Milan'  }, awayTeam: { id: 113, name: 'SSC Napoli'  },
        utcDate: '2025-04-21T16:00:00Z', status: 'SCHEDULED', matchday: 32, score: { fullTime: { home: null, away: null } } },
      { id: 3001, homeTeam: { id: 109, name: 'Juventus FC'  }, awayTeam: { id: 113, name: 'SSC Napoli'  },
        utcDate: '2025-03-15T19:45:00Z', status: 'FINISHED',  matchday: 28, score: { fullTime: { home: 2, away: 1 } } },
    ],
    scorers: [
      { player: { id: 901, name: 'Mario Rossi', nationality: 'Italy', dateOfBirth: '1998-03-15', position: 'Forward'  }, team: { id: 109 }, goals: 18, assists: 7 },
      { player: { id: 902, name: 'Filippo Esposito', nationality: 'Italy', dateOfBirth: '1999-09-30', position: 'Forward' }, team: { id: 108 }, goals: 14, assists: 9 },
    ],
  };
}

function pulisciStringa(s) {
  if (!s) return null;
  return s.trim().replace(/\s+/g, ' ').substring(0, 100);
}

function normalizzaData(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function validaGol(g) {
  const n = parseInt(g);
  if (isNaN(n) || n < 0 || n > 30) return null;
  return n;
}

function mappaRuolo(posizione) {
  const mappa = {
    'Goalkeeper': 'portiere',
    'Defender': 'difensore',
    'Midfielder': 'centrocampista',
    'Forward': 'attaccante',
    'Attacker': 'attaccante',
  };
  return mappa[posizione] || 'centrocampista';
}

function mappaStato(status) {
  const mappa = {
    'SCHEDULED': 'programmata',
    'LIVE': 'in_corso',
    'IN_PLAY': 'in_corso',
    'FINISHED': 'completata',
    'POSTPONED': 'rinviata',
  };
  return mappa[status] || 'programmata';
}

async function fetchDati() {
  if (CONFIG.useMock) {
    LOG.info('Uso dati mock (--mock attivo)');
    return getMockData();
  }
  LOG.info('Raccolta dati da football-data.org...');
  const base = `${CONFIG.api.baseUrl}/competitions/${CONFIG.api.competitionId}`;
  const [standings, matches, scorers] = await Promise.all([
    httpGet(`${base}/standings?season=${CONFIG.api.season}`),
    httpGet(`${base}/matches?season=${CONFIG.api.season}`),
    httpGet(`${base}/scorers?season=${CONFIG.api.season}&limit=50`),
  ]);
  return {
    standings: standings.standings?.[0]?.table || [],
    matches: matches.matches || [],
    scorers: scorers.scorers || [],
  };
}

async function sincronizzaSquadre(conn, standings) {
  LOG.info(`Sincronizzazione ${standings.length} squadre...`);
  let nuove = 0, aggiornate = 0;
  for (const entry of standings) {
    const { team } = entry;
    const nome = pulisciStringa(team.name);
    if (!nome) continue;
    const [existing] = await conn.query('SELECT id FROM squadre WHERE nome = ?', [nome]);
    if (existing.length === 0) {
      await conn.query('INSERT INTO squadre (nome) VALUES (?)', [nome]);
      nuove++;
    } else {
      aggiornate++;
    }
  }
  LOG.ok(`Squadre: ${nuove} nuove, ${aggiornate} già presenti`);
}

async function sincronizzaClassifica(conn, standings, stagione) {
  LOG.info(`Sincronizzazione classifica stagione ${stagione}...`);
  let ok = 0, skip = 0;
  for (const entry of standings) {
    const nome = pulisciStringa(entry.team.name);
    const [squadra] = await conn.query('SELECT id FROM squadre WHERE nome = ?', [nome]);
    if (squadra.length === 0) { skip++; continue; }
    const sid = squadra[0].id;
    const punti = parseInt(entry.points) || 0;
    const pg = parseInt(entry.playedGames) || 0;
    const v = parseInt(entry.won) || 0;
    const par = parseInt(entry.draw) || 0;
    const s = parseInt(entry.lost) || 0;
    const gf = parseInt(entry.goalsFor) || 0;
    const gs = parseInt(entry.goalsAgainst) || 0;
    await conn.query(`
      INSERT INTO classifica_stagionale (squadra_id, stagione, punti, partite_giocate, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE punti=VALUES(punti), partite_giocate=VALUES(partite_giocate),
        vittorie=VALUES(vittorie), pareggi=VALUES(pareggi), sconfitte=VALUES(sconfitte),
        gol_fatti=VALUES(gol_fatti), gol_subiti=VALUES(gol_subiti)
    `, [sid, stagione, punti, pg, v, par, s, gf, gs]);
    ok++;
  }
  LOG.ok(`Classifica: ${ok} righe aggiornate, ${skip} skip`);
}

async function sincronizzaPartite(conn, matches, stagione) {
  LOG.info(`Sincronizzazione ${matches.length} partite...`);
  let ok = 0, skip = 0, errori = 0;
  for (const m of matches) {
    try {
      const nomeCasa = pulisciStringa(m.homeTeam?.name);
      const nomeOspite = pulisciStringa(m.awayTeam?.name);
      if (!nomeCasa || !nomeOspite) { skip++; continue; }

      const [casa] = await conn.query('SELECT id FROM squadre WHERE nome = ?', [nomeCasa]);
      const [ospite] = await conn.query('SELECT id FROM squadre WHERE nome = ?', [nomeOspite]);
      if (casa.length === 0 || ospite.length === 0) { skip++; continue; }

      const data = normalizzaData(m.utcDate);
      if (!data) { skip++; continue; }

      const golCasa = m.score?.fullTime?.home !== null ? validaGol(m.score.fullTime.home) : null;
      const golOspite = m.score?.fullTime?.away !== null ? validaGol(m.score.fullTime.away) : null;
      const stato = mappaStato(m.status);
      const giornata = m.matchday ? parseInt(m.matchday) : null;

      await conn.query(`
        INSERT INTO partite (squadra_casa_id, squadra_ospite_id, data_partita, gol_casa, gol_ospite, stato, stagione, giornata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE gol_casa=VALUES(gol_casa), gol_ospite=VALUES(gol_ospite), stato=VALUES(stato)
      `, [casa[0].id, ospite[0].id, data, golCasa, golOspite, stato, stagione, giornata]);
      ok++;
    } catch (e) {
      LOG.warn(`Partita skippata: ${e.message}`);
      errori++;
    }
  }
  LOG.ok(`Partite: ${ok} sincronizzate, ${skip} skip, ${errori} errori`);
}

async function sincronizzaGiocatori(conn, scorers, stagione) {
  LOG.info(`Sincronizzazione ${scorers.length} giocatori/marcatori...`);
  let ok = 0, skip = 0;
  for (const entry of scorers) {
    const { player, team } = entry;
    const nomeSquadra = pulisciStringa(team?.name || '');
    const [squadra] = await conn.query('SELECT id FROM squadre WHERE nome = ?', [nomeSquadra]);
    if (squadra.length === 0) { skip++; continue; }

    const nome = pulisciStringa(player.name?.split(' ')[0] || 'N/A');
    const cognome = pulisciStringa(player.name?.split(' ').slice(1).join(' ') || 'N/A');
    const dataNascita = normalizzaData(player.dateOfBirth);
    const ruolo = mappaRuolo(player.position);

    let giocatoreId;
    const [existing] = await conn.query(
      'SELECT id FROM giocatori WHERE nome = ? AND cognome = ? AND squadra_id = ?',
      [nome, cognome, squadra[0].id]
    );
    if (existing.length === 0) {
      const [res] = await conn.query(
        'INSERT INTO giocatori (nome, cognome, data_nascita, nazionalita, ruolo, squadra_id) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, cognome, dataNascita, pulisciStringa(player.nationality), ruolo, squadra[0].id]
      );
      giocatoreId = res.insertId;
    } else {
      giocatoreId = existing[0].id;
    }
    const gol = parseInt(entry.goals) || 0;
    const assist = parseInt(entry.assists) || 0;
    await conn.query(`
      INSERT INTO statistiche_giocatore (giocatore_id, stagione, gol, assist)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE gol=VALUES(gol), assist=VALUES(assist)
    `, [giocatoreId, stagione, gol, assist]);
    ok++;
  }
  LOG.ok(`Giocatori: ${ok} sincronizzati, ${skip} skip`);
}

async function main() {
  LOG.info('=== AVVIO DATA ENGINEERING PIPELINE ===');
  const startTime = Date.now();
  let conn;
  try {
    conn = await mysql.createConnection(CONFIG.db);
    LOG.ok('Connessione al database stabilita');

    const rawData = await fetchDati();
    LOG.ok('Dati raccolti con successo');

    const stagione = `${CONFIG.api.season}-${parseInt(CONFIG.api.season) + 1}`;

    await sincronizzaSquadre(conn, rawData.standings);
    await sincronizzaClassifica(conn, rawData.standings, stagione);
    await sincronizzaPartite(conn, rawData.matches, stagione);
    await sincronizzaGiocatori(conn, rawData.scorers, stagione);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    LOG.ok(`=== PIPELINE COMPLETATA in ${elapsed}s ===`);
  } catch (err) {
    LOG.err(`Pipeline fallita: ${err.message}`);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
