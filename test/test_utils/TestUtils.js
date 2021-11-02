const PuzzleCard = require("../../public/PuzzleCard");

const TestUtils = {};

TestUtils.addHelpfulMethodsTo = (contract) => {
  contract.seriesName = (tokenID) => PuzzleCard.fromTokenID(tokenID).series;
  contract.puzzleName = (tokenID) => PuzzleCard.fromTokenID(tokenID).puzzle;
  contract.tierName = (tokenID) => PuzzleCard.fromTokenID(tokenID).tier;
  contract.typeName = (tokenID) => PuzzleCard.fromTokenID(tokenID).type;
  contract.color1Name = (tokenID) => PuzzleCard.fromTokenID(tokenID).color1;
  contract.color2Name = (tokenID) => PuzzleCard.fromTokenID(tokenID).color2;
  contract.variantName = (tokenID) => PuzzleCard.fromTokenID(tokenID).variant;
  contract.conditionName = (tokenID) => PuzzleCard.fromTokenID(tokenID).condition;
  contract.editionName = (tokenID) => PuzzleCard.fromTokenID(tokenID).edition;

  contract.actionsThatCanBeTaken = (tokenIDs) => PuzzleCard.actionsThatCanBeTaken(contract, tokenIDs);
};

TestUtils.baseCard = {
  series: "Series 1",
  puzzle: "Puzzle 1-2",
  tier: "Mortal",
  color1: "None",
  color2: "None",
  variant: "None",
  condition: "Excellent",
  edition: "Standard",
};

TestUtils.tokenID = async (promise) => {
  const transaction = await promise;
  const receiver = await transaction.wait();

  for (const e of receiver.events) {
    if (e.event !== "TransferSingle") { continue; }
    return e.args.id.toBigInt();
  }

  throw new Error("No TransferSingle event was emitted.");
};

TestUtils.batchTokenIDs = async (promise) => {
  const transaction = await promise;
  const receiver = await transaction.wait();

  for (const e of receiver.events) {
    if (e.event !== "TransferBatch") { continue; }
    // TODO: continue past transfers to the zero address (_burnBatch).
    return e.args.ids.map(id => id.toBigInt());
  }

  throw new Error("No TransferBatch event was emitted.");
};

TestUtils.tokenIDs = async (array, fn) => {
  const tokenIDs = [];

  for (let i = 0; i < array.length; i += 1) {
    tokenIDs.push(await TestUtils.tokenID(fn(array[i], i)));
  }

  return tokenIDs;
};

TestUtils.isRealColor = (colorName) => (
  TestUtils.colorNames.includes(colorName) && colorName !== "None"
);

TestUtils.tallyFrequencies = (array) => {
  const tally = {};
  const frequencies = {};

  for (const element of array) {
    tally[element] = tally[element] || 0;
    tally[element] += 1;
  }

  for (const [element, count] of Object.entries(tally)) {
    frequencies[element] = count / array.length;
  }

  return frequencies;
};

TestUtils.tallyFrequenciesInGroups = (pairs) => {
  const arrays = {};
  const groups = {};

  for (const [key, value] of pairs) {
    arrays[key] = arrays[key] || [];
    arrays[key].push(value);
  };

  for (const [key, array] of Object.entries(arrays)) {
    groups[key] = TestUtils.tallyFrequencies(array);
  }

  return groups;
};

TestUtils.readArrays = async (contract) => {
  TestUtils.seriesNames = PuzzleCard.SERIES_NAMES;
  TestUtils.puzzleNames = PuzzleCard.PUZZLE_NAMES;
  TestUtils.tierNames = PuzzleCard.TIER_NAMES;
  TestUtils.typeNames = PuzzleCard.TYPE_NAMES;
  TestUtils.colorNames = PuzzleCard.COLOR_NAMES;
  TestUtils.variantNames = PuzzleCard.VARIANT_NAMES;
  TestUtils.conditionNames = PuzzleCard.CONDITION_NAMES;
  TestUtils.editionNames = PuzzleCard.EDITION_NAMES;

  TestUtils.numPuzzlesPerSeries = PuzzleCard.NUM_PUZZLES_PER_SERIES;
  TestUtils.puzzleOffsetPerSeries = PuzzleCard.PUZZLE_OFFSET_PER_SERIES;
  TestUtils.numColorSlotsPerType = PuzzleCard.NUM_COLOR_SLOTS_PER_TYPE;
  TestUtils.numVariantsPerType = PuzzleCard.NUM_VARIANTS_PER_TYPE;
  TestUtils.variantOffsetPerType = PuzzleCard.VARIANT_OFFSET_PER_TYPE;

  TestUtils.arraysRead = true;
};

module.exports = TestUtils;
