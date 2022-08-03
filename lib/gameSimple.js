class Game {
  constructor(playerCount, startFrom) {
  	this.playerCount = +playerCount;
  	this.startFrom = +startFrom;
  	this.board = this.createBoard();
  	this.playerStartFirst = 0;
    this.playerGoesLast = this.playerCount;
  	this.playedHands = 0;
  	this.currentHand = this.createKeys()[0];
    this.previousHand = null;
    this.winnerWinner = null;
    this.gameOver = false;
    this.names = {};
    this.roundHasBet = false; // abstract away round/hand nouns and verbs.
  }

  static makeGame(rawGame) {
  	return Object.assign(new Game, {
  	  ...rawGame,
  	});
  }

  yieldName(playerIndex) {
    return this.names[playerIndex] || playerIndex;
  }

  yieldDataForPlayer(round, playerIndex) {
    let data = [];
    console.log(round);
    console.log(playerIndex);
    console.log(this.board[round]);

    let [roundBets, roundGets, roundScores] = this.board[round];
    console.log(this.board[round]);
    let bet = roundBets[playerIndex];
    let get = roundGets[playerIndex];
    let score = roundScores[playerIndex];
    data.push(bet, get, score);
    console.log(data);
    return data;
    // return undefined if round not played yet?
  }

  yieldPlayedRounds() {
    return Object.keys(this.board).slice(0, this.playedHands);
  }

  createBoard() {
  	let keys = this.createKeys();
  	let board = {};

  	keys.forEach(key => {
  	  let bets = {};
  	  let gets = {};
  	  let scores = {};

  	  board[key] = [bets, gets, scores];
  	});

  	return board;
  }

  createKeys() {
  	let suits = 'SDHCN';
    const NAMES = {
      'S': "Spades",
      'H': "Hearts",
      'D': "Diamonds",
      'C': "Clubs",
      'N': "No Joker"
    }; 
  	let startFrom = this.startFrom;
  	let keys = [];
  	for (let index = startFrom; index > 0; index--) {
  	  let trump = suits.charAt((startFrom - index) % 5);
  	  keys.push(`${index} ${NAMES[trump]}`);
  	}
  	return keys;
  }

  createOrdering(flag = 0) {
    let order = [...Array(this.playerCount).keys()];

    let count = 0;
    while (count < this.playedHands - flag) {
      order.push(order.shift());
      count++;
    }
    return order;
  }

  validateBets(bets) {
    // check last entry does not sum to round total
    let sumNotAll = bets.slice(0, bets.length - 1).reduce((a, b) => a + b, 0);
    let total = +this.currentHand.match(/(\d)/g).join("");
    return (total - sumNotAll !== bets[bets.length - 1]);
  }

  validateGets(gets) {
    if (this.gameOver) {
      return true; // TODO this should render another page or sometihng back in Judgment simple
    }
    let total = +this.currentHand.match(/(\d)/g).join("");
    let sumOfGets = gets.reduce((a, b) => a + b, 0);
    return total === sumOfGets;
  }

  playHand(gets) {
    if (this.gameOver) return;
    this.enterGets(gets);
    this.calculateHandScore();
    this.playedHands++;
    this.playerStartFirst++;
    this.playerGoesLast--;  
    this.previousHand = this.currentHand;
    this.currentHand = this.next();

    if (!this.currentHand) {
      let winner = this.findWinner();
      if (!!winner) {
        this.gameOver = true;
        this.winnerWinner = winner;
        return;
      }
    }
  }

  isOver() {
    return this.gameOver;
  }

  displayWinner() {
    return this.winnerWinner;
  }

  findRanking() {
    // create ordering based on score with this.board.masterScores
    let playerFinalScoreEntries = Object.entries(this.board.masterScores);
    let ranking = playerFinalScoreEntries.sort(([p1, finalScore1], [p2, finalScore2]) => {
      if (finalScore1 < finalScore2) {
        return 1;
      } else if (finalScore2 < finalScore1) {
        return -1;
      } else {
        return 0;
      }
    });
    
    return ranking;
  }

  findWinner() {
    let playerFinalScoreEntries = Object.entries(this.board.masterScores);
    console.log(playerFinalScoreEntries);
    let currentMaxScore = -1;
    let playerLead = undefined;
    playerFinalScoreEntries.forEach(([player, finalScore]) => {
      if (finalScore >= currentMaxScore) {
        playerLead = player; 
        currentMaxScore = finalScore;
      }
    });
    console.log(`${playerLead} is the winner`);
    return playerLead;
  }

  // finds nextHand
  next() {
    let currentHand = this.currentHand;
    let originalOrder = this.createKeys();
    let index = originalOrder.indexOf(currentHand);
    if (index !== originalOrder.length) {
      return originalOrder[index + 1];
    } 
    return undefined;
  }

  initializeMasterScore() {
    this.board['masterScores'] = {};
    let count = 0;
    while (count < this.playerCount) {
      this.board['masterScores'][count] = 0;
      count++;
    }
  }

  calculateHandScore() {
    let [bets, gets, scores] = this.board[this.currentHand];

    if (this.playedHands === 0) {
      this.initializeMasterScore();
    }

    // deal with previous scores
    for (let index in bets) {
      scores[index] = bets[index] === gets[index] ? 10 + bets[index] : +gets[index];
      this.board['masterScores'][index] += scores[index];
    }

  }

  enterBets(bets) {
  	let roundBets = this.board[this.currentHand][0];

    for (let key in bets) {
      roundBets[key] = +bets[key];  
    }

    this.roundHasBet = true;

  }  

  enterGets(gets) {
    if (this.gameOver) {
      return;
    }
    let roundGets = this.board[this.currentHand][1];

    for (let key in gets) {
      roundGets[key] = +gets[key];
    }

    this.roundHasBet = false;

  }  
}

module.exports = Game;