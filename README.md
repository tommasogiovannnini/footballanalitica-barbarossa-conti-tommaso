# football-analitica-barbarossa-conti-tommaso
@ -1,103 +0,0 @@
# ⚽ Football Stats Dashboard

Piattaforma di sport-analytics per la visualizzazione di dati calcistici, statistiche giocatori, classifica e previsioni partite.

## 📁 Struttura del Progetto

```
football-stats/
├── frontend/
│   └── src/
│       └── App.jsx          # React app completa (login + dashboard)
├── backend/
│   ├── server.js            # Node.js/Express - tutti gli endpoint
│   └── package.json
├── database/
│   └── schema.sql           # Schema MySQL + dati di esempio
└── data_engineering/
    └── data_engineering.js  # Script ETL (raccolta, pulizia, inserimento)
```

## 🚀 Avvio Rapido

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
DB_HOST=localhost DB_USER=root DB_PASS=tuapassword node server.js
# Server avviato su porta 3001
```

### 3. Data Engineering
```bash
cd data_engineering
npm install mysql2
# Con dati mock (test):
node data_engineering.js --mock
# Con API reale (serve chiave gratuita su football-data.org):
FOOTBALL_API_KEY=la_tua_chiave node data_engineering.js
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🗄️ Database - Schema Logico

**Entità principali:**
- `utenti(id, nome, email, password_hash, ruolo)`
- `squadre(id, nome, citta, stadio, logo_url, ...)`
- `giocatori(id, nome, cognome, data_nascita, ruolo, numero_maglia, squadra_id)`
- `partite(id, squadra_casa_id, squadra_ospite_id, data_partita, gol_casa, gol_ospite, stato, stagione)`
- `statistiche_giocatore(id, giocatore_id, stagione, gol, assist, minuti_giocati, ...)`
- `prestazioni_partita(id, giocatore_id, partita_id, gol, assist, voto)`
- `classifica_stagionale(id, squadra_id, stagione, punti, vittorie, pareggi, sconfitte, ...)`

## 🔌 Endpoint API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrazione utente |
| POST | `/api/auth/login` | Login, ritorna JWT |
| GET | `/api/squadre` | Lista squadre |
| GET | `/api/classifica` | Classifica stagionale |
| GET | `/api/giocatori` | Lista giocatori (filtro per squadra) |
| GET | `/api/giocatori/:id/statistiche` | Statistiche + KPI giocatore |
| GET | `/api/partite` | Lista partite (filtro stato/squadra) |
| GET | `/api/partite/prossime` | Prossime partite programmate |
| GET | `/api/analisi/previsione/:casa/:ospite` | Previsione risultato partita |
| GET | `/api/analisi/top-giocatori` | Top 10 giocatori per rating |

## 🧮 Algoritmo di Previsione

L'algoritmo calcola la probabilità di vittoria/pareggio/sconfitta combinando:
1. **Win-rate storico** (40%) — vittorie + 0.5*pareggi / partite giocate
2. **Differenza reti per partita** (30%) — normalizzata in [0,1]
3. **Forma recente** (30%) — punteggio ultimi 5 match (V=3, P=1, S=0)
4. **Vantaggio campo** (+5% alla squadra di casa)

La probabilità di pareggio viene calcolata proporzionalmente alla vicinanza dei punteggi delle due squadre (più sono equilibrate, più alta è la prob. di pareggio).

## 📊 Algoritmo KPI Giocatore

```
rating = (gol*2.5 + assist*1.5 + tiri_in_porta*0.3 + 
          passaggi_riusciti*0.01 + contrasti_vinti*0.2) / partite_giocate
```
Scala: 0-10 | Livelli: Elite (≥8), Buono (≥6), Nella media (≥4), In crescita (<4)

## 🛠️ Tecnologie

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: MySQL (normalizzato in 3NF)
- **Autenticazione**: JWT + bcrypt
- **Data Engineering**: Node.js + mysql2 + API football-data.org