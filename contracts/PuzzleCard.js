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

  static setContract(contract) {
    PuzzleCard.CONTRACT = contract;
  }

  static actionsThatCanBeTaken(puzzleCards) {
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

  static updateConstants() {
    return PuzzleCard.CONTRACT.updateConstants(
      PuzzleCard.NUM_PUZZLES_PER_SERIES,
      PuzzleCard.PUZZLE_OFFSET_PER_SERIES,
      PuzzleCard.NUM_VARIANTS_PER_TYPE,
      PuzzleCard.VARIANT_OFFSET_PER_TYPE,
      PuzzleCard.METADATA_URI,
      PuzzleCard.PROXY_REGISTRY_ADDRESS,
      PuzzleCard.PRICE_PER_CARD,
    );
  }

  static performAction(actionName, puzzleCards, expectedNumArgs) {
    if (puzzleCards.length != expectedNumArgs) {
      throw new Error(`[${expectedNumArgs} cards are required]`);
    }

    return PuzzleCard.call(actionName, puzzleCards).then(PuzzleCard.fromTransaction);
  }

  static canPerformAction(actionName, puzzleCards, expectedNumArgs) {
    if (puzzleCards.length != expectedNumArgs) {
      return Promise.resolve([false, `[${expectedNumArgs} cards are required]`]);
    }

    return PuzzleCard.call(actionName, puzzleCards).then(PuzzleCard.decodeErrors);
  }

  static call(functionName, puzzleCards) {
    const args = [...puzzleCards]
      .sort((a, b) => a.typeIndex() - b.typeIndex())
      .map(card => card.tokenID());

    return PuzzleCard.CONTRACT[functionName](args);
  }

  static allCards() {
    // TODO
  }

  static allPuzzles() {
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

  static decodeErrors([isAllowed, errorCodes]) {
    const strings = errorCodes.map((bool, i) => bool ? PuzzleCard.ERROR_STRINGS[i] : null);
    return [isAllowed, strings.filter(s => s)];
  }

  static fromTransaction(transaction) {
    return transaction.wait().then(receiver => {
      const event = receiver.events.filter(e => e.event === "TransferSingle")[0];
      const tokenID = event.args.id.toBigInt();

      return PuzzleCard.fromTokenID(tokenID);
    });
  }

  static fromTokenID(tokenID) {
    return PuzzleCard.fromHexString(tokenID.toString(16));
  }

  tokenID() {
    return BigInt(this.hexString());
  }

  static priceToMint(numberToMint) {
    return BigInt(numberToMint) * PuzzleCard.PRICE_PER_CARD;
  }


  numLimitedEditions(contract) {
    return contract.limitedEditions(BigInt(this.editionsHexString()));
  }

  masterCopyClaimed(contract) {
    return contract.masterCopiesClaimed(BigInt(this.editionsHexString()));
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

  hexString() {
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

  editionsHexString() {
    return "0x" + [
      this.seriesIndex(),
      this.relativePuzzleIndex(),
    ].map(i => i.toString(16).padStart(2, "0")).join("");
  }
}

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
PuzzleCard.PRICE_PER_CARD = 78830000000000000n; // $0.10 in Polygon Wei.
PuzzleCard.METADATA_URI = "https://puzzlecards.github.io/metadata/{id}.json";

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

module.exports = PuzzleCard;
