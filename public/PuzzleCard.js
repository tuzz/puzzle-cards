// This class provides helpful methods for working with the PuzzleCard contract:
//
// - it works with objects, rather than raw token IDs
// - it has utilities for fetching a user's deck and keeping it up to date
// - it contains constants, such as the contract address, ABI, etc.
// - it decodes reasons for why actions cannot be performed
//
// See https://github.com/tuzz/puzzle-cards for more information.

class PuzzleCard {
  constructor({ series, puzzle, tier, type, color1, color2, variant, condition, edition, skipValidation }) {
    this.series = series;
    this.puzzle = puzzle;
    this.tier = tier;
    this.type = type;
    this.color1 = color1;
    this.color2 = color2;
    this.variant = variant;
    this.condition = condition;
    this.edition = edition;

    if (!skipValidation) {
      this.validateFields();
    }
  }

  // instance methods

  validateFields() {
    const errors = [];

    if (this.seriesIndex() === -1)    { errors.push(`Series: ${this.series}`); }
    if (this.tierIndex() === -1)      { errors.push(`Tier: ${this.tier}`); }
    if (this.typeIndex() === -1)      { errors.push(`Type: ${this.type}`); }
    if (this.color1Index() === -1)    { errors.push(`Color1: ${this.color1}`); }
    if (this.color2Index() === -1)    { errors.push(`Color2: ${this.color2}`); }
    if (this.conditionIndex() === -1) { errors.push(`Condition: ${this.condition}`); }
    if (this.editionIndex() === -1)   { errors.push(`Edition: ${this.edition}`); }

    if (this.puzzleIndex() === -1 || this.relativePuzzleIndex() < 0) { errors.push(`Puzzle: ${this.puzzle}`); }
    if (this.variantIndex() === -1 || this.relativeVariantIndex() < 0) { errors.push(`Variant: ${this.variant}`); }

    if (errors.length > 0) {
      throw new Error(`These fields are invalid: ${errors.join(", ")}\n\n${JSON.stringify(this)}\n`);
    }
  }

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

  // identifiers

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

  metadataID() {
    return this.tokenHexString().slice(2).padStart(64, "0");
  }

  puzzleSlug() {
    return this.puzzle.toLowerCase().replaceAll(" ", "-").replaceAll(/[^a-z-]/g, "");
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

  // urls (also see the _URI constants)

  metadataURL() {
    return PuzzleCard.TOKEN_METADATA_URI.replace("{id}", this.metadataID());
  }

  puzzleVideoURL({ encoding = "av1", quality = "high" }) {
    return PuzzleCard.PUZZLE_VIDEOS_URI.replace("{encoding}", encoding).replace("{quality}", quality).replace("{slug}", this.puzzleSlug());
  }

  viewURL({ referrer }) {
    return PuzzleCard.CARD_VIEWS_URI.replace("{id}", this.tokenID()).replace("{referrer}", referrer);
  }

  imageURL() {
    return PuzzleCard.CARD_IMAGES_URI.replace("{id}", this.tokenID());
  }

  openSeaURL() {
    return PuzzleCard.OPEN_SEA_URI.replace("{contract}", PuzzleCard.CONTRACT_ADDRESS).replace("{id}", this.tokenID());
  }

  // deck sync methods

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

  static async maxTierUnlocked(address) {
    const maxTier = await PuzzleCard.CONTRACT.maxTierUnlocked(address);
    return PuzzleCard.TIER_NAMES[maxTier];
  }

  static async mint(numberToMint, tierName, recipient, { wait = true } = {}) {
    const tier = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);
    if (tier === -1) { throw new Error(`Invalid tier ${tierName}`); }

    const to = recipient || PuzzleCard.ZERO_ADDRESS; // Cards are minted to the msg.sender if address(0).
    const isOwner = await PuzzleCard.isOwner();

    const maxTier = await PuzzleCard.maxTierUnlocked(to);
    if (tier > maxTier) { throw new Error(`Minting at ${tierName} is locked.`); }

    const basePrice = await PuzzleCard.basePriceInWei();
    const tierMultiplier = PuzzleCard.MINT_PRICE_MULTIPLERS[tier];

    return PuzzleCard.inBatches(numberToMint, (batchSize) => {
      const gasLimit = PuzzleCard.gasLimitToMint(batchSize);
      const value = isOwner ? 0 : basePrice * BigInt(batchSize) * BigInt(tierMultiplier);

      const request = PuzzleCard.CONTRACT.mint(batchSize, tier, to, { gasLimit, value });
      return wait ? request.then(PuzzleCard.fromBatchEvent) : request;
    });
  }

