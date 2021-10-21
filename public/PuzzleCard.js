// This class provides helpful methods for working with the PuzzleCard contract:
//
// - it works with objects, rather than raw token IDs
// - it has utilities for fetching a user's deck and keeping it up to date
// - it contains constants, such as the contract address, ABI, etc.
// - it decodes reasons for why actions cannot be performed
//
// See https://puzzlecards.github.io/developers for example usage.

class PuzzleCard {
  constructor({ series, puzzle, tier, type, color1, color2, variant, condition, edition }) {
    this.series = series;
    this.puzzle = puzzle;
    this.tier = tier;
    this.type = type;
    this.color1 = color1;
    this.color2 = color2;
    this.variant = variant;
    this.condition = condition;
    this.edition = edition;
  }

  // instance methods

  seriesIndex() {
    return PuzzleCard.SERIES_NAMES.indexOf(this.series);
  }

  puzzleIndex() {
    return PuzzleCard.PUZZLE_NAMES.indexOf(this.puzzle);
  }

  relativePuzzleIndex() {
    return this.puzzleIndex() - PuzzleCard.PUZZLE_OFFSET_PER_SERIES[this.seriesIndex()]
  }

  tierIndex() {
    return PuzzleCard.TIER_NAMES.indexOf(this.tier);
  }

  typeIndex() {
    return PuzzleCard.TYPE_NAMES.indexOf(this.type);
  }

  color1Index() {
    return PuzzleCard.COLOR_NAMES.indexOf(this.color1);
  }

  color2Index() {
    return PuzzleCard.COLOR_NAMES.indexOf(this.color2);
  }

  variantIndex() {
    return PuzzleCard.VARIANT_NAMES.indexOf(this.variant);
  }

  relativeVariantIndex() {
    return this.variantIndex() - PuzzleCard.VARIANT_OFFSET_PER_TYPE[this.typeIndex()];
  }

  conditionIndex() {
    return PuzzleCard.CONDITION_NAMES.indexOf(this.condition);
  }

  editionIndex() {
    return PuzzleCard.EDITION_NAMES.indexOf(this.edition);
  }

  metadataUrl() {
    return PuzzleCard.METADATA_URI.replace("{id}", this.tokenHexString().slice(2).padStart(64, "0"));
  }

  embedUrl() {
    return [PuzzleCard.EMBED_URI, this.embedQueryString()].join("?");
  }

  embedQueryString() {
    return new URLSearchParams(this).toString();
  }

  tokenID() {
    return BigInt(this.tokenHexString());
  }

  tokenHexString() {
    return "0x" + [
      this.seriesIndex(),
      this.relativePuzzleIndex(),
      this.tierIndex(),
      this.typeIndex(),
      this.color1Index(),
      this.color2Index(),
      this.relativeVariantIndex(),
      this.conditionIndex(),
      this.editionIndex(),
    ].map(i => i.toString(16).padStart(2, "0")).join("");
  }

  editionsKey() {
    return BigInt(this.editionsHexString());
  }

  editionsHexString() {
    return "0x" + [
      this.seriesIndex(),
      this.relativePuzzleIndex(),
    ].map(i => i.toString(16).padStart(2, "0")).join("");
  }

  // class methods

  static async fetchDeck(address, onChange, onProgress = () => {}) {
    let handleChange;

    if (onChange) {
      handleChange = (_, ids, deltas) => onChange(ids.map((id, i) => ({
        card: PuzzleCard.fromTokenID(BigInt(id)),
        delta: deltas[i],
        tokenID: BigInt(id),
      })));
    }

    const deckIndex = await PuzzleCard.fetchDeckIndex(address, handleChange, onProgress);

    return deckIndex.mostRecentFirst.map(id => ({
      card: PuzzleCard.fromTokenID(BigInt(id)),
      quantity: deckIndex.balanceByTokenID[id],
      tokenID: BigInt(id),
    }));
  }

  static fromTokenID(tokenID) {
    return PuzzleCard.fromHexString(tokenID.toString(16));
  }

