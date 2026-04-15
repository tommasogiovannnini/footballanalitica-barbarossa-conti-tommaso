import { useState, useEffect, useCallback } from "react";

// ─── MOCK API (sostituire con chiamate reali al backend) ──────
const API_BASE = "http://localhost:3001/api";

const mockToken = "mock_jwt_token";

const mockData = {
  classifica: [
    { id:1, nome:"FC Juventus",  punti:68, partite_giocate:31, vittorie:21, pareggi:5, sconfitte:5,  gol_fatti:62, gol_subiti:28, differenza_reti:34 },
    { id:2, nome:"Inter Milan",  punti:65, partite_giocate:31, vittorie:20, pareggi:5, sconfitte:6,  gol_fatti:58, gol_subiti:32, differenza_reti:26 },
    { id:3, nome:"SSC Napoli",   punti:60, partite_giocate:31, vittorie:18, pareggi:6, sconfitte:7,  gol_fatti:55, gol_subiti:35, differenza_reti:20 },
    { id:4, nome:"AC Milan",     punti:55, partite_giocate:31, vittorie:16, pareggi:7, sconfitte:8,  gol_fatti:48, gol_subiti:38, differenza_reti:10 },
    { id:5, nome:"Atalanta BC",  punti:52, partite_giocate:31, vittorie:15, pareggi:7, sconfitte:9,  gol_fatti:50, gol_subiti:42, differenza_reti:8  },
    { id:6, nome:"AS Roma",      punti:45, partite_giocate:31, vittorie:13, pareggi:6, sconfitte:12, gol_fatti:40, gol_subiti:48, differenza_reti:-8 },
  ],
  giocatore: {
    giocatore: { id:1, nome:"Mario", cognome:"Rossi", ruolo:"attaccante", numero_maglia:9, squadra_nome:"FC Juventus" },
    statistiche: { gol:18, assist:7, minuti_giocati:2340, tiri_in_porta:42, passaggi_riusciti:980, partite_giocate:28 },
    kpi: { rating:8.4, livello:"Elite" },
    prestazioni_recenti: [
      { partita_id:1, gol:2, assist:1, voto:8.5, squadra_casa:"FC Juventus", squadra_ospite:"AC Milan",    data_partita:"2025-01-15" },
      { partita_id:2, gol:0, assist:1, voto:6.5, squadra_casa:"Inter Milan",  squadra_ospite:"FC Juventus", data_partita:"2025-01-22" },
      { partita_id:3, gol:1, assist:0, voto:7.0, squadra_casa:"FC Juventus", squadra_ospite:"AS Roma",     data_partita:"2025-02-02" },
    ],
  },
  prossimePartite: [
    { id:10, squadra_casa_nome:"FC Juventus", squadra_ospite_nome:"Inter Milan",  data_partita:"2025-04-20T20:45:00", giornata:32 },
    { id:11, squadra_casa_nome:"AC Milan",     squadra_ospite_nome:"SSC Napoli",   data_partita:"2025-04-21T18:00:00", giornata:32 },
    { id:12, squadra_casa_nome:"AS Roma",      squadra_ospite_nome:"Atalanta BC",  data_partita:"2025-04-22T20:45:00", giornata:32 },
  ],
  previsione: { vittoria_casa:50, pareggio:25, vittoria_ospite:25, dettagli:{ forma_casa:72, forma_ospite:58, win_rate_casa:68, win_rate_ospite:54 } },
  topGiocatori: [
    { nome:"Mario",   cognome:"Rossi",    squadra:"FC Juventus", gol:18, assist:7,  rating_per_partita:8.4 },
    { nome:"Filippo", cognome:"Esposito", squadra:"Inter Milan",  gol:14, assist:9,  rating_per_partita:7.9 },
    { nome:"Giovanni",cognome:"Ricci",    squadra:"Inter Milan",  gol:8,  assist:15, rating_per_partita:7.2 },
    { nome:"Davide",  cognome:"Lombardi", squadra:"SSC Napoli",   gol:12, assist:6,  rating_per_partita:6.8 },
    { nome:"Luca",    cognome:"Ferrari",  squadra:"FC Juventus",  gol:5,  assist:12, rating_per_partita:6.5 },
  ],
};

// ─── COLORI SQUADRA ───────────────────────────────────────────
const squadraColori = {
  "FC Juventus": "#1a1a2e", "Inter Milan": "#003399",
  "SSC Napoli": "#009fe3",  "AC Milan": "#cc0000",
  "Atalanta BC": "#1e3a8a", "AS Roma": "#cc0000",
};

