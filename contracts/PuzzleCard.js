class PuzzleCard {
  constructor({ series, puzzle, tier, type, color1 = "None", color2 = "None", variant = "None", condition, edition }) {
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

  static fromTokenID(tokenID) {
    return this.fromHexString(tokenID.toString(16));
  }

  tokenID() {
    return BigInt(this.hexString());
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

  // private

  static fromHexString(hex) {
    const startFrom = hex.length - 18;
    const indexes = [];

    for (let i = 0; i < 9; i += 1) {
      const offset = startFrom + i * 2;
      const digits = hex.substring(offset, offset + 2);
      const index = parseInt(digits || "", 16);

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
}

PuzzleCard.SERIES_NAMES = ["Series 0", "Series 1"];
PuzzleCard.PUZZLE_NAMES = ["Puzzle 0-0", "Puzzle 0-1", "Puzzle 1-0", "Puzzle 1-1", "Puzzle 1-2"];
PuzzleCard.TIER_NAMES = ["Mortal", "Immortal", "Ethereal", "Virtual", "Celestial", "Godly", "Master"];
PuzzleCard.TYPE_NAMES = ["Player", "Crab", "Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Star", "Artwork"];
PuzzleCard.COLOR_NAMES = ["None", "Yellow", "Black", "Green", "White", "Blue", "Red", "Pink"];
PuzzleCard.VARIANT_NAMES = ["None", "Sun", "Moon", "Open", "Closed", "Art 0", "Art 1"];
PuzzleCard.CONDITION_NAMES = ["Dire", "Poor", "Reasonable", "Excellent", "Pristine"];
PuzzleCard.EDITION_NAMES = ["Standard", "Signed", "Limited", "Master Copy"];
PuzzleCard.ACTION_NAMES = ["activateSunOrMoon", "changeLensColor", "discard2Pickup1", "goThroughStarDoor", "jumpIntoBeacon", "jumpIntoEclipse", "lookThroughGlasses", "lookThroughTelescope", "puzzleMastery1", "puzzleMastery2", "shineTorchOnBasePair", "teleportToNextArea"];

PuzzleCard.NUM_PUZZLES_PER_SERIES = [2, 3];
PuzzleCard.PUZZLE_OFFSET_PER_SERIES = [0, 2];
PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 1, 0];
PuzzleCard.NUM_VARIANTS_PER_TYPE = [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
PuzzleCard.VARIANT_OFFSET_PER_TYPE = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];
PuzzleCard.CARD_SLOT_PER_TYPE = [0, 0, 2, 2, 0, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2];

PuzzleCard.TIER_PROBABILITIES = [90, 10];
PuzzleCard.CONDITION_PROBABILITIES = [80, 20];
PuzzleCard.STANDARD_TYPE_PROBABILITIES = [300, 100, 200, 100, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
PuzzleCard.VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
PuzzleCard.MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

module.exports = PuzzleCard;