  static fromHexString(hex) {
    const startFrom = hex.length - 18;
    const indexes = [];

    for (let i = 0; i < 9; i += 1) {
      const offset = startFrom + i * 2;
      const digits = hex.substring(offset, offset + 2);
      const index = parseInt(digits || "0", 16);

      indexes.push(index);
    }

    return this.fromIndexes(indexes);
  }

  static fromIndexes(indexes) {
    const puzzleOffset = PuzzleCard.PUZZLE_OFFSET_PER_SERIES[indexes[0]];
    const variantOffset = PuzzleCard.VARIANT_OFFSET_PER_TYPE[indexes[3]];

    return new PuzzleCard({
      series: PuzzleCard.SERIES_NAMES[indexes[0]],
      puzzle: PuzzleCard.PUZZLE_NAMES[puzzleOffset + indexes[1]],
      tier: PuzzleCard.TIER_NAMES[indexes[2]],
      type: PuzzleCard.TYPE_NAMES[indexes[3]],
      color1: PuzzleCard.COLOR_NAMES[indexes[4]],
      color2: PuzzleCard.COLOR_NAMES[indexes[5]],
      variant: PuzzleCard.VARIANT_NAMES[variantOffset + indexes[6]],
      condition: PuzzleCard.CONDITION_NAMES[indexes[7]],
      edition: PuzzleCard.EDITION_NAMES[indexes[8]],
    });
  }

  static allPuzzleCards() { // For use with numLimitedEditions and masterCopyClaimed.
    return PuzzleCard.NUM_PUZZLES_PER_SERIES.flatMap((numPuzzles, seriesIndex) => (
      [...Array(numPuzzles).keys()].map(relativePuzzleIndex => {
        const puzzleOffset = PuzzleCard.PUZZLE_OFFSET_PER_SERIES[seriesIndex];

        return new PuzzleCard({
          series: PuzzleCard.SERIES_NAMES[seriesIndex],
          puzzle: PuzzleCard.PUZZLE_NAMES[puzzleOffset + relativePuzzleIndex],
        });
      })
    ));
  }

  // contract methods

  static attach(ethers, provider) { // Enables reading from the contract.
    PuzzleCard.CONTRACT = new ethers.Contract(PuzzleCard.CONTRACT_ADDRESS, PuzzleCard.CONTRACT_ABI, provider);
  }

  static connect(signer) { // Enables writing to the contract (e.g. minting).
    PuzzleCard.CONTRACT = PuzzleCard.CONTRACT.connect(signer);
  }

  static setContract(contract) { // If you'd rather set things up manually.
    PuzzleCard.CONTRACT = contract;
  }

  static mint(numberToMint, to) {
    return PuzzleCard.pricePerCard().then(price => (
      PuzzleCard.inBatches(numberToMint, (batchSize) => {
        const gasLimit = PuzzleCard.gasLimitToMint(batchSize);
        const value = price * BigInt(batchSize);

        return PuzzleCard.CONTRACT.mint(batchSize, to, { gasLimit, value }).then(PuzzleCard.fromBatchEvent);
      })
    ));
  }

  static gasLimitToMint(numberToMint) {
    const [taperFrom, taperTo, overNumber] = PuzzleCard.GAS_LIMIT_PER_CARD_TAPER;

    const taperRatio = (numberToMint - 1) / (overNumber - 1); // Inverse lerp.
    const clampedRatio = Math.min(taperRatio, 1);

    const gasPerCard = taperFrom * (1 - clampedRatio) + taperTo * clampedRatio;
    const totalGas = Math.ceil(gasPerCard * (numberToMint - 1)) + PuzzleCard.GAS_LIMIT_MINIMUM;

    return Math.min(totalGas, PuzzleCard.GAS_LIMIT_MAXIMUM);
  }

  static pricePerCard() {
    return PuzzleCard.CONTRACT.pricePerCard().then(p => p.toBigInt());
  }

  static numberOwned(card, address) {
    return PuzzleCard.CONTRACT.balanceOf(address, card.tokenID()).then(n => n.toNumber());
  }

