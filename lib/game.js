// const nextId = require("./next-Id");

class Game {
  constructor(playerCount, startFrom) {
  	this.playerCount = +playerCount;
  	this.startFrom = +startFrom; // hand
  	this.startFirst = 0; // player
  	this.endLast = this.playerCount - 1;
  	this.board = this.createBoard();
  	this.currentHand = this.createKeys()[0];
  	this.playerNames = this.createPlayerNames();
  	this.isBet = true;
  }

  static makeGame(rawGame) {
  	// console.log(`the raw Game`);
  	// console.log(rawGame);
  	return Object.assign(new Game(), {
  	  ...rawGame,
  	});
  }

  // doSomething() {
  // 	console.log('YEs FINE OKAY WIKKK');
  // }

  createPlayerNames() {
  	let names = [];
  	for (let index = 0; index < this.playerCount; index++) {
  	  names.push(index);
  	}
  	return names;
  }

  createKeys() {
  	let suits = 'SDHCN';
  	let startFrom = this.startFrom;
  	let keys = [];
  	for (let index = startFrom; index > 0; index--) {
  	  let trump = suits.charAt((startFrom - index) % 5);
  	  keys.push(`${index}${trump}`);
  	}
  	return keys;
  }

  createBoard() {
  	let keys = this.createKeys();
  	let playerCount = this.playerCount;
  	let board = {};

  	keys.forEach(key => {
  	  let bets = [];
  	  let gets = [];
  	  let scores = [];
  	  for (let num = 0; num < playerCount; num++) {
  	  	bets.push(0);
  	  	gets.push(0);
  	  	scores.push(0);
  	  }
  	  board[key] = [bets, gets, scores];
  	});

  	return board;
  }

  isCurrentHand(key) {
    return this.currentHand === key;
  }

  isBet() {
  	return this.isBet;
  }

  playHand() {
  	// update this.board.currentHand
  	this.startFirst++;
  	this.currentHand = this.createKeys()[this.startFirst];
  	this.endLast = (this.startFirst - 1 < 0) ? this.playerCount - 1 : this.startFirst - 1;
  	this.isBet = false;
  }

  scoreFor(key) {
  	let index = this.startFrom - this.currentHand.split('').filter(x=>Number.isInteger(x)).join('');
  	return this.board[key][1][index];
  }


}


  // validateBets() {
  // 	return this.bets.reduce((a, b) => a + b, 0) === this.hands;
  // }

  // validateGets() {
  // 	return this.gets.reduce((a, b) => a + b, 0) === this.hands;
  // }

  // calculateScore(index) {
  // 	this.players[index].score += (this.bets[index] === this.gets[index]) ? this.bets[index] + 10 : this.gets[index];
  // }



// let game = new Game(4, 10);
// console.log(game);
// console.log(game.board['10S']);

module.exports = Game;



