class Filters {
  constructor() {
    this.filters = {};
    this.deck = [];
    this.filteredDeck = [];
    this.filteredDeckWithExclusions = [];
    this.exclusions = {};
  }

  shallowCopy() {
    return Object.setPrototypeOf(Object.assign({}, this), Filters.prototype);
  }

  setDeck(deck) {
    this.deck = deck || [];
    this.filterDeck();
  }

  set(key, value) {
    if (this.filters[key] === value) { return this; }

    if (value === undefined) {
      delete this.filters[key];
    } else {
      this.filters[key] = value;
    }

    this.filterDeck();
    return this.shallowCopy();
  }

  reset() {
    if (Object.keys(this.filters).length === 0) { return this; }

    this.filters = {};
    this.filterDeck();
    return this.shallowCopy();
  }

  include(cardStack) {
    if (!this.exclusions[cardStack.tokenID]) { return this; }
    delete this.exclusions[cardStack.tokenID];

    if (this.matches(cardStack)) {
      this.filteredDeck.unshift(cardStack);
    }

    return this.shallowCopy();
  }

  exclude(cardStack) {
    if (this.exclusions[cardStack.tokenID]) { return this; }
    this.exclusions[cardStack.tokenID] = true;

    const index = this.filteredDeck.findIndex(c => c.tokenID === cardStack.tokenID);
    if (index !== -1) { this.filteredDeck.splice(index, 1); }

    return this.shallowCopy();
  }

  filterDeck() {
    this.filteredDeckWithExclusions = this.deck.filter(cardStack => this.matches(cardStack));
    this.filteredDeck = this.filteredDeckWithExclusions.filter(c => !this.exclusions[c.tokenID]);
  }

  matches(cardStack) {
    return Object.entries(this.filters).every(([key, value]) => cardStack.card[key] === value);
  }
}

export default Filters;
