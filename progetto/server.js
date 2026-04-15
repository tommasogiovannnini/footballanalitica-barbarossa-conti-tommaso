const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'football_stats_secret_2024';

// ─── DB CONNECTION POOL ───────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'football_stats',
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mancante' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

// ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, password, ruolo } = req.body;
    if (!nome || !email || !password) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    const [existing] = await pool.query('SELECT id FROM utenti WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email già registrata' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO utenti (nome, email, password_hash, ruolo) VALUES (?, ?, ?, ?)',
      [nome, email, hash, ruolo || 'tifoso']
    );
    res.status(201).json({ message: 'Registrazione completata', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM utenti WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenziali non valide' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenziali non valide' });
    const token = jwt.sign({ id: user.id, email: user.email, ruolo: user.ruolo }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, ruolo: user.ruolo } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SQUADRE ─────────────────────────────────────────────────────────────────

// GET /api/squadre
app.get('/api/squadre', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM squadre ORDER BY nome');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/squadre/:id
app.get('/api/squadre/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM squadre WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Squadra non trovata' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLASSIFICA ───────────────────────────────────────────────────────────────

// GET /api/classifica
app.get('/api/classifica', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id, s.nome, s.logo_url,
        cs.punti, cs.partite_giocate, cs.vittorie, cs.pareggi, cs.sconfitte,
        cs.gol_fatti, cs.gol_subiti,
        (cs.gol_fatti - cs.gol_subiti) AS differenza_reti
      FROM classifica_stagionale cs
      JOIN squadre s ON cs.squadra_id = s.id
      WHERE cs.stagione = (SELECT MAX(stagione) FROM classifica_stagionale)
      ORDER BY cs.punti DESC, differenza_reti DESC, cs.gol_fatti DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GIOCATORI ────────────────────────────────────────────────────────────────

// GET /api/giocatori
app.get('/api/giocatori', authMiddleware, async (req, res) => {
  try {
    const { squadra_id } = req.query;
    let query = 'SELECT g.*, s.nome AS squadra_nome FROM giocatori g JOIN squadre s ON g.squadra_id = s.id';
    const params = [];
    if (squadra_id) { query += ' WHERE g.squadra_id = ?'; params.push(squadra_id); }
    query += ' ORDER BY g.cognome';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/giocatori/:id/statistiche
app.get('/api/giocatori/:id/statistiche', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const [giocatore] = await pool.query(
      'SELECT g.*, s.nome AS squadra_nome FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE g.id = ?', [id]
    );
    if (giocatore.length === 0) return res.status(404).json({ error: 'Giocatore non trovato' });

    const [stats] = await pool.query(
      'SELECT * FROM statistiche_giocatore WHERE giocatore_id = ? ORDER BY stagione DESC LIMIT 1', [id]
    );

    const [recentPerf] = await pool.query(`
      SELECT pg.*, p.data_partita, 
             sq_casa.nome AS squadra_casa, sq_ospite.nome AS squadra_ospite,
             p.gol_casa, p.gol_ospite
      FROM prestazioni_partita pg
      JOIN partite p ON pg.partita_id = p.id
      JOIN squadre sq_casa ON p.squadra_casa_id = sq_casa.id
      JOIN squadre sq_ospite ON p.squadra_ospite_id = sq_ospite.id
      WHERE pg.giocatore_id = ?
      ORDER BY p.data_partita DESC LIMIT 5
    `, [id]);

    // Calcolo KPI del giocatore
    const kpi = calcolaKPI(stats[0] || {});

    res.json({
      giocatore: giocatore[0],
      statistiche: stats[0] || {},
      prestazioni_recenti: recentPerf,
      kpi
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PARTITE ─────────────────────────────────────────────────────────────────

// GET /api/partite
app.get('/api/partite', authMiddleware, async (req, res) => {
  try {
    const { stato, squadra_id } = req.query;
    let query = `
      SELECT p.*, 
             sc.nome AS squadra_casa_nome, sc.logo_url AS logo_casa,
             so.nome AS squadra_ospite_nome, so.logo_url AS logo_ospite
      FROM partite p
      JOIN squadre sc ON p.squadra_casa_id = sc.id
      JOIN squadre so ON p.squadra_ospite_id = so.id
      WHERE 1=1
    `;
    const params = [];
    if (stato) { query += ' AND p.stato = ?'; params.push(stato); }
    if (squadra_id) { query += ' AND (p.squadra_casa_id = ? OR p.squadra_ospite_id = ?)'; params.push(squadra_id, squadra_id); }
    query += ' ORDER BY p.data_partita DESC LIMIT 20';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/partite/prossime
app.get('/api/partite/prossime', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             sc.nome AS squadra_casa_nome, sc.logo_url AS logo_casa,
             so.nome AS squadra_ospite_nome, so.logo_url AS logo_ospite
      FROM partite p
      JOIN squadre sc ON p.squadra_casa_id = sc.id
      JOIN squadre so ON p.squadra_ospite_id = so.id
      WHERE p.stato = 'programmata' AND p.data_partita >= CURDATE()
      ORDER BY p.data_partita ASC LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ALGORITMO DI ANALISI: PREVISIONE PARTITA ────────────────────────────────
// Usa Elo rating + forma recente + vantaggio casa

// GET /api/analisi/previsione/:squadra_casa_id/:squadra_ospite_id
app.get('/api/analisi/previsione/:squadra_casa_id/:squadra_ospite_id', authMiddleware, async (req, res) => {
  try {
    const { squadra_casa_id, squadra_ospite_id } = req.params;

    // Recupera statistiche stagionali delle due squadre
    const [casa] = await pool.query(
      'SELECT * FROM classifica_stagionale WHERE squadra_id = ? ORDER BY stagione DESC LIMIT 1',
      [squadra_casa_id]
    );
    const [ospite] = await pool.query(
      'SELECT * FROM classifica_stagionale WHERE squadra_id = ? ORDER BY stagione DESC LIMIT 1',
      [squadra_ospite_id]
    );

    if (casa.length === 0 || ospite.length === 0) {
      return res.status(404).json({ error: 'Dati insufficienti per la previsione' });
    }

    // Recupera ultimi 5 risultati per calcolare la forma
    const [formaCasa] = await pool.query(`
      SELECT gol_casa, gol_ospite, squadra_casa_id, squadra_ospite_id FROM partite
      WHERE (squadra_casa_id = ? OR squadra_ospite_id = ?) AND stato = 'completata'
      ORDER BY data_partita DESC LIMIT 5
    `, [squadra_casa_id, squadra_casa_id]);

    const [formaOspite] = await pool.query(`
      SELECT gol_casa, gol_ospite, squadra_casa_id, squadra_ospite_id FROM partite
      WHERE (squadra_casa_id = ? OR squadra_ospite_id = ?) AND stato = 'completata'
      ORDER BY data_partita DESC LIMIT 5
    `, [squadra_ospite_id, squadra_ospite_id]);

    const previsione = calcolaPrevisionePartita(casa[0], ospite[0], formaCasa, squadra_casa_id, formaOspite, squadra_ospite_id);

    res.json(previsione);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analisi/top-giocatori
app.get('/api/analisi/top-giocatori', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT g.nome, g.cognome, s.nome AS squadra, sg.ruolo,
             sg.gol, sg.assist, sg.minuti_giocati, sg.tiri_in_porta,
             sg.passaggi_riusciti, sg.contrasti_vinti,
             ROUND(
               (sg.gol * 10 + sg.assist * 6 + sg.tiri_in_porta * 2 + 
                sg.passaggi_riusciti * 0.1 + sg.contrasti_vinti * 1.5) / 
               GREATEST(sg.minuti_giocati / 90, 1), 2
             ) AS rating_per_partita
      FROM statistiche_giocatore sg
      JOIN giocatori g ON sg.giocatore_id = g.id
      JOIN squadre s ON g.squadra_id = s.id
      WHERE sg.stagione = (SELECT MAX(stagione) FROM statistiche_giocatore)
      ORDER BY rating_per_partita DESC LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ALGORITMI DI ANALISI ────────────────────────────────────────────────────

/**
 * Algoritmo di previsione partita basato su:
 * 1. Win-rate storico (40%)
 * 2. Differenza reti (30%)
 * 3. Forma recente ultimi 5 match (30%)
 * Output: probabilità vittoria_casa, pareggio, vittoria_ospite
 */
function calcolaPrevisionePartita(casa, ospite, formaCasa, casaId, formaOspite, ospiteId) {
  // 1. Win rate
  const winRateCasa = casa.partite_giocate > 0 ? (casa.vittorie + 0.5 * casa.pareggi) / casa.partite_giocate : 0.33;
  const winRateOspite = ospite.partite_giocate > 0 ? (ospite.vittorie + 0.5 * ospite.pareggi) / ospite.partite_giocate : 0.33;

  // 2. Differenza reti per partita
  const drCasa = casa.partite_giocate > 0 ? (casa.gol_fatti - casa.gol_subiti) / casa.partite_giocate : 0;
  const drOspite = ospite.partite_giocate > 0 ? (ospite.gol_fatti - ospite.gol_subiti) / ospite.partite_giocate : 0;

  // 3. Forma recente: 3pt vittoria, 1pt pareggio, 0pt sconfitta
  const calcolaForma = (partite, squadraId) => {
    if (!partite.length) return 0.5;
    let punti = 0;
    partite.forEach(p => {
      const inCasa = p.squadra_casa_id == squadraId;
      const gfSquadra = inCasa ? p.gol_casa : p.gol_ospite;
      const gsSquadra = inCasa ? p.gol_ospite : p.gol_casa;
      if (gfSquadra > gsSquadra) punti += 3;
      else if (gfSquadra === gsSquadra) punti += 1;
    });
    return punti / (partite.length * 3);
  };

  const formaCasaNorm = calcolaForma(formaCasa, casaId);
  const formaOspiteNorm = calcolaForma(formaOspite, ospiteId);

  // Punteggio composito (vantaggio casa +5%)
  const HOME_ADVANTAGE = 0.05;
  const scoreCasa = (winRateCasa * 0.4 + normalizzaDR(drCasa) * 0.3 + formaCasaNorm * 0.3) + HOME_ADVANTAGE;
  const scoreOspite = winRateOspite * 0.4 + normalizzaDR(drOspite) * 0.3 + formaOspiteNorm * 0.3;

  const totale = scoreCasa + scoreOspite;
  const rawCasa = scoreCasa / totale;
  const rawOspite = scoreOspite / totale;

  // Probabilità pareggio basata su quanto sono vicine le squadre
  const vicinanza = 1 - Math.abs(rawCasa - rawOspite);
  const probPareggio = Math.max(0.1, Math.min(0.35, vicinanza * 0.35));
  const probCasa = rawCasa * (1 - probPareggio);
  const probOspite = rawOspite * (1 - probPareggio);

  // Normalizza a 100%
  const somma = probCasa + probPareggio + probOspite;

  return {
    vittoria_casa: Math.round((probCasa / somma) * 100),
    pareggio: Math.round((probPareggio / somma) * 100),
    vittoria_ospite: Math.round((probOspite / somma) * 100),
    dettagli: {
      forma_casa: Math.round(formaCasaNorm * 100),
      forma_ospite: Math.round(formaOspiteNorm * 100),
      win_rate_casa: Math.round(winRateCasa * 100),
      win_rate_ospite: Math.round(winRateOspite * 100),
    }
  };
}

function normalizzaDR(dr) {
  // Normalizza differenza reti [-5, +5] → [0, 1]
  return Math.max(0, Math.min(1, (dr + 5) / 10));
}

/**
 * Calcola KPI giocatore: rating globale su scala 0-10
 */
function calcolaKPI(stats) {
  if (!stats || !stats.minuti_giocati) return { rating: 0, livello: 'N/D' };
  const partite = Math.max(1, stats.minuti_giocati / 90);
  const rating = Math.min(10,
    (stats.gol * 2.5 + stats.assist * 1.5 + stats.tiri_in_porta * 0.3 +
     (stats.passaggi_riusciti || 0) * 0.01 + (stats.contrasti_vinti || 0) * 0.2) / partite
  );
  const livello = rating >= 8 ? 'Elite' : rating >= 6 ? 'Buono' : rating >= 4 ? 'Nella media' : 'In crescita';
  return { rating: Math.round(rating * 10) / 10, livello };
}

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server avviato su porta ${PORT}`));