  static numLimitedEditions(card) { // The card only requires a series and puzzle.
    return PuzzleCard.CONTRACT.limitedEditions(card.editionsKey());
  }

  static masterCopyClaimed(card) { // The card only requires a series and puzzle.
    return PuzzleCard.CONTRACT.masterCopiesClaimed(card.editionsKey());
  }

  static actionsThatCanBeTaken(puzzleCards) {
    if (puzzleCards.length < 2) { return []; }

    return Promise.all([
      PuzzleCard.canActivateSunOrMoon(puzzleCards).then(([can])    => can ? "activateSunOrMoon" : null),
      PuzzleCard.canLookThroughTelescope(puzzleCards).then(([can]) => can ? "lookThroughTelescope" : null),
      PuzzleCard.canLookThroughGlasses(puzzleCards).then(([can])   => can ? "lookThroughGlasses" : null),
      PuzzleCard.canChangeLensColor(puzzleCards).then(([can])      => can ? "changeLensColor" : null),
      PuzzleCard.canShineTorchOnBasePair(puzzleCards).then(([can]) => can ? "shineTorchOnBasePair" : null),
      PuzzleCard.canTeleportToNextArea(puzzleCards).then(([can])   => can ? "teleportToNextArea" : null),
      PuzzleCard.canGoThroughStarDoor(puzzleCards).then(([can])    => can ? "goThroughStarDoor" : null),
      PuzzleCard.canJumpIntoBeacon(puzzleCards).then(([can])       => can ? "jumpIntoBeacon" : null),
      PuzzleCard.canJumpIntoEclipse(puzzleCards).then(([can])      => can ? "jumpIntoEclipse" : null),
      PuzzleCard.canPuzzleMastery1(puzzleCards).then(([can])       => can ? "puzzleMastery1" : null),
      PuzzleCard.canPuzzleMastery2(puzzleCards).then(([can])       => can ? "puzzleMastery2" : null),
      PuzzleCard.canDiscard2Pickup1(puzzleCards).then(([can])      => can ? "discard2Pickup1" : null),
    ]).then(actionNames => actionNames.filter(n => n));
  }

  static activateSunOrMoon(puzzleCards) {
    return PuzzleCard.performAction("activateSunOrMoon", puzzleCards, 2);
  }

  static canActivateSunOrMoon(puzzleCards) {
    return PuzzleCard.canPerformAction("canActivateSunOrMoon", puzzleCards, 2);
  }

  static lookThroughTelescope(puzzleCards) {
    return PuzzleCard.performAction("lookThroughTelescope", puzzleCards, 3);
  }

  static canLookThroughTelescope(puzzleCards) {
    return PuzzleCard.canPerformAction("canLookThroughTelescope", puzzleCards, 3);
  }

  static lookThroughGlasses(puzzleCards) {
    return PuzzleCard.performAction("lookThroughGlasses", puzzleCards, 3);
  }

  static canLookThroughGlasses(puzzleCards) {
    return PuzzleCard.canPerformAction("canLookThroughGlasses", puzzleCards, 3);
  }

  static changeLensColor(puzzleCards) {
    return PuzzleCard.performAction("changeLensColor", puzzleCards, 3);
  }

  static canChangeLensColor(puzzleCards) {
    return PuzzleCard.canPerformAction("canChangeLensColor", puzzleCards, 3);
  }

  static shineTorchOnBasePair(puzzleCards) {
    return PuzzleCard.performAction("shineTorchOnBasePair", puzzleCards, 3);
  }

  static canShineTorchOnBasePair(puzzleCards) {
    return PuzzleCard.canPerformAction("canShineTorchOnBasePair", puzzleCards, 3);
  }

  static teleportToNextArea(puzzleCards) {
    return PuzzleCard.performAction("teleportToNextArea", puzzleCards, 3);
  }

  static canTeleportToNextArea(puzzleCards) {
    return PuzzleCard.canPerformAction("canTeleportToNextArea", puzzleCards, 3);
  }

