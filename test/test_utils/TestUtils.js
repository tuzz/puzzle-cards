const TestUtils = {};

TestUtils.addHelpfulMethodsTo = (contract) => {
  contract.mintExactByNames = TestUtils.mintExactByNames(contract);
};

TestUtils.mintExactByNames = (contract) => async ({ series, puzzle, tier, type, type_, color1, color2, variant, condition, edition }, toAddress) => {
  if (!TestUtils.arraysRead) { await TestUtils.readArrays(contract); }

  // If puzzle or variant are set to 0 rather than a name, just set them to 0
  // rather than looking up the name and using relative indexing.

  const seriesIndex = TestUtils.seriesNames.indexOf(series);
  const relPuzzleIndex = TestUtils.puzzleNames.indexOf(puzzle) - TestUtils.puzzleOffsetPerSeries[seriesIndex];
  const puzzleIndex = puzzle === 0 ? 0 : relPuzzleIndex;

  const typeIndex = TestUtils.typeNames.indexOf(type || type_);
  const relVariantIndex = TestUtils.variantNames.indexOf(variant) - TestUtils.variantOffsetPerType[typeIndex];
  const variantIndex = variant === 0 ? 0 : relVariantIndex;

  return contract.mintExact(
    seriesIndex,
    puzzleIndex,
    TestUtils.tierNames.indexOf(tier),
    typeIndex,
    TestUtils.colorNames.indexOf(color1),
    TestUtils.colorNames.indexOf(color2),
    variantIndex,
    TestUtils.conditionNames.indexOf(condition),
    TestUtils.editionNames.indexOf(edition),
    toAddress,
  );
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
  await TestUtils.readArray(contract, "seriesNames");
  await TestUtils.readArray(contract, "puzzleNames");
  await TestUtils.readArray(contract, "tierNames");
  await TestUtils.readArray(contract, "typeNames");
  await TestUtils.readArray(contract, "colorNames");
  await TestUtils.readArray(contract, "variantNames");
  await TestUtils.readArray(contract, "conditionNames");
  await TestUtils.readArray(contract, "editionNames");

  await TestUtils.readArray(contract, "numPuzzlesPerSeries");
  await TestUtils.readArray(contract, "puzzleOffsetPerSeries");
  await TestUtils.readArray(contract, "numColorSlotsPerType");
  await TestUtils.readArray(contract, "numVariantsPerType");
  await TestUtils.readArray(contract, "variantOffsetPerType");

  await TestUtils.readArray(contract, "tierProbabilities");
  await TestUtils.readArray(contract, "typeProbabilities");
  await TestUtils.readArray(contract, "conditionProbabilities");

  TestUtils.arraysRead = true;
};

TestUtils.readArray = async (contract, getter) => {
  TestUtils[getter] = [];

  for (let i = 0; true; i += 1) {
    try {
      const name = await contract[getter](i);
      TestUtils[getter].push(name);
    } catch {
      break;
    }
  }
};

module.exports = TestUtils;
