// Run with: npm run seed
// Wipes existing demo data and inserts two sample competitions so the UI has
// something to show on first run: a World Cup group (matches the kind of
// data you'd import from a doc) and a small domestic league with a finished
// past season, to demonstrate the History tab.

const db = require("./index");

function run() {
  console.log("Seeding demo data...");

  db.exec(`
    DELETE FROM uploads;
    DELETE FROM fixtures;
    DELETE FROM season_teams;
    DELETE FROM seasons;
    DELETE FROM teams;
    DELETE FROM leagues;
  `);

  // ---------- World Cup 2026 – Group A ----------
  const wc = db
    .prepare(
      `INSERT INTO leagues (name, slug, country, emblem, type) VALUES (?, ?, ?, ?, ?)`
    )
    .run("World Cup 2026 – Group A", "world-cup-2026-group-a", "International", "🏆", "world_cup");
  const wcSeason = db
    .prepare(`INSERT INTO seasons (league_id, label, is_current) VALUES (?, ?, 1)`)
    .run(wc.lastInsertRowid, "2026");

  const wcTeams = {
    mexico: addTeam(wc.lastInsertRowid, wcSeason.lastInsertRowid, "Mexico", "MEX", "🇲🇽"),
    southKorea: addTeam(wc.lastInsertRowid, wcSeason.lastInsertRowid, "South Korea", "KOR", "🇰🇷"),
    czechia: addTeam(wc.lastInsertRowid, wcSeason.lastInsertRowid, "Czechia", "CZE", "🇨🇿"),
    southAfrica: addTeam(wc.lastInsertRowid, wcSeason.lastInsertRowid, "South Africa", "RSA", "🇿🇦"),
  };

  addFinishedFixture(wcSeason.lastInsertRowid, "Round 1", wcTeams.mexico, wcTeams.southKorea, 2, 0);
  addFinishedFixture(wcSeason.lastInsertRowid, "Round 1", wcTeams.czechia, wcTeams.southAfrica, 1, 1);
  addFinishedFixture(wcSeason.lastInsertRowid, "Round 2", wcTeams.mexico, wcTeams.czechia, 1, 0);
  addFinishedFixture(wcSeason.lastInsertRowid, "Round 2", wcTeams.southKorea, wcTeams.southAfrica, 2, 1);
  addScheduledFixture(wcSeason.lastInsertRowid, "Round 3", wcTeams.mexico, wcTeams.southAfrica);
  addScheduledFixture(wcSeason.lastInsertRowid, "Round 3", wcTeams.southKorea, wcTeams.czechia);

  // ---------- Continental Premier (domestic league, with history) ----------
  const cp = db
    .prepare(
      `INSERT INTO leagues (name, slug, country, emblem, type) VALUES (?, ?, ?, ?, ?)`
    )
    .run("Continental Premier", "continental-premier", "Fantasyland", "⚽", "domestic_league");

  // Past, finished season
  const pastSeason = db
    .prepare(`INSERT INTO seasons (league_id, label, is_current) VALUES (?, ?, 0)`)
    .run(cp.lastInsertRowid, "2024/25");

  const t1 = addTeam(cp.lastInsertRowid, pastSeason.lastInsertRowid, "Riverside FC", "RIV", "🔵");
  const t2 = addTeam(cp.lastInsertRowid, pastSeason.lastInsertRowid, "Harbor United", "HAR", "⚫");
  const t3 = addTeam(cp.lastInsertRowid, pastSeason.lastInsertRowid, "Summit Town", "SUM", "🟢");
  const t4 = addTeam(cp.lastInsertRowid, pastSeason.lastInsertRowid, "Ironbridge AC", "IRO", "🔴");

  addFinishedFixture(pastSeason.lastInsertRowid, "Round 1", t1, t2, 3, 1);
  addFinishedFixture(pastSeason.lastInsertRowid, "Round 1", t3, t4, 0, 0);
  addFinishedFixture(pastSeason.lastInsertRowid, "Round 2", t1, t3, 2, 2);
  addFinishedFixture(pastSeason.lastInsertRowid, "Round 2", t2, t4, 1, 0);
  addFinishedFixture(pastSeason.lastInsertRowid, "Round 3", t1, t4, 4, 0);
  addFinishedFixture(pastSeason.lastInsertRowid, "Round 3", t2, t3, 2, 1);

  db.prepare(`UPDATE seasons SET champion_team_id = ? WHERE id = ?`).run(
    t1,
    pastSeason.lastInsertRowid
  );

  // Current season, carries the same teams forward
  const currentSeason = db
    .prepare(`INSERT INTO seasons (league_id, label, is_current) VALUES (?, ?, 1)`)
    .run(cp.lastInsertRowid, "2025/26");

  for (const teamId of [t1, t2, t3, t4]) {
    db.prepare(`INSERT OR IGNORE INTO season_teams (season_id, team_id) VALUES (?, ?)`).run(
      currentSeason.lastInsertRowid,
      teamId
    );
  }

  addFinishedFixture(currentSeason.lastInsertRowid, "Round 1", t2, t1, 1, 1);
  addFinishedFixture(currentSeason.lastInsertRowid, "Round 1", t4, t3, 2, 1);
  addScheduledFixture(currentSeason.lastInsertRowid, "Round 2", t1, t4);
  addScheduledFixture(currentSeason.lastInsertRowid, "Round 2", t3, t2);

  console.log("Done. Two demo competitions are ready.");
}

function addTeam(leagueId, seasonId, name, shortName, emblem) {
  const info = db
    .prepare(`INSERT INTO teams (league_id, name, short_name, emblem) VALUES (?, ?, ?, ?)`)
    .run(leagueId, name, shortName, emblem);
  const teamId = info.lastInsertRowid;
  db.prepare(`INSERT OR IGNORE INTO season_teams (season_id, team_id) VALUES (?, ?)`).run(
    seasonId,
    teamId
  );
  return teamId;
}

function addFinishedFixture(seasonId, round, homeId, awayId, hs, as) {
  db.prepare(
    `INSERT INTO fixtures (season_id, round_label, home_team_id, away_team_id, home_score, away_score, status)
     VALUES (?, ?, ?, ?, ?, ?, 'finished')`
  ).run(seasonId, round, homeId, awayId, hs, as);
}

function addScheduledFixture(seasonId, round, homeId, awayId) {
  db.prepare(
    `INSERT INTO fixtures (season_id, round_label, home_team_id, away_team_id, status)
     VALUES (?, ?, ?, ?, 'scheduled')`
  ).run(seasonId, round, homeId, awayId);
}

run();