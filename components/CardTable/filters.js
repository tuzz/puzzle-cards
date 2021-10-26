class Filters {
  constructor() {
    this.filters = {};
    this.deck = [];
    this.filteredDeck = [];
    this.filteredDeckWithExclusions = [];
    this.exclusions = {};
  }

  setDeck(deck) {
    this.deck = deck || [];
    this.filterDeck();
  }

  set(key, value) {
    if (this.filters[key] === value) { return; }

    if (value === undefined) {
      delete this.filters[key];
    } else {
      this.filters[key] = value;
    }

    this.filterDeck();
  }

  reset() {
    if (Object.keys(this.filters).length === 0) { return; }

    this.filters = {};
    this.filterDeck();
  }

  filterDeck() {
    this.filteredDeckWithExclusions = this.deck.filter(cardStack => this.matches(cardStack));
    this.filteredDeck = this.filteredDeckWithExclusions.filter(c => !this.exclusions[c.tokenID]);
  }

  matches(cardStack) {
    return Object.entries(this.filters).every(([key, value]) => cardStack.card[key] === value);
  }

  include(cardStack) {
    if (!this.exclusions[cardStack.tokenID]) { return; }
    delete this.exclusions[cardStack.tokenID];

    if (this.matches(cardStack)) {
      this.filteredDeck.unshift(cardStack);
    }
  }

  exclude(cardStack) {
    if (this.exclusions[cardStack.tokenID]) { return; }
    this.exclusions[cardStack.tokenID] = true;

    const index = this.filteredDeck.findIndex(c => c.tokenID === cardStack.tokenID);
    if (index !== -1) { this.filteredDeck.splice(index, 1); }
  }
}

export default Filters;