  static goThroughStarDoor(puzzleCards) {
    return PuzzleCard.performAction("goThroughStarDoor", puzzleCards, 2);
  }

  static canGoThroughStarDoor(puzzleCards) {
    return PuzzleCard.canPerformAction("canGoThroughStarDoor", puzzleCards, 2);
  }

  static jumpIntoBeacon(puzzleCards) {
    return PuzzleCard.performAction("jumpIntoBeacon", puzzleCards, 3);
  }

  static canJumpIntoBeacon(puzzleCards) {
    return PuzzleCard.canPerformAction("canJumpIntoBeacon", puzzleCards, 3);
  }

  static jumpIntoEclipse(puzzleCards) {
    return PuzzleCard.performAction("jumpIntoEclipse", puzzleCards, 3);
  }

  static canJumpIntoEclipse(puzzleCards) {
    return PuzzleCard.canPerformAction("canJumpIntoEclipse", puzzleCards, 3);
  }

  static puzzleMastery1(puzzleCards) {
    return PuzzleCard.performAction("puzzleMastery1", puzzleCards, 2);
  }

  static canPuzzleMastery1(puzzleCards) {
    return PuzzleCard.canPerformAction("canPuzzleMastery1", puzzleCards, 2);
  }

  static puzzleMastery2(puzzleCards) {
    return PuzzleCard.performAction("puzzleMastery2", puzzleCards, 7);
  }

  static canPuzzleMastery2(puzzleCards) {
    return PuzzleCard.canPerformAction("canPuzzleMastery2", puzzleCards, 7);
  }

  static discard2Pickup1(puzzleCards) {
    return PuzzleCard.performAction("discard2Pickup1", puzzleCards, 2);
  }

  static canDiscard2Pickup1(puzzleCards) {
    return PuzzleCard.canPerformAction("canDiscard2Pickup1", puzzleCards, 2);
  }

  static mintExact(puzzleCard, to) {
    return PuzzleCard.CONTRACT.mintExact(puzzleCard.tokenID(), to).then(() => puzzleCard);
  }

  // onlyOwner contract methods

  static gift(numberToGift, to) { // Only callable by the contract owner.
    return PuzzleCard.inBatches(numberToGift, (batchSize) => {
      const gasLimit = PuzzleCard.gasLimitToMint(batchSize);
      return PuzzleCard.CONTRACT.gift(batchSize, to, { gasLimit }).then(PuzzleCard.fromBatchEvent);
    });
  }

  static updateConstants() {
    return PuzzleCard.CONTRACT.updateConstants(
      PuzzleCard.NUM_PUZZLES_PER_SERIES,
      PuzzleCard.PUZZLE_OFFSET_PER_SERIES,
      PuzzleCard.NUM_VARIANTS_PER_TYPE,
      PuzzleCard.VARIANT_OFFSET_PER_TYPE,
      PuzzleCard.METADATA_URI,
      PuzzleCard.PROXY_REGISTRY_ADDRESS,
    );
  }

  static updatePrice(newPrice) {
    return PuzzleCard.CONTRACT.updatePrice(newPrice);
  }

  // private methods

  static inBatches(numberToMint, fn) {
    const batchSize = PuzzleCard.MAX_BATCH_SIZE;
    const promises = [];

    for (let i = 0; i < Math.floor(numberToMint / batchSize); i += 1) {
      promises.push(fn(batchSize));
    }

    const remainder = numberToMint % PuzzleCard.MAX_BATCH_SIZE;
    if (remainder > 0) { promises.push(fn(remainder)); }

    return Promise.all(promises).then(arrays => [].concat(...arrays));
  }

  static performAction(actionName, puzzleCards, expectedNumArgs) {
    if (puzzleCards.length != expectedNumArgs) {
      throw new Error(`[${expectedNumArgs} cards are required]`);
    }

    return PuzzleCard.call(actionName, puzzleCards).then(PuzzleCard.fromTransferEvent);
  }