  static async unlockMintingAtAllTiers(recipient, { wait = true } = {}) {
    const address = recipient || PuzzleCard.ZERO_ADDRESS; // Unlocked for the msg.sender if address(0).
    const isOwner = await PuzzleCard.isOwner();

    const gasLimit = PuzzleCard.GAS_LIMIT_MINIMUM;
    const price = isOwner ? 0 : await PuzzleCard.priceToUnlock();

    const request = PuzzleCard.CONTRACT.unlockMintingAtAllTiers(address, { gasLimit, value: price });
    return wait ? request.then(t => t.wait()) : request;
  }

  static priceToMint(tierName) {
    const tier = PuzzleCard.TIER_NAMES.findIndex(n => n === tierName);
    if (tier === -1) { throw new Error(`Invalid tier ${tierName}`); }

    const tierMultiplier = PuzzleCard.MINT_PRICE_MULTIPLERS[tier];
    return PuzzleCard.basePriceInWei().then(p => p * BigInt(tierMultiplier));
  }

  static priceToUnlock() {
    return PuzzleCard.basePriceInWei().then(p => p * BigInt(PuzzleCard.UNLOCK_PRICE_MULTIPLIER));
  }

  static gasLimitToMint(numberToMint) {
    const [a, c] = PuzzleCard.GAS_LIMIT_EQUATION;

    const upperBound = a * numberToMint + c;
    const gasLimit = upperBound * PuzzleCard.GAS_LIMIT_SAFETY;

    return Math.min(Math.max(gasLimit, PuzzleCard.GAS_LIMIT_MINIMUM), PuzzleCard.GAS_LIMIT_MAXIMUM);
  }

  static basePriceInWei() {
    return PuzzleCard.CONTRACT.basePriceInWei().then(p => BigInt(p));
  }

  static numberOwned(card, address) {
    return PuzzleCard.CONTRACT.balanceOf(address, card.tokenID()).then(n => n.toNumber());
  }

  static numLimitedEditions(card) { // The card only requires a series and puzzle.
    return PuzzleCard.CONTRACT.limitedEditions(card.editionsKey());
  }

  static masterCopyClaimed(card) { // The card only requires a series and puzzle.
    return PuzzleCard.CONTRACT.masterCopyClaimedAt(card.editionsKey()).then(n => n !== 0);
  }

  static numOfTheLimitedEditionWhenMasterCopyClaimed(card) {// The card only requires a series and puzzle.
    return PuzzleCard.CONTRACT.masterCopyClaimedAt(card.editionsKey()).then(n => n === 0 ? null : n);
  }

  static actionsThatCanBeTaken(puzzleCards) {
    if (puzzleCards.length < 2 || puzzleCards.length > 7) { return []; }

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

  static updateConstants() {
    return PuzzleCard.CONTRACT.updateConstants(
      PuzzleCard.MINTING_CARDS_ENABLED,
      PuzzleCard.NUM_PUZZLES_PER_SERIES,
      PuzzleCard.SERIES_FOR_EACH_PUZZLE,
      PuzzleCard.NUM_VARIANTS_PER_TYPE,
      PuzzleCard.MINT_PRICE_MULTIPLERS,
      PuzzleCard.UNLOCK_PRICE_MULTIPLIER,
      PuzzleCard.PROXY_REGISTRY_ADDRESS,
      PuzzleCard.CONTRACT_METADATA_URI,
      PuzzleCard.TOKEN_METADATA_URI,
      { gasLimit: PuzzleCard.GAS_LIMIT_MAXIMUM },
    );
  }

  static setExchangeRate(dollarsPerMatic) {
    if (dollarsPerMatic === 0) { // For testing purposes.
      return PuzzleCard.CONTRACT.setBasePrice(0);
    }

    const matic = PuzzleCard.BASE_PRICE_IN_DOLLARS / dollarsPerMatic;
    const wei = matic * PuzzleCard.WEI_PER_MATIC;

    const basePriceInWei = BigInt(Math.round(wei));
    return PuzzleCard.CONTRACT.setBasePrice(basePriceInWei);
  }

  // private methods

  static async isOwner() {
    const address1 = PuzzleCard.CONTRACT.signer.address;
    if (address1 && address1.toLowerCase() === PuzzleCard.CONTRACT_OWNER) { return true; }

    const address2 = await PuzzleCard.CONTRACT.signer.getAddress();
    if (address2 && address2.toLowerCase() === PuzzleCard.CONTRACT_OWNER) { return true; }

    return false;
  }

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

    return PuzzleCard.call(actionName, puzzleCards, true).then(PuzzleCard.fromTransferEvent);
  }

