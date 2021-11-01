class Filters {
  constructor() {
    this.filters = {};
    this.deck = [];
    this.filteredDeck = [];
    this.exclusions = {};
    this.pageOffset = 0;
    this.pageSize = 6;
  }

  shallowCopy() {
    return Object.setPrototypeOf(Object.assign({}, this), Filters.prototype);
  }

  setDeck(deck, propagate) {
    this.deck = deck || [];
    this.filterDeck();

    return propagate ? this.shallowCopy() : this;
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

  include(cardStack) {
    if (!this.exclusions[cardStack.tokenID]) { return this; }
    delete this.exclusions[cardStack.tokenID];

    if (this.matchesAll(this.matchObject(cardStack))) {
      this.filteredDeck.unshift(cardStack);
    }

    return this; // Don't re-render when moving card stacks to/from the hourglass area.
  }

  exclude(cardStack) {
    if (this.exclusions[cardStack.tokenID]) { return this; }
    this.exclusions[cardStack.tokenID] = true;

    const index = this.filteredDeck.findIndex(c => c.tokenID === cardStack.tokenID);

    if (index !== -1) {
      this.filteredDeck.splice(index, 1);
      this.pageOffset -= 1;
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
    this.dealForwards = false;

    return this.shallowCopy();
  }

  nextPage() {
    this.pageOffset += this.pageSize;
    this.dealForwards = true;

    return this.shallowCopy();
  }

  filterDeck() {
    this.filteredDeck = [];
    this.countsForDropdownOptions = {};

    for (let cardStack of this.deck) {
      const matchObject = this.matchObject(cardStack);

      this.updateCounts(matchObject, cardStack);

      if (this.matchesAll(matchObject) && !this.exclusions[cardStack.tokenID]) {
        this.filteredDeck.push(cardStack);
      }
    }

    this.pageOffset = 0;
    this.dealForwards = true;
  }

  updateCounts(matchObject, cardStack) {
    const counts = this.countsForDropdownOptions;
    const delta = typeof cardStack.lastDelta === "undefined" ? cardStack.quantity : cardStack.lastDelta;

    for (let [key, value] of Object.entries(cardStack.card)) {
      if (this.matchesAllIgnoring(key, matchObject)) {
        counts[key] = counts[key] || {};
        counts[key][value] = counts[key][value] || 0;

        counts[key][value] += delta;
      }
    }
  }

  matchesAll(matchObject) {
    return Object.values(matchObject).every(bool => bool);
  }

  matchesAllIgnoring(field, matchObject) {
    return Object.entries(matchObject).every(([key, matches]) => key === field || matches);
  }

  matchObject(cardStack) {
    const object = {};

    for (let [key, value] of Object.entries(this.filters)) {
      object[key] = cardStack.card[key] === value;
    }

    return object;
  }
}

export default Filters;