  static canPerformAction(actionName, puzzleCards, expectedNumArgs) {
    if (puzzleCards.length != expectedNumArgs) {
      return Promise.resolve([false, `[${expectedNumArgs} cards are required]`]);
    }

    return PuzzleCard.call(actionName, puzzleCards).then(PuzzleCard.decodeErrors);
  }

  static async call(functionName, puzzleCards) {
    const args = [...puzzleCards]
      .sort((a, b) => a.typeIndex() - b.typeIndex())
      .map(card => card.tokenID());

    const baseGasPrice = (await PuzzleCard.CONTRACT.provider.getGasPrice()).toNumber();
    const gasPrice = baseGasPrice * PuzzleCard.GAS_PRICE_MULTIPLIER;

    return PuzzleCard.CONTRACT[functionName](args, { gasLimit: PuzzleCard.GAS_LIMIT_MINIMUM, gasPrice });
  }

  static decodeErrors([isAllowed, errorCodes]) {
    const strings = errorCodes.map((bool, i) => bool ? PuzzleCard.ERROR_STRINGS[i] : null);
    return [isAllowed, strings.filter(s => s)];
  }

  static fromTransferEvent(transaction) {
    return transaction.wait().then(receiver => {
      const event = receiver.events.filter(e => e.event === "TransferSingle")[0];
      return PuzzleCard.fromTokenID(event.args.id.toBigInt());
    });
  }

  static fromBatchEvent(transaction) {
    return transaction.wait().then(receiver => {
      const event = receiver.events.filter(e => e.event === "TransferBatch")[0];
      return event.args.ids.map(id => PuzzleCard.fromTokenID(id.toBigInt()));
    });
  }

  static async fetchDeckIndex(address, onChange, onProgress) {
    address = address.toLowerCase();

    const outdatedDeckIndex = await fetch(`${PuzzleCard.DECKS_URI}/${address}.json`).then(r => r.json()).catch(() => ({}));;
    const lastIndexedBlock = await fetch(`${PuzzleCard.DECKS_URI}/_last_indexed`).then(r => r.json()).catch(() => PuzzleCard.CONTRACT_BLOCK);

    outdatedDeckIndex.balanceByTokenID = outdatedDeckIndex.balanceByTokenID || {};
    outdatedDeckIndex.mostRecentFirst = outdatedDeckIndex.mostRecentFirst || [];

    await PuzzleCard.fetchBalances({
      address,
      minBlock: parseInt(lastIndexedBlock, 10) + 1,
      maxBlock: (await PuzzleCard.CONTRACT.provider.getBlock("latest")).number,
      onFetch: (_, ids, q) => PuzzleCard.updateDeckIndex(outdatedDeckIndex, ids, q),
      onChange,
      onProgress,
    });

    const updatedDeckIndex = outdatedDeckIndex; // It is now up to date.
    return updatedDeckIndex;
  }