  static canPerformAction(actionName, puzzleCards, expectedNumArgs) {
    if (puzzleCards.length != expectedNumArgs) {
      return Promise.resolve([false, `[${expectedNumArgs} cards are required]`]);
    }

    return PuzzleCard.call(actionName, puzzleCards, false).then(PuzzleCard.decodeErrors);
  }

  static async call(functionName, puzzleCards, setGasLimit) {
    const args = [...puzzleCards]
      .sort((a, b) => a.typeIndex() - b.typeIndex())
      .map(card => card.tokenID());

    let options = {};

    if (setGasLimit) {
      const baseGasPrice = (await PuzzleCard.CONTRACT.provider.getGasPrice()).toNumber();
      const gasPrice = baseGasPrice * PuzzleCard.GAS_PRICE_MULTIPLIER;

      options = { gasLimit: PuzzleCard.GAS_LIMIT_MINIMUM, gasPrice };
    }

    return PuzzleCard.CONTRACT[functionName](args, options);
  }

  static decodeErrors([isAllowed, errorCodes]) {
    const strings = errorCodes.map((bool, i) => bool ? PuzzleCard.ERROR_STRINGS[i] : null);
    return [isAllowed, strings.filter(s => s)];
  }

  static fromTransferEvent(transaction) {
    return transaction.wait().then(receiver => {
      const events = receiver.events.filter(e => e.event === "TransferSingle");
      return events.map(e => PuzzleCard.fromTokenID(e.args.id.toBigInt()));
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

    const outdatedDeckIndex = await fetch(PuzzleCard.DECK_INDEXES_URI.replace("{address}", address)).then(r => r.json()).catch(() => ({}));;
    const lastIndexedBlock = await fetch(PuzzleCard.LAST_INDEXED_URI).then(r => r.json()).catch(() => PuzzleCard.CONTRACT_BLOCK);

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
    const justChanged = [];

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

      justChanged.push({ card, quantity, lastDelta: delta, tokenID });
    }

    return justChanged;
  }
}

// constants

PuzzleCard.SERIES_NAMES = ["The Beginning", "Getting Started", "Escape", "Star Gazing", "Darkness Yields Light", "Teamwork", "Mutual Exclusion", "Crab???s Day Out", "Dark Channel", "Sands of Time", "Contending Claws", "Trial of Rebirth", "Pitch Black", "Two by Two", "Trial of Logic", "Trial of Skill", "Trial of Reign"];
PuzzleCard.PUZZLE_NAMES = ["What is this?", "Hidden Entrance", "Death Pit", "God Rays", "Unlock the Door", "In the Dark", "Locked Out", "One Way Up", "Red Room", "Above and Below", "Yellow Moon Maze", "Stuck on the Roof", "One of Each", "Locked In", "Be Patient", "Out of Reach", "Mini Gauntlet", "Need a Lift", "Prior Descent", "Missing Moon", "Rising Pillars", "Forbidden Door", "Up We Go", "The Way Back", "Pit Stop", "Platform Ride", "Cryptic Conversation", "Asteroid Hopping", "Mysterious Aura", "Beach Vandals", "Buried in the Sand", "Underwater Impasse", "Too Dark To See", "Watch Those Stings", "My Beautiful Children", "Bask Briefly", "Sand Pit", "Along for the Ride", "Asymmetry", "Down Down Down", "Sand Trap", "Not Helpful", "Catch a Star", "Alternating Pillars", "Pillar of Crabs", "Beach Obstacle", "Crab Construction", "Balancing Act I", "Balancing Act II", "Hidden Blockade", "Three Pillars", "Time to Stack", "Oscillator", "Stepping Stones", "Pink Gauntlet", "Remote Control", "Crab Sticks", "Friendly Support", "Mind Your Head", "Moon Stairs", "All Aboard", "Vertical Stack", "Side by Side", "Build a Bridge", "Out to Sea", "Tree Timer", "Ahoy, Me Crab", "Crow???s Star", "Hungry for Crab", "Ghost Raft", "Guarded Door", "Come Back Earlier", "Missed the Drop", "Sky Crab", "Spawn Points", "Star Up High", "Hop the Barrier", "State Change", "They See Me Rollin???", "Island Hopping", "Rock Moon", "Crab Island", "Phase", "Rock Jellyfish", "Superlumi-Nonsense", "Base Pair", "Gerald Ellyfish I", "Gerald Ellyfish II", "Dark Star", "Squashed", "Mental Model", "Broken Ladder", "Misdirection", "Sunken Ring", "Brief Bridge", "A Leg Up", "My Visiting Children", "Self Support", "Stack Building", "Not High Enough", "Opposite Ends", "Prior Ascent", "The Wrong Side", "Red Moon Maze", "Green Moon Maze", "Mesh", "Six Crabs", "Muscle Memory", "Decoy Step", "Over the Wall", "Waterfall", "Forbidden TV", "Hands Gruber I", "Hands Gruber II", "Hands Gruber III", "Hands Gruber IV"];
PuzzleCard.TIER_NAMES = ["Mortal", "Immortal", "Ethereal", "Virtual", "Celestial", "Godly", "Master"];
PuzzleCard.TYPE_NAMES = ["Player", "Crab", "Cloak", "Inactive", "Active", "Telescope", "Helix", "Beacon", "Torch", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Star", "Artwork"];
PuzzleCard.COLOR_NAMES = ["None", "Yellow", "Black", "Green", "White", "Blue", "Red", "Pink"];
PuzzleCard.VARIANT_NAMES = ["None", "Sun", "Moon", "Open", "Closed", "Idle Front", "Idle Back", "Idle Left", "Idle Right", "Walk Left 1", "Walk Left 2", "Walk Left 3", "Walk Left 4", "Walk Left 5", "Walk Left 6", "Walk Left 7", "Walk Left 8", "Walk Right 1", "Walk Right 2", "Walk Right 3", "Walk Right 4", "Walk Right 5", "Walk Right 6", "Walk Right 7", "Walk Right 8", "Jump Left 1", "Jump Left 2", "Jump Left 3", "Jump Left 4", "Jump Left 5", "Jump Left 6", "Jump Right 1", "Jump Right 2", "Jump Right 3", "Jump Right 4", "Jump Right 5", "Jump Right 6", "Climb 1", "Climb 2", "Swim Left 1", "Swim Left 2", "Swim Left 3", "Swim Left 4", "Swim Left 5", "Swim Left 6", "Swim Left 7", "Swim Left 8", "Swim Right 1", "Swim Right 2", "Swim Right 3", "Swim Right 4", "Swim Right 5", "Swim Right 6", "Swim Right 7", "Swim Right 8", "Tread Water 1", "Tread Water 2", "Tread Water 3", "Tread Water 4", "Tread Water 5", "Dive", "Standing", "Point Left", "Point Right", "Swim Left", "Swim Right", "Floating", "Plain", "With Time", "With Date", "With Time, Date", "With Location", "With Time, Location", "With Date, Location", "With Time, Date, Location", "Player Sketch", "Car Body", "Car Tyre", "Two Torches", "Solar Spikes", "Sun Padlock", "Book Cover", "Ancient Door", "Overgrown Door", "Seaweed", "Starfish", "Jellyfish", "Anglerfish", "Helix Coral", "Big Tree", "Small Tree", "Ladder Tree", "Baby Crab", "Black Hourglass", "White Hourglass", "Frozen Moon", "Frozen Sun", "Ice Block"];
PuzzleCard.CONDITION_NAMES = ["Dire", "Poor", "Reasonable", "Excellent", "Pristine"];
PuzzleCard.EDITION_NAMES = ["Standard", "Signed", "Limited", "Master Copy"];
PuzzleCard.ACTION_NAMES = ["activateSunOrMoon", "changeLensColor", "discard2Pickup1", "goThroughStarDoor", "jumpIntoBeacon", "jumpIntoEclipse", "lookThroughGlasses", "lookThroughTelescope", "puzzleMastery1", "puzzleMastery2", "shineTorchOnBasePair", "teleportToNextArea"];
PuzzleCard.CAN_ACTION_NAMES = PuzzleCard.ACTION_NAMES.map(s => "can" + s[0].toUpperCase() + s.slice(1));

PuzzleCard.NUM_PUZZLES_PER_SERIES = [4, 9, 13, 3, 7, 14, 14, 4, 3, 8, 4, 5, 6, 8, 4, 6, 4];
PuzzleCard.SERIES_FOR_EACH_PUZZLE = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16];
PuzzleCard.PUZZLE_OFFSET_PER_SERIES = [0, 4, 13, 26, 29, 36, 50, 64, 68, 71, 79, 83, 88, 94, 102, 106, 112];
PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 1, 2, 0, 0, 2, 0, 0, 0, 1, 0];
PuzzleCard.NUM_VARIANTS_PER_TYPE = [56, 6, 0, 2, 2, 2, 0, 0, 0, 8, 0, 0, 0, 2, 0, 0, 23];
PuzzleCard.VARIANT_OFFSET_PER_TYPE = [5, 61, 0, 1, 1, 1, 0, 0, 0, 67, 0, 0, 0, 3, 0, 0, 75];

