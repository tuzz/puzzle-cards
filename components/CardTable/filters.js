class Filters {
  constructor() {
    this.filters = {};
    this.deck = [];
    this.filteredDeck = [];
    this.filteredDeckWithExclusions = [];
    this.exclusions = {};
    this.pageOffset = 0;
    this.pageSize = 6;
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
      this.pageOffset += 1;
    }

    return this; // Don't re-render when moving card stacks to/from the hourglass area.
  }

  exclude(cardStack) {
    if (this.exclusions[cardStack.tokenID]) { return this; }
    this.exclusions[cardStack.tokenID] = true;

    const index = this.filteredDeck.findIndex(c => c.tokenID === cardStack.tokenID);

    if (index !== -1) {
      this.filteredDeck.splice(index, 1);

      if (index <= this.pageOffset) {
        this.pageOffset -= 1;
      }
    }

    return this;
  }

  setPageSize(pageSize) {
    this.pageSize = pageSize;
    return this;
  }

  hasPrevPage() {
    return this.pageOffset > 0;
  }

  hasNextPage() {
    return this.pageOffset + this.pageSize < this.filteredDeck.length;
  }

  prevPage() {
    this.pageOffset = Math.max(0, this.pageOffset - this.pageSize);
    return this.shallowCopy();
  }

  nextPage() {
    this.pageOffset += this.pageSize;
    return this.shallowCopy();
  }

  filterDeck() {
    this.filteredDeckWithExclusions = this.deck.filter(cardStack => this.matches(cardStack));
    this.filteredDeck = this.filteredDeckWithExclusions.filter(c => !this.exclusions[c.tokenID]);
    this.pageOffset = 0;
  }

  matches(cardStack) {
    return Object.entries(this.filters).every(([key, value]) => cardStack.card[key] === value);
  }
}

export default Filters;