  static async fetchBalances({ address = null, minBlock, maxBlock, batchSize = 1000, onFetch, onChange, onProgress = () => {} }) {
    let cardsTransferred = 0;
    let eventsProcessed = 0;

    const handleTransfer = (from, to, ids, quantities) => {
      [from, to] = [from.toLowerCase(), to.toLowerCase()];
      quantities = quantities.map(q => q.toNumber());

      if (!address || address === from) { onFetch(from, ids, quantities.map(q => -q)); }
      if (!address || address === to) { onFetch(to, ids, quantities); }

      cardsTransferred += quantities.reduce((a, b) => a + b);
    };

    const handleBatchLog = (log) => {
      const { args } = PuzzleCard.CONTRACT.interface.parseLog(log);
      const [{ from, to, ids }, quantities] = [args, args[4]];

      handleTransfer(from, to, ids, quantities);
      eventsProcessed += 1;
    };

    const handleSingleLog = (log) => {
      const { args } = PuzzleCard.CONTRACT.interface.parseLog(log);
      const [{ from, to, id }, quantity] = [args, args[4]];

      handleTransfer(from, to, [id], [quantity]);
      eventsProcessed += 1;
    };

    const filters = [];

    if (address) {
      address = address.toLowerCase();

      filters.push([PuzzleCard.CONTRACT.filters.TransferBatch(null, address, null), handleBatchLog]); // Transfers from the address.
      filters.push([PuzzleCard.CONTRACT.filters.TransferSingle(null, address, null), handleSingleLog]);
    }

    filters.push([PuzzleCard.CONTRACT.filters.TransferBatch(null, null, address), handleBatchLog]); // Transfers to the address.
    filters.push([PuzzleCard.CONTRACT.filters.TransferSingle(null, null, address), handleSingleLog]);

    // If changes arrive while we are fetching the deck, queue them into an array.
    const queuedChanges = [];

    if (onChange) {
      for (let [filter, handleLog] of filters) {
        filter.onChange = (log) => queuedChanges.push([log, handleLog]);
        PuzzleCard.CONTRACT.provider.on(filter, (log) => filter.onChange(log));
      }
    }

    for (let block = minBlock; block <= maxBlock; block += batchSize) {
      const fromBlock = block;
      const toBlock = Math.min(block + batchSize - 1, maxBlock);

      const logArrays = await Promise.all(filters.map(([filter, _]) => (
        PuzzleCard.keepRetrying(() => (
          PuzzleCard.CONTRACT.provider.getLogs({ ...filter, fromBlock, toBlock })
        ))
      )));

      filters.forEach(([_, handleLog], i) => logArrays[i].forEach(handleLog));

      onProgress({ blocksRemaining: maxBlock - toBlock, eventsProcessed, cardsTransferred });
    }

    for (let i = 0; i < queuedChanges.length; i += 1) { // Process the queue.
      const [log, handleLog] = queuedChanges[i]; handleLog(log);
    }

    // After the queue has been processed, remove the queueing mechanism.
    // If changes arrived while the queue was being processed, that should
    // have changed queuedChanges.length so they should now also be processed.
    filters.forEach(([filter, handleLog]) => filter.onChange = handleLog);

    // If changes arrive in the future after the deck has been fetched, call
    // onChange. The client code is responsible for keeping the deck up to date
    // by calling updateFetchedDeck with the change sets at an appopriate time.
    onFetch = onChange;
  }

  static async keepRetrying(promiseFn, initialDelay = 2000) {
    let returnValue;
    let delay = initialDelay;

    while (!returnValue) {
      await promiseFn().then(r => returnValue = [r]).catch(() => PuzzleCard.wait(delay).then(() => delay *= (1.2 + Math.random())));
    }

    return returnValue[0];
  }

  static wait(milliseconds) {
    return new Promise(r => setTimeout(r, milliseconds));
  }

  static updateDeckIndex({ balanceByTokenID, mostRecentFirst }, tokenIDs, quantitiesChanged) {
    for (let i = 0; i < tokenIDs.length; i += 1) {
      const tokenID = tokenIDs[i].toString();
      const quantity = quantitiesChanged[i];

      const position = mostRecentFirst.indexOf(tokenID);
      if (position !== -1) { mostRecentFirst.splice(position, 1); }

      const balance = balanceByTokenID[tokenID] || 0;
      const newBalance = balance + quantity;

      if (newBalance === 0) {
        delete balanceByTokenID[tokenID];
      } else {
        balanceByTokenID[tokenID] = newBalance;
        mostRecentFirst.unshift(tokenID);
      }
    }
  };

  static updateFetchedDeck(deck, changes) {
    for (let { card, delta, tokenID } of changes) {
      const position = deck.findIndex(({ tokenID: t }) => t === tokenID);
      let quantity = delta;

      if (position !== -1) {
        quantity += deck[position].quantity;
        deck.splice(position, 1);
      }

      if (quantity !== 0) {
        deck.unshift({ card, quantity, tokenID });
      }
    }
  }
}

// constants