// ─── COMPONENTI ───────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ricordami, setRicordami] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrore("");
    await new Promise(r => setTimeout(r, 800));
    if (email && password) {
      onLogin({ token: mockToken, user: { nome: "Mario Rossi", email, ruolo: "analista" } });
    } else {
      setErrore("Inserisci email e password");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2333 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "rgba(22,27,34,0.95)", border: "1px solid #30363d",
        borderRadius: 16, padding: "48px 40px", width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚽</div>
          <h1 style={{ color: "#e6edf3", margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Football Stats Dashboard
          </h1>
          <p style={{ color: "#8b949e", margin: "8px 0 0", fontSize: 14 }}>Accedi alla tua piattaforma</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#8b949e", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email:</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", background: "#0d1117",
              border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
              fontSize: 14, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#58a6ff"}
            onBlur={e => e.target.style.borderColor = "#30363d"}
            placeholder="utente@email.it"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#8b949e", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password:</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", background: "#0d1117",
              border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#58a6ff"}
            onBlur={e => e.target.style.borderColor = "#30363d"}
            placeholder="••••••••"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <input
            type="checkbox" id="ricordami" checked={ricordami}
            onChange={e => setRicordami(e.target.checked)}
            style={{ accentColor: "#58a6ff", cursor: "pointer" }}
          />
          <label htmlFor="ricordami" style={{ color: "#8b949e", fontSize: 14, cursor: "pointer" }}>
            Ricordami
          </label>
        </div>

        {errore && (
          <div style={{ background: "#3d1515", border: "1px solid #f85149", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#f85149", fontSize: 13 }}>
            {errore}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", background: loading ? "#21262d" : "#238636",
            border: "none", borderRadius: 8, color: "#fff", fontSize: 15,
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s", letterSpacing: "0.3px",
          }}
        >
          {loading ? "Accesso in corso..." : "ACCEDI"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, color: "#8b949e", fontSize: 13 }}>
          Non hai un account?{" "}
          <span style={{ color: "#58a6ff", cursor: "pointer" }}>Registrati</span>
        </p>
      </div>
    </div>
  );
}

// ─── BARRA LATERALE ───────────────────────────────────────────
function Sidebar({ sezioneAttiva, setSezione, onLogout, user }) {
  const voci = [
    { id: "dashboard", label: "Dashboard", icona: "📊" },
    { id: "classifica", label: "Classifica", icona: "🏆" },
    { id: "giocatori", label: "Statistiche", icona: "👤" },
    { id: "partite", label: "Partite", icona: "📅" },
    { id: "previsioni", label: "Previsioni", icona: "🔮" },
    { id: "topgiocatori", label: "Top Giocatori", icona: "⭐" },
  ];

  return (
    <div style={{
      width: 220, minHeight: "100vh", background: "#161b22",
      borderRight: "1px solid #30363d", display: "flex",
      flexDirection: "column", padding: "20px 0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #30363d" }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>⚽</div>
        <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 15 }}>Football Stats</div>
        <div style={{ color: "#58a6ff", fontSize: 12 }}>{user?.ruolo || "analista"}</div>
      </div>

      <nav style={{ flex: 1, padding: "16px 0" }}>
        {voci.map(v => (
          <div
            key={v.id}
            onClick={() => setSezione(v.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 20px", cursor: "pointer",
              background: sezioneAttiva === v.id ? "rgba(88,166,255,0.1)" : "transparent",
              borderLeft: sezioneAttiva === v.id ? "3px solid #58a6ff" : "3px solid transparent",
              color: sezioneAttiva === v.id ? "#58a6ff" : "#8b949e",
              fontSize: 14, fontWeight: sezioneAttiva === v.id ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 16 }}>{v.icona}</span>
            {v.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid #30363d" }}>
        <div style={{ color: "#e6edf3", fontSize: 13, marginBottom: 4 }}>{user?.nome}</div>
        <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 12 }}>{user?.email}</div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "8px", background: "transparent",
            border: "1px solid #f85149", borderRadius: 6, color: "#f85149",
            fontSize: 13, cursor: "pointer",
          }}
        >
          Esci
        </button>
      </div>
    </div>
  );
}

// ─── SEZIONE DASHBOARD ────────────────────────────────────────
function DashboardHome({ data }) {
  const cards = [
    { label: "Squadre in classifica", valore: data.classifica.length, icona: "🏟️", colore: "#58a6ff" },
    { label: "Top marcatore",         valore: `${data.topGiocatori[0]?.cognome} (${data.topGiocatori[0]?.gol} gol)`, icona: "⚽", colore: "#3fb950" },
    { label: "Prossime partite",      valore: data.prossimePartite.length, icona: "📅", colore: "#d29922" },
    { label: "Leader classifica",     valore: data.classifica[0]?.nome, icona: "🏆", colore: "#bc8cff" },
  ];

  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>📊 Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: "#161b22", border: "1px solid #30363d", borderRadius: 12,
            padding: "20px 24px",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icona}</div>
            <div style={{ color: c.colore, fontSize: 20, fontWeight: 700 }}>{c.valore}</div>
            <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Mini classifica */}
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: "#e6edf3", margin: "0 0 16px", fontSize: 16 }}>🏆 Top 3 Classifica</h3>
        {data.classifica.slice(0, 3).map((s, i) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: i < 2 ? "1px solid #21262d" : "none",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i === 0 ? "#d29922" : i === 1 ? "#8b949e" : "#6e4c13",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>{s.nome}</div>
            </div>
            <div style={{ color: "#3fb950", fontWeight: 700, fontSize: 16 }}>{s.punti} pt</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEZIONE CLASSIFICA ───────────────────────────────────────
function Classifica({ classifica }) {
  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>🏆 Classifica Serie A 2024/25</h2>
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#0d1117" }}>
              {["#", "Squadra", "Pt", "PG", "V", "P", "S", "GF", "GS", "DR"].map(h => (
                <th key={h} style={{ padding: "12px 10px", color: "#8b949e", fontWeight: 600, textAlign: h === "Squadra" ? "left" : "center", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classifica.map((sq, i) => (
              <tr key={sq.id} style={{
                borderTop: "1px solid #21262d",
                background: i < 4 ? "rgba(63,185,80,0.04)" : i > classifica.length - 4 ? "rgba(248,81,73,0.04)" : "transparent",
              }}>
                <td style={{ padding: "12px 10px", textAlign: "center", color: i < 4 ? "#3fb950" : "#8b949e", fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: "12px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: squadraColori[sq.nome] || "#58a6ff",
                    }} />
                    <span style={{ color: "#e6edf3", fontWeight: i < 3 ? 700 : 400 }}>{sq.nome}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#3fb950", fontWeight: 700 }}>{sq.punti}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#8b949e" }}>{sq.partite_giocate}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#e6edf3" }}>{sq.vittorie}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#e6edf3" }}>{sq.pareggi}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#e6edf3" }}>{sq.sconfitte}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#e6edf3" }}>{sq.gol_fatti}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#e6edf3" }}>{sq.gol_subiti}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: sq.differenza_reti >= 0 ? "#3fb950" : "#f85149", fontWeight: 600 }}>
                  {sq.differenza_reti > 0 ? "+" : ""}{sq.differenza_reti}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b949e", fontSize: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(63,185,80,0.3)" }} />Champions League
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b949e", fontSize: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(248,81,73,0.3)" }} />Retrocessione
        </div>
      </div>
    </div>
  );
}

// ─── SEZIONE STATISTICHE GIOCATORE ───────────────────────────
function StatisticheGiocatore({ dati }) {
  const { giocatore, statistiche, kpi, prestazioni_recenti } = dati;
  const statItems = [
    { label: "Goal",   valore: statistiche.gol,             icona: "⚽" },
    { label: "Assist", valore: statistiche.assist,           icona: "🅰️" },
    { label: "Minuti", valore: statistiche.minuti_giocati,   icona: "⏱️" },
    { label: "Tiri",   valore: statistiche.tiri_in_porta,    icona: "🎯" },
  ];

  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>👤 Statistiche Giocatore</h2>
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        {/* Header giocatore */}
        <div style={{
          background: "#0d1117", border: "1px solid #30363d", borderRadius: 10,
          padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%",
            background: `linear-gradient(135deg, ${squadraColori[giocatore.squadra_nome] || "#21262d"}, #30363d)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#fff",
          }}>
            {giocatore.numero_maglia}
          </div>
          <div>
            <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 18 }}>{giocatore.nome} {giocatore.cognome}</div>
            <div style={{ color: "#8b949e", fontSize: 14 }}>Squadra: {giocatore.squadra_nome}</div>
            <div style={{ color: "#58a6ff", fontSize: 13, marginTop: 2 }}>{giocatore.ruolo} • Rating: <strong style={{ color: "#d29922" }}>{kpi.rating}</strong> ({kpi.livello})</div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {statItems.map(s => (
            <div key={s.label} style={{
              background: "#0d1117", border: "1px solid #30363d", borderRadius: 10,
              padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icona}</div>
              <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 20 }}>{s.valore}</div>
              <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* KPI bar */}
        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#8b949e", fontSize: 13 }}>Performance Rating</span>
            <span style={{ color: "#d29922", fontWeight: 700 }}>{kpi.rating}/10</span>
          </div>
          <div style={{ background: "#21262d", borderRadius: 4, height: 8 }}>
            <div style={{
              width: `${kpi.rating * 10}%`, height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, #3fb950, #d29922)",
            }} />
          </div>
        </div>

        {/* Prestazioni recenti */}
        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 12 }}>Prestazioni Recenti</div>
          {prestazioni_recenti.map((p, i) => (
            <div key={p.partita_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: i < prestazioni_recenti.length - 1 ? "1px solid #21262d" : "none",
            }}>
              <div>
                <span style={{ color: "#8b949e", fontSize: 12 }}>Partita {i + 1}</span>
                <span style={{ color: "#e6edf3", fontSize: 13, marginLeft: 8 }}>
                  {p.gol > 0 && `${p.gol} gol`} {p.assist > 0 && `${p.assist} assist`}
                  {p.gol === 0 && p.assist === 0 && "—"}
                </span>
              </div>
              <div style={{
                background: p.voto >= 7 ? "rgba(63,185,80,0.2)" : p.voto >= 6 ? "rgba(210,153,34,0.2)" : "rgba(248,81,73,0.2)",
                color: p.voto >= 7 ? "#3fb950" : p.voto >= 6 ? "#d29922" : "#f85149",
                borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 13,
              }}>
                {p.voto}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SEZIONE PARTITE ─────────────────────────────────────────
function Partite({ prossime }) {
  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>📅 Prossime Partite</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {prossime.map(p => {
          const data = new Date(p.data_partita);
          return (
            <div key={p.id} style={{
              background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 16 }}>{p.squadra_casa_nome}</div>
                <div style={{ color: "#8b949e", fontSize: 12 }}>Casa</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 20px" }}>
                <div style={{
                  background: "#0d1117", border: "1px solid #30363d", borderRadius: 8,
                  padding: "8px 16px", color: "#58a6ff", fontWeight: 700, fontSize: 18,
                }}>VS</div>
                <div style={{ color: "#8b949e", fontSize: 12, marginTop: 6 }}>
                  {data.toLocaleDateString("it-IT")} {data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>Giornata {p.giornata}</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 16 }}>{p.squadra_ospite_nome}</div>
                <div style={{ color: "#8b949e", fontSize: 12 }}>Ospite</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SEZIONE PREVISIONI ───────────────────────────────────────
function Previsioni({ classifica, previsione: prevIniziale }) {
  const [casaId, setCasaId] = useState(0);
  const [ospiteId, setOspiteId] = useState(1);
  const [prev, setPrev] = useState(prevIniziale);

  const calcolaLocale = () => {
    const casa = classifica[casaId];
    const ospite = classifica[ospiteId];
    if (!casa || !ospite || casaId === ospiteId) return;
    const wrCasa = casa.vittorie / casa.partite_giocate + 0.05;
    const wrOspite = ospite.vittorie / ospite.partite_giocate;
    const tot = wrCasa + wrOspite;
    const vc = Math.round((wrCasa / tot) * 65);
    const vo = Math.round((wrOspite / tot) * 65);
    const par = 100 - vc - vo;
    setPrev({ vittoria_casa: vc, pareggio: par, vittoria_ospite: vo,
      dettagli: { win_rate_casa: Math.round(wrCasa*100), win_rate_ospite: Math.round(wrOspite*100) } });
  };

  const BarraProbabilita = ({ label, valore, colore }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#8b949e", fontSize: 14 }}>{label}</span>
        <span style={{ color: colore, fontWeight: 700, fontSize: 18 }}>{valore}%</span>
      </div>
      <div style={{ background: "#21262d", borderRadius: 6, height: 12 }}>
        <div style={{
          width: `${valore}%`, height: "100%", borderRadius: 6,
          background: colore, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>🔮 Previsione Partita</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", color: "#8b949e", fontSize: 13, marginBottom: 6 }}>Squadra A (Casa)</label>
          <select
            value={casaId}
            onChange={e => setCasaId(Number(e.target.value))}
            style={{
              width: "100%", padding: "10px 14px", background: "#0d1117",
              border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
              fontSize: 14, cursor: "pointer",
            }}
          >
            {classifica.map((s, i) => <option key={s.id} value={i}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", color: "#8b949e", fontSize: 13, marginBottom: 6 }}>Squadra B (Ospite)</label>
          <select
            value={ospiteId}
            onChange={e => setOspiteId(Number(e.target.value))}
            style={{
              width: "100%", padding: "10px 14px", background: "#0d1117",
              border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
              fontSize: 14, cursor: "pointer",
            }}
          >
            {classifica.map((s, i) => <option key={s.id} value={i}>{s.nome}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={calcolaLocale}
        style={{
          padding: "10px 24px", background: "#238636", border: "none",
          borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer",
          marginBottom: 24, fontSize: 14,
        }}
      >
        Calcola Previsione
      </button>

      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: "center", color: "#8b949e", fontSize: 13, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
          Previsione
        </div>

        <div style={{
          display: "flex", justifyContent: "space-around", marginBottom: 28,
          padding: "16px", background: "#0d1117", borderRadius: 10,
          border: "1px solid #30363d",
        }}>
          {[
            { label: `Squadra A`, valore: `${prev.vittoria_casa}%`, colore: "#3fb950" },
            { label: "Pareggio",   valore: `${prev.pareggio}%`,     colore: "#d29922" },
            { label: `Squadra B`,  valore: `${prev.vittoria_ospite}%`, colore: "#58a6ff" },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ color: item.colore, fontWeight: 800, fontSize: 28 }}>{item.valore}</div>
              <div style={{ color: "#8b949e", fontSize: 12, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        <BarraProbabilita label={`Vittoria ${classifica[casaId]?.nome}`} valore={prev.vittoria_casa} colore="#3fb950" />
        <BarraProbabilita label="Pareggio" valore={prev.pareggio} colore="#d29922" />
        <BarraProbabilita label={`Vittoria ${classifica[ospiteId]?.nome}`} valore={prev.vittoria_ospite} colore="#58a6ff" />

        <div style={{ marginTop: 16, padding: 12, background: "#0d1117", borderRadius: 8, color: "#8b949e", fontSize: 12 }}>
          ℹ️ Algoritmo basato su win-rate stagionale (40%), differenza reti (30%) e forma recente (30%) con vantaggio campo +5%.
        </div>
      </div>
    </div>
  );
}

// ─── TOP GIOCATORI ────────────────────────────────────────────
function TopGiocatori({ giocatori }) {
  return (
    <div>
      <h2 style={{ color: "#e6edf3", marginBottom: 24, fontSize: 22, fontWeight: 700 }}>⭐ Top Giocatori</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {giocatori.map((g, i) => (
          <div key={i} style={{
            background: "#161b22", border: "1px solid #30363d", borderRadius: 12,
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: i === 0 ? "#d29922" : i === 1 ? "#8b949e" : i === 2 ? "#6e4c13" : "#21262d",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16,
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 700 }}>{g.nome} {g.cognome}</div>
              <div style={{ color: "#8b949e", fontSize: 12 }}>{g.squadra}</div>
            </div>
            <div style={{ display: "flex", gap: 16, textAlign: "center" }}>
              <div>
                <div style={{ color: "#3fb950", fontWeight: 700, fontSize: 18 }}>{g.gol}</div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>Gol</div>
              </div>
              <div>
                <div style={{ color: "#58a6ff", fontWeight: 700, fontSize: 18 }}>{g.assist}</div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>Assist</div>
              </div>
              <div>
                <div style={{ color: "#d29922", fontWeight: 700, fontSize: 18 }}>{g.rating_per_partita}</div>
                <div style={{ color: "#8b949e", fontSize: 11 }}>Rating</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ───────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null);
  const [sezione, setSezione] = useState("dashboard");
  const data = mockData;

  const handleLogin = (authData) => setAuth(authData);
  const handleLogout = () => setAuth(null);

  if (!auth) return <LoginPage onLogin={handleLogin} />;

  const renderSezione = () => {
    switch (sezione) {
      case "dashboard":   return <DashboardHome data={data} />;
      case "classifica":  return <Classifica classifica={data.classifica} />;
      case "giocatori":   return <StatisticheGiocatore dati={data.giocatore} />;
      case "partite":     return <Partite prossime={data.prossimePartite} />;
      case "previsioni":  return <Previsioni classifica={data.classifica} previsione={data.previsione} />;
      case "topgiocatori":return <TopGiocatori giocatori={data.topGiocatori} />;
      default:            return null;
    }
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <Sidebar sezioneAttiva={sezione} setSezione={setSezione} onLogout={handleLogout} user={auth.user} />
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        {renderSezione()}
      </main>
    </div>
  );
}