PuzzleCard.MINTING_CARDS_ENABLED = true;

// The intention is that these prices remain fixed but the base price in Wei is
// updated as the dollar/matic exchange rate changes over time.
PuzzleCard.MINT_PRICE_MULTIPLERS = [1, 2, 5, 10, 20, 50, 100];
PuzzleCard.UNLOCK_PRICE_MULTIPLIER = 10000;
PuzzleCard.BASE_PRICE_IN_DOLLARS = 0.01;
PuzzleCard.WEI_PER_MATIC = 1000000000000000000;

PuzzleCard.STANDARD_TYPE_PROBABILITIES = [300, 100, 100, 200, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
PuzzleCard.VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
PuzzleCard.POST_VIRTUAL_TYPE_PROBABILITIES = [0, 1, 100, 200, 100, 100, 20, 20, 20, 10, 10, 0, 4, 6];
PuzzleCard.MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

PuzzleCard.MAX_LIMITED_EDITIONS = 100;

PuzzleCard.TOKEN_METADATA_URI = "https://d3fjxldyah6ziy.cloudfront.net/metadata_api/{id}.json";
PuzzleCard.CONTRACT_METADATA_URI = PuzzleCard.TOKEN_METADATA_URI.replace("{id}", "contract");

PuzzleCard.CARD_IMAGES_URI = "https://d3fjxldyah6ziy.cloudfront.net/card_images/{id}.jpeg"
PuzzleCard.PUZZLE_VIDEOS_URI = "https://d3fjxldyah6ziy.cloudfront.net/puzzle_videos/{encoding}_{quality}_quality/{slug}.mp4",

PuzzleCard.CARD_VIEWS_URI = "https://puzzlecards.github.io/card?tokenID={id}&referrer={referrer}";
PuzzleCard.OPEN_SEA_URI = "https://opensea.io/assets/matic/{contract}/{id}";

PuzzleCard.DECK_INDEXES_URI = "https://puzzlecards.github.io/decks/{address}.json";
PuzzleCard.LAST_INDEXED_URI = PuzzleCard.DECK_INDEXES_URI.replace("{address}.json", "_last_indexed");

// Set a minimum gas limit that provides enough headroom for all actions.
// Set a maximum gas limit that matches the limit for the polygon network.
PuzzleCard.GAS_LIMIT_MINIMUM = 350000;
PuzzleCard.GAS_LIMIT_MAXIMUM = 20000000;

// Determines the gas limit for minting x cards: (ax + c) * safety
PuzzleCard.GAS_LIMIT_EQUATION = [57314, 50914];
PuzzleCard.GAS_LIMIT_SAFETY = 1.5;

// TODO: reduce the coefficients of the equation after the contract has been deployed
// for a while since the gas usage seems to decrease over time. This will cause lower
// gas prices to be quoted in MetaMask. Consider reintroducing the 500 mint option.
//
// https://docs.google.com/spreadsheets/d/1j9_so0aOQGC67h7meyfrKewDpC-4mR3AbErdCnsI0Po

// Can be set to a higher/lower value to make all actions use a different gas price.
PuzzleCard.GAS_PRICE_MULTIPLIER = 1;

// The maximum number of cards that could be minted without exceeding the gas limit.
PuzzleCard.MAX_BATCH_SIZE = 230;

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
  "[the tiers of the cards don't match]",
  "[user doesn't own all the cards]",
  "[only works with a cloak card at this tier]",
  "[seven star cards are required]",
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

PuzzleCard.PROXY_REGISTRY_ADDRESS = "0x58807bad0b376efc12f5ad86aac70e78ed67deae";
PuzzleCard.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

PuzzleCard.CONTRACT_ADDRESS = "0x8c2c67073658503d8623e22297a9bbc524a5d944";
PuzzleCard.CONTRACT_OWNER = "0xbc50c6815ff8c11fb35ea70d9f79f90d5744182a";
PuzzleCard.CONTRACT_NETWORK = {"name":"Polygon Mainnet","url":"https://matic-mainnet.chainstacklabs.com","url2":"https://rpc-mainnet.maticvigil.com","chainId":137,"symbol":"MATIC","explorer":"https://polygonscan.com"};
PuzzleCard.CONTRACT_BLOCK = 22869109;

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
  "function basePriceInWei() view returns (uint256)",
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
  "function contractURI() view returns (string)",
  "function discard2Pickup1(uint256[] tokenIDs)",
  "function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)",
  "function exists(uint256 tokenID) view returns (bool)",
  "function getChainId() view returns (uint256)",
  "function getDomainSeperator() view returns (bytes32)",
  "function getNonce(address user) view returns (uint256 nonce)",
  "function goThroughStarDoor(uint256[] tokenIDs)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function jumpIntoBeacon(uint256[] tokenIDs)",
  "function jumpIntoEclipse(uint256[] tokenIDs)",
  "function limitedEditions(uint256) view returns (uint256)",
  "function lookThroughGlasses(uint256[] tokenIDs)",
  "function lookThroughTelescope(uint256[] tokenIDs)",
  "function masterCopyClaimedAt(uint16) view returns (uint8)",
  "function maxTierUnlocked(address) view returns (uint8)",
  "function mint(uint256 numberToMint, uint8 tier, address to) payable",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function puzzleMastery1(uint256[] tokenIDs)",
  "function puzzleMastery2(uint256[] tokenIDs)",
  "function renounceOwnership()",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function setBasePrice(uint256 _basePriceInWei)",
  "function shineTorchOnBasePair(uint256[] tokenIDs)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function teleportToNextArea(uint256[] tokenIDs)",
  "function totalSupply(uint256) view returns (uint256)",
  "function transferOwnership(address newOwner)",
  "function unlockMintingAtAllTiers(address address_) payable",
  "function updateConstants(bool mintingCardsEnabled, uint8[] numPuzzlesPerSeries, uint8[] seriesForEachPuzzle, uint8[] numVariantsPerType, uint256[7] mintPriceMultipliers, uint256 unlockPriceMultiplier, address proxyRegistryAddress, string contractMetadataURI, string tokenMetadataURI)",
  "function uri(uint256) view returns (string)"
];

if (typeof module !== "undefined") {
  module.exports = PuzzleCard;
}