PuzzleCard.SERIES_NAMES = ["Series 0", "Series 1"];
PuzzleCard.PUZZLE_NAMES = ["Puzzle 0-0", "Puzzle 0-1", "Puzzle 1-0", "Puzzle 1-1", "Puzzle 1-2"];
PuzzleCard.TIER_NAMES = ["Mortal", "Immortal", "Ethereal", "Virtual", "Celestial", "Godly", "Master"];
PuzzleCard.TYPE_NAMES = ["Player", "Crab", "Cloak", "Inactive", "Active", "Telescope", "Helix", "Beacon", "Torch", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Star", "Artwork"];
PuzzleCard.COLOR_NAMES = ["None", "Yellow", "Black", "Green", "White", "Blue", "Red", "Pink"];
PuzzleCard.VARIANT_NAMES = ["None", "Sun", "Moon", "Open", "Closed", "Art 0", "Art 1"];
PuzzleCard.CONDITION_NAMES = ["Dire", "Poor", "Reasonable", "Excellent", "Pristine"];
PuzzleCard.EDITION_NAMES = ["Standard", "Signed", "Limited", "Master Copy"];
PuzzleCard.ACTION_NAMES = ["activateSunOrMoon", "changeLensColor", "discard2Pickup1", "goThroughStarDoor", "jumpIntoBeacon", "jumpIntoEclipse", "lookThroughGlasses", "lookThroughTelescope", "puzzleMastery1", "puzzleMastery2", "shineTorchOnBasePair", "teleportToNextArea"];
PuzzleCard.CAN_ACTION_NAMES = PuzzleCard.ACTION_NAMES.map(s => "can" + s[0].toUpperCase() + s.slice(1));

PuzzleCard.NUM_PUZZLES_PER_SERIES = [2, 3];
PuzzleCard.PUZZLE_OFFSET_PER_SERIES = [0, 2];
PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 1, 2, 0, 0, 2, 0, 0, 0, 1, 0];
PuzzleCard.NUM_VARIANTS_PER_TYPE = [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
PuzzleCard.VARIANT_OFFSET_PER_TYPE = [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];

PuzzleCard.TIER_PROBABILITIES = [90, 10];
PuzzleCard.CONDITION_PROBABILITIES = [80, 20];
PuzzleCard.STANDARD_TYPE_PROBABILITIES = [300, 100, 100, 200, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
PuzzleCard.VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
PuzzleCard.MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

PuzzleCard.PROXY_REGISTRY_ADDRESS = "0x58807bad0b376efc12f5ad86aac70e78ed67deae";
PuzzleCard.METADATA_URI = "https://puzzlecards.github.io/metadata/{id}.json";
PuzzleCard.EMBED_URI = "https://puzzlecards.github.io/embed";
PuzzleCard.DECKS_URI = "https://puzzlecards.github.io/decks";

PuzzleCard.EMBED_URI = "http://localhost:3000/embed"; // TMP
PuzzleCard.DECKS_URI = "http://localhost:3000/decks"; // TMP

// Set a minimum gas limit that provides enough headroom for all actions.
// Set a maximum gas limit that matches the limit for the polygon network.
PuzzleCard.GAS_LIMIT_MINIMUM = 350000;
PuzzleCard.GAS_LIMIT_MAXIMUM = 20000000;

// Taper the gas limit per card from the {first number} down to the {second number}
// over the first {third number} cards. Gas usage becomes more predictable for more cards.
PuzzleCard.GAS_LIMIT_PER_CARD_TAPER = [80000, 40000, 100];

// Can be set to a higher/lower value to make all actions use a different gas price.
PuzzleCard.GAS_PRICE_MULTIPLIER = 1;

// The maximum number of cards that could be minted without exceeding the gas limit.
PuzzleCard.MAX_BATCH_SIZE = Math.floor(PuzzleCard.GAS_LIMIT_MAXIMUM / PuzzleCard.GAS_LIMIT_PER_CARD_TAPER[1]);

PuzzleCard.ERROR_STRINGS = [
  "[a player card is required]",
  "[a crab card is required]",
  "[a cloak card is required]",
  "[an inactive sun or moon card is required]",
  "[an active sun or moon card is required]",
  "[a telescope card is required]",
  "[a helix card is required]",
  "[a beacon card is required]",
  "[a torch card is required]",
  "[a map card is required]",
  "[a teleport card is required]",
  "[a glasses card is required]",
  "[an eclipse card is required]",
  "[a door card is required]",
  "[a hidden card is required]",
  "[seven star cards are required]",
  "[two artwork cards are required]",
  "[a player, crab or cloak card is required]",
  "[a torch or glasses card is required]",
  "[two cards are required]",
  "[three cards are required]",
  "[seven star cards are required]",
  "[the tiers of the cards don't match]",
  "[user doesn't own all the cards]",
  "[only works with a cloak card at this tier]",
  "[the color of the cloak doesn't match]",
  "[the sun or moon card doesn't match the telescope]",
  "[the torch colors don't match the base pair]",
  "[the puzzles don't match]",
  "[the door has already been opened]",
  "[the door hasn't been opened]",
  "[the artwork is already signed]",
  "[the same card was used twice]",
  "[a color was repeated]",
];

PuzzleCard.CONTRACT_ADDRESS = "0xb324983fB5BA6c4421e1f004dEf1767765782Fde";
PuzzleCard.CONTRACT_BLOCK = 20209157;
PuzzleCard.CONTRACT_NETWORK = {"name":"Polygon Test Network","url":"https://rpc-mumbai.maticvigil.com","chainId":80001,"symbol":"MATIC","explorer":"https://mumbai.polygonscan.com"};

PuzzleCard.CONTRACT_ABI = [
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event MetaTransactionExecuted(address userAddress, address relayerAddress, bytes functionSignature)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event URI(string value, uint256 indexed id)",
  "function ERC712_VERSION() view returns (string)",
  "function activateSunOrMoon(uint256[] tokenIDs)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function canActivateSunOrMoon(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canChangeLensColor(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canDiscard2Pickup1(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canGoThroughStarDoor(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canJumpIntoBeacon(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canJumpIntoEclipse(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canLookThroughGlasses(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canLookThroughTelescope(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canPuzzleMastery1(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canPuzzleMastery2(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canShineTorchOnBasePair(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function canTeleportToNextArea(uint256[] tokenIDs) view returns (bool ok, bool[34] errors)",
  "function changeLensColor(uint256[] tokenIDs)",
  "function discard2Pickup1(uint256[] tokenIDs)",
  "function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)",
  "function exists(uint256 tokenID) view returns (bool)",
  "function getChainId() view returns (uint256)",
  "function getDomainSeperator() view returns (bytes32)",
  "function getNonce(address user) view returns (uint256 nonce)",
  "function gift(uint256 numberToGift, address to)",
  "function goThroughStarDoor(uint256[] tokenIDs)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function jumpIntoBeacon(uint256[] tokenIDs)",
  "function jumpIntoEclipse(uint256[] tokenIDs)",
  "function limitedEditions(uint256) view returns (uint256)",
  "function lookThroughGlasses(uint256[] tokenIDs)",
  "function lookThroughTelescope(uint256[] tokenIDs)",
  "function masterCopiesClaimed(uint16) view returns (bool)",
  "function mint(uint256 numberToMint, address to) payable",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function pricePerCard() view returns (uint256)",
  "function puzzleMastery1(uint256[] tokenIDs)",
  "function puzzleMastery2(uint256[] tokenIDs)",
  "function renounceOwnership()",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function shineTorchOnBasePair(uint256[] tokenIDs)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function teleportToNextArea(uint256[] tokenIDs)",
  "function totalSupply(uint256) view returns (uint256)",
  "function transferOwnership(address newOwner)",
  "function updateConstants(uint8[] numPuzzlesPerSeries, uint16[] puzzleOffsetPerSeries, uint8[] numVariantsPerType, uint16[] variantOffsetPerType, string metadataURI, address proxyRegistryAddress)",
  "function updatePrice(uint256 price)",
  "function uri(uint256) view returns (string)"
];

if (typeof module !== "undefined") {
  module.exports = PuzzleCard;
}
