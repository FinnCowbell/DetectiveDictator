class CardDeck {
  constructor(cardList, shuffleOnEmpty = true, shuffleIfNotEnough = true) {
    this.deck = cardList;
    this.discardPile = [];
    this.shuffleIfNotEnough = shuffleIfNotEnough;
    this.shuffleOnEmpty = shuffleOnEmpty;
    this.shuffleCards();
  }
  draw(n) {
    let cards = [];
    if (this.deck.length < n) {
      if (this.shuffleIfNotEnough) {
        this.reshuffleCards();
      } else if (this.shuffleOnEmpty && this.deck.length == 0) {
        this.reshuffleCards();
      } else {
        return null;
      }
    }
    while (n > 0) {
      cards.push(this.deck.pop());
      n--;
    }
    return cards;
  }
  view(n) {
    /*View, but do not change, the top n cards
      If there aren't enough cards in the deck and shuffleIfNotEnough is true, we'll reshuffle the cards.
      The function keeps the cards in order:
      That is, the highest index card is the topmost card.*/
    if (this.deck.length < n) {
      if (this.shuffleIfNotEnough) {
        this.reshuffleCards();
      } else {
        n = this.deck.length;
      }
    }
    let topNCards = [];
    for (let i = 0; i < n; i++) {
      topNCards.push(this.deck[this.deck.length - n + i]);
    }
    return topNCards;
  }
  discard(card) {
    this.discardPile.push(card);
  }
  reshuffleCards() {
    //Puts discard back into the deck and shuffles it.
    this.deck = this.deck.concat(this.discardPile);
    this.discardPile = [];
    this.shuffleCards();
  }
  shuffleCards() {
    //shuffles cards in deck.
    shuffle(this.deck);
  }
  getAmountRemaining() {
    return this.deck.length;
  }
  getAmountDiscarded() {
    return this.discardPile.length;
  }
}

function shuffle(a) {
  //For shuffling player order, roles, party Cards
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

module.exports = CardDeck;
