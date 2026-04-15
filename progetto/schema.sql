

CREATE DATABASE IF NOT EXISTS football_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE football_stats;


CREATE TABLE IF NOT EXISTS utenti (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  ruolo           ENUM('admin', 'allenatore', 'analista', 'tifoso') DEFAULT 'tifoso',
  creato_il       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS squadre (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  citta           VARCHAR(100),
  stadio          VARCHAR(100),
  logo_url        VARCHAR(255),
  anno_fondazione INT,
  colore_primario VARCHAR(7),
  colore_secondario VARCHAR(7)
);


CREATE TABLE IF NOT EXISTS giocatori (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  cognome         VARCHAR(100) NOT NULL,
  data_nascita    DATE,
  nazionalita     VARCHAR(100),
  ruolo           ENUM('portiere','difensore','centrocampista','attaccante'),
  numero_maglia   TINYINT UNSIGNED,
  squadra_id      INT NOT NULL,
  foto_url        VARCHAR(255),
  FOREIGN KEY (squadra_id) REFERENCES squadre(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS partite (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  squadra_casa_id     INT NOT NULL,
  squadra_ospite_id   INT NOT NULL,
  data_partita        DATETIME NOT NULL,
  stadio              VARCHAR(100),
  gol_casa            TINYINT UNSIGNED DEFAULT NULL,
  gol_ospite          TINYINT UNSIGNED DEFAULT NULL,
  stato               ENUM('programmata','in_corso','completata','rinviata') DEFAULT 'programmata',
  stagione            VARCHAR(9) NOT NULL,  -- es. '2024-2025'
  giornata            TINYINT UNSIGNED,
  competizione        VARCHAR(100) DEFAULT 'Serie A',
  FOREIGN KEY (squadra_casa_id) REFERENCES squadre(id),
  FOREIGN KEY (squadra_ospite_id) REFERENCES squadre(id),
  CHECK (squadra_casa_id <> squadra_ospite_id)
);


CREATE TABLE IF NOT EXISTS statistiche_giocatore (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  giocatore_id        INT NOT NULL,
  stagione            VARCHAR(9) NOT NULL,
  partite_giocate     SMALLINT UNSIGNED DEFAULT 0,
  minuti_giocati      SMALLINT UNSIGNED DEFAULT 0,
  gol                 SMALLINT UNSIGNED DEFAULT 0,
  assist              SMALLINT UNSIGNED DEFAULT 0,
  tiri_totali         SMALLINT UNSIGNED DEFAULT 0,
  tiri_in_porta       SMALLINT UNSIGNED DEFAULT 0,
  passaggi_totali     INT UNSIGNED DEFAULT 0,
  passaggi_riusciti   INT UNSIGNED DEFAULT 0,
  contrasti_vinti     SMALLINT UNSIGNED DEFAULT 0,
  ammonizioni         TINYINT UNSIGNED DEFAULT 0,
  espulsioni          TINYINT UNSIGNED DEFAULT 0,
  UNIQUE KEY (giocatore_id, stagione),
  FOREIGN KEY (giocatore_id) REFERENCES giocatori(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS prestazioni_partita (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  giocatore_id    INT NOT NULL,
  partita_id      INT NOT NULL,
  minuti_giocati  TINYINT UNSIGNED DEFAULT 0,
  gol             TINYINT UNSIGNED DEFAULT 0,
  assist          TINYINT UNSIGNED DEFAULT 0,
  tiri_in_porta   TINYINT UNSIGNED DEFAULT 0,
  ammonizioni     TINYINT UNSIGNED DEFAULT 0,
  espulsioni      TINYINT UNSIGNED DEFAULT 0,
  voto            DECIMAL(3,1),
  UNIQUE KEY (giocatore_id, partita_id),
  FOREIGN KEY (giocatore_id) REFERENCES giocatori(id) ON DELETE CASCADE,
  FOREIGN KEY (partita_id) REFERENCES partite(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS classifica_stagionale (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  squadra_id        INT NOT NULL,
  stagione          VARCHAR(9) NOT NULL,
  punti             SMALLINT UNSIGNED DEFAULT 0,
  partite_giocate   SMALLINT UNSIGNED DEFAULT 0,
  vittorie          SMALLINT UNSIGNED DEFAULT 0,
  pareggi           SMALLINT UNSIGNED DEFAULT 0,
  sconfitte         SMALLINT UNSIGNED DEFAULT 0,
  gol_fatti         SMALLINT UNSIGNED DEFAULT 0,
  gol_subiti        SMALLINT UNSIGNED DEFAULT 0,
  UNIQUE KEY (squadra_id, stagione),
  FOREIGN KEY (squadra_id) REFERENCES squadre(id) ON DELETE CASCADE
);



INSERT INTO squadre (nome, citta, stadio, anno_fondazione, colore_primario, colore_secondario) VALUES
('FC Juventus',       'Torino',  'Allianz Stadium',    1897, '#000000', '#FFFFFF'),
('AC Milan',          'Milano',  'San Siro',            1899, '#FF0000', '#000000'),
('Inter Milan',       'Milano',  'San Siro',            1908, '#0033CC', '#000000'),
('AS Roma',           'Roma',    'Stadio Olimpico',     1927, '#CC0000', '#FFD700'),
('SSC Napoli',        'Napoli',  'Stadio Maradona',     1926, '#009FE3', '#FFFFFF'),
('Atalanta BC',       'Bergamo', 'Gewiss Stadium',      1907, '#1E3A8A', '#000000');

INSERT INTO giocatori (nome, cognome, data_nascita, nazionalita, ruolo, numero_maglia, squadra_id) VALUES
('Mario',     'Rossi',     '1998-03-15', 'Italiana',   'attaccante',     9, 1),
('Luca',      'Ferrari',   '1995-07-22', 'Italiana',   'centrocampista', 8, 1),
('Marco',     'Bianchi',   '2000-11-05', 'Italiana',   'difensore',      5, 2),
('Andrea',    'Conti',     '1997-04-18', 'Italiana',   'portiere',       1, 2),
('Filippo',   'Esposito',  '1999-09-30', 'Italiana',   'attaccante',     10, 3),
('Giovanni',  'Ricci',     '1996-01-12', 'Italiana',   'centrocampista', 6, 3),
('Alessandro','Greco',     '2001-06-25', 'Italiana',   'difensore',      4, 4),
('Davide',    'Lombardi',  '1994-12-08', 'Italiana',   'attaccante',     11, 5);

INSERT INTO statistiche_giocatore 
  (giocatore_id, stagione, partite_giocate, minuti_giocati, gol, assist, tiri_totali, tiri_in_porta, passaggi_totali, passaggi_riusciti, contrasti_vinti, ammonizioni) VALUES
(1, '2024-2025', 28, 2340, 18, 7,  85, 42, 1240, 980, 35, 4),
(2, '2024-2025', 30, 2600, 5,  12, 45, 22, 2100, 1820, 78, 6),
(3, '2024-2025', 25, 2200, 2,  4,  20, 10, 1600, 1350, 95, 3),
(4, '2024-2025', 28, 2520, 0,  0,  0,  0,  890,  760,  30, 1),
(5, '2024-2025', 27, 2250, 14, 9,  70, 35, 1100, 870,  42, 5),
(6, '2024-2025', 32, 2800, 8,  15, 55, 28, 2400, 2100, 90, 7),
(7, '2024-2025', 29, 2580, 1,  3,  15, 8,  1800, 1560, 110,2),
(8, '2024-2025', 26, 2100, 12, 6,  60, 30, 980,  790,  38, 4);

INSERT INTO partite (squadra_casa_id, squadra_ospite_id, data_partita, stadio, gol_casa, gol_ospite, stato, stagione, giornata) VALUES
(1, 2, '2025-01-15 20:45:00', 'Allianz Stadium', 2, 1, 'completata', '2024-2025', 20),
(3, 1, '2025-01-22 18:00:00', 'San Siro',        1, 1, 'completata', '2024-2025', 21),
(1, 4, '2025-02-02 15:00:00', 'Allianz Stadium', 3, 0, 'completata', '2024-2025', 22),
(5, 1, '2025-02-16 20:45:00', 'Stadio Maradona', 1, 2, 'completata', '2024-2025', 23),
(2, 3, '2025-03-01 18:00:00', 'San Siro',        0, 0, 'completata', '2024-2025', 24),
(1, 3, '2025-04-20 20:45:00', 'Allianz Stadium', NULL, NULL, 'programmata', '2024-2025', 32),
(2, 5, '2025-04-21 18:00:00', 'San Siro',        NULL, NULL, 'programmata', '2024-2025', 32),
(4, 6, '2025-04-22 20:45:00', 'Stadio Olimpico', NULL, NULL, 'programmata', '2024-2025', 32);

INSERT INTO classifica_stagionale (squadra_id, stagione, punti, partite_giocate, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti) VALUES
(1, '2024-2025', 68, 31, 21, 5, 5,  62, 28),
(3, '2024-2025', 65, 31, 20, 5, 6,  58, 32),
(5, '2024-2025', 60, 31, 18, 6, 7,  55, 35),
(2, '2024-2025', 55, 31, 16, 7, 8,  48, 38),
(6, '2024-2025', 52, 31, 15, 7, 9,  50, 42),
(4, '2024-2025', 45, 31, 13, 6, 12, 40, 48);

INSERT INTO prestazioni_partita (giocatore_id, partita_id, minuti_giocati, gol, assist, tiri_in_porta, voto) VALUES
(1, 1, 90, 2, 1, 4, 8.5),
(1, 2, 90, 0, 1, 2, 6.5),
(1, 3, 90, 1, 0, 3, 7.0),
(1, 4, 85, 1, 0, 2, 7.5),
(1, 5, 90, 0, 0, 1, 5.5),
(2, 1, 90, 1, 2, 2, 8.0),
(2, 2, 90, 0, 1, 1, 7.0);


CREATE OR REPLACE VIEW v_classifica AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY cs.punti DESC, (cs.gol_fatti - cs.gol_subiti) DESC) AS posizione,
  s.nome AS squadra,
  cs.punti, cs.partite_giocate AS pg,
  cs.vittorie AS v, cs.pareggi AS p, cs.sconfitte AS s_num,
  cs.gol_fatti AS gf, cs.gol_subiti AS gs,
  (cs.gol_fatti - cs.gol_subiti) AS dr
FROM classifica_stagionale cs
JOIN squadre s ON cs.squadra_id = s.id
WHERE cs.stagione = '2024-2025';

CREATE OR REPLACE VIEW v_top_marcatori AS
SELECT 
  g.nome, g.cognome, sq.nome AS squadra,
  sg.gol, sg.assist, sg.partite_giocate
FROM statistiche_giocatore sg
JOIN giocatori g ON sg.giocatore_id = g.id
JOIN squadre sq ON g.squadra_id = sq.id
WHERE sg.stagione = '2024-2025'
ORDER BY sg.gol DESC;
