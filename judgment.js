const express = require('express');
const morgan = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const store = require('connect-loki');

const LokiStore = store(session);

const Game = require('./lib/game');

const app = express();
const port = 3000;
const host = "localhost";

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(session({
  cookie: {
  	httpOnly: true,
  	maxAge: 31 * 24 * 60 * 60 * 1000,
  	path: "/",
  	secure: false,
  },
  name: "pj-dim-wist-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not secure",
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, res, next) => {
  let game = {};
  // console.log(`before loop ${req.session.game}`);
  if ("game" in req.session) {
  	// console.log("hello I am in the loop")
  	// console.log(game);
  	// console.log(req.session.game);
  	// req.session.game.doSomething();
  	game = Game.makeGame(req.session.game);
  	// game.doSomething();
  	// console.log("hello I am in the loop")
  	// console.log(game);
  }
  // console.log(game);
  req.session.game = game;
  // console.log("out of if loop in judgment")
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  res.render("new-game");
});

app.get("/bets/:i", (req, res) => {
  let { bet, get, i } = { ...req.params };
  let game = req.session.game;
  let round = game.board[game.currentHand]; // sorry
  let betsAndGets = round[0];
  betsAndGets.push([+bet, +get]); // do 2 at a time first
  if (i === game.endLast) {
    game.playHand();
  }
  res.render("game-display-table", {
    game,
  });
});

app.get("/game", (req, res) => {
  let game = req.session.game;
  console.log(game);
  res.render("game-display-table", {
  	// flash: req.flash(),
  	game, 
  });
});

// Create a new game and redirect to /game
app.post("/new", (req, res) => {
  let { numPlayers, startFrom } = { ...req.body };
  let game = new Game(numPlayers, startFrom);
  req.session.game = game;
  req.flash("success", "Starting game now...");
  res.redirect("/game");
});

// Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Dim listening on port ${port} of ${host}`);
});