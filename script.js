const express = require("express");
const cors = require("cors");

const leaguesRouter = require("./routes/leagues");
const teamsRouter = require("./routes/teams");
const fixturesRouter = require("./routes/fixtures");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/leagues", leaguesRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/fixtures", fixturesRouter);
app.use("/api/upload", uploadRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Fantasy Football Simulator API running on http://localhost:${PORT}`);
});