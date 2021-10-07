const TestUtils = {};

TestUtils.addHelpfulMethodsTo = (contract) => {
  contract.mintExactByNames = TestUtils.mintExactByNames(contract);
};

TestUtils.mintExactByNames = (contract) => async ({ series, puzzle, tier, type, type_, color1, color2, variant, condition }, toAddress) => {
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
    toAddress,
  );
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
    groups[key] = tallyFrequencies(array);
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
