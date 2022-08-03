const config = require("./lib/config.js");
const express = require('express');
const morgan = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const store = require('connect-loki');
const { body, validationResult } = require('express-validator');
const LokiStore = store(session);

const validate = require('./lib/validate');
const Game = require('./lib/gameSimple');

const app = express();
const port = config.PORT;
const host = config.HOST;

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
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());

// Set up persistent session data
app.use((req, res, next) => {
  let game = {};
  if ("game" in req.session) {
  	game = Game.makeGame(req.session.game);
  }
  req.session.game = game;
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  res.locals.game = req.session.game;
  res.locals.hasBet = req.session.hasBet;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  // if current game not in session
  // if (!("game" in req.session)) {
    res.render("new-game");
  // } else {
    // if bets entered, playRound
    // if (true) {
      // res.render("playRound");
    // } else {
      // res.render("enterBets");
    // }
  // }
  
});

app.post("/bets/",  
  (req, res, next) => {
    let errors = validate.validate(req);
    if (!errors.every(error => error === true)) {
      for (let error of errors) {
        if (error.msg) {
          req.flash("error", error.msg);
          break;
        }
      }
      res.render("enterBets", {
        flash: req.flash(),
        invalidBet: true,
        bets: req.body,
      });
    } else {
      let bets = { ...req.body };
      console.log(bets);
      let betsToValidate = Object.values(bets).map(bet => Number(bet));
      console.log(betsToValidate);
      let game = req.session.game;
      if (!game.validateBets(betsToValidate)) {
        req.flash("error","The last player must bet correctly!");
        res.render("enterBets", {
          flash: req.flash(),
          invalidBet: true,
          bets,
        });
      } else {
        game.enterBets(bets);
        res.render("playRound", {
        });
      }
    }
});

app.get("/gets", (req, res) => {
  // MAKE SURE PAGE WAS NOT REFRESHED!!!!
  // IDEA 1...add current Hand ID as request parameter "/:currentHand"
  let game = req.session.game;
  console.log(game);
  console.log(game.board[game.currentHand]);
  res.render("enterGets", {
    // game,
  });
});

app.get("/bets", (req, res) => {
  let game = req.session.game;
  if (game.roundHasBet) {
    req.flash("error", "bets were already entered for this round");
    res.render("playRound", {
      flash: req.flash(),
    });
  }
  req.flash("success", "Let the rounds begin!");
  res.render("enterBets", {
    flash: Object.assign(req.flash(), res.locals.flash),
  });
});

app.post("/gets", (req, res, next) => {
  let gets = { ...req.body };
  let getsToValidate = Object.values(gets).map(get => Number(get));
  let game = req.session.game;
  let bets = game.board[game.currentHand][0];
  let betsToValidate = Object.values(bets).map(bet => Number(bet));
  if (!game.validateGets(getsToValidate)) {
    req.flash("error", "Somebody did not report the right get. Correct and click to continue!");
    res.render("enterGets", {
      flash: req.flash(),
      gets,
      invalidGet: true,
    });
  } else if (!game.validateBets(betsToValidate)) {
    // check bets were entered properly
    req.flash("error", "How did you get here? Bets were not entered correctly");
    res.render("enterBets", {
      flash: req.flash(),
      bets,
      invalidBet: true,
    });
  } else {
    // check that page was not refreshed
    console.log(game);
    console.log(`${game.winnerWinner} is the winner`);
    game.playHand(gets);
    if (game.isOver()) {
      req.flash("success", "The game is over!");
      res.render("displayEndGame", {
        req: req.flash(), // TODO make displayEndGame call displayWinner()
      });
    } else {
      let bets = game.board[game.previousHand][0];
      console.log(bets);
      let scores = game.board[game.previousHand][2];
      res.render("displayRound", {
        bets,
        gets, 
        scores,
      });
    }
    
  }
});

// Create a new game and redirect to /game
app.post("/new", 
  [
    body("numPlayers")
      .trim()
      .isLength({min: 1})
      .withMessage("must enter a number at least one")
      .custom((numPlayer) => {
        return numPlayer.split("").every(p => p.match(/\d/));
      }) // match only numbers
      .withMessage("must be a number no letters"),
    body("startFrom")
      .trim()
      .isLength({min: 1})
      .withMessage("must be at least 1")
      .custom(startFrom => {
        return startFrom.split("").every(p => p.match(/\d/));
      })
      .withMessage("must be a number no letters"),
  ],
  (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-game", {
        flash: req.flash(),
      });
    } else {
      let { numPlayers, startFrom } = { ...req.body };
      let game = new Game(numPlayers, startFrom);
      req.session.game = game;
      req.flash("success", "Starting game now..."); 
      res.redirect("/bets");    
    }
    next();
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