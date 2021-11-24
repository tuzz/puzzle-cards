const fs = require("fs")
const PuzzleCard = require("../public/PuzzleCard");

const main = async () => {
  const variantsPerType = {
    Player: [
      "Climb 1",
      "Climb 2",
      "Dive",
      "Idle Back",
      "Idle Front",
      "Idle Left",
      "Idle Right",
      "Jump Left 1",
      "Jump Left 2",
      "Jump Left 3",
      "Jump Left 4",
      "Jump Left 5",
      "Jump Left 6",
      "Jump Right 1",
      "Jump Right 2",
      "Jump Right 3",
      "Jump Right 4",
      "Jump Right 5",
      "Jump Right 6",
      "Swim Left 1",
      "Swim Left 2",
      "Swim Left 3",
      "Swim Left 4",
      "Swim Left 5",
      "Swim Left 6",
      "Swim Left 7",
      "Swim Left 8",
      "Swim Right 1",
      "Swim Right 2",
      "Swim Right 3",
      "Swim Right 4",
      "Swim Right 5",
      "Swim Right 6",
      "Swim Right 7",
      "Swim Right 8",
      "Tread Water 1",
      "Tread Water 2",
      "Tread Water 3",
      "Tread Water 4",
      "Tread Water 5",
      "Walk Left 1",
      "Walk Left 2",
      "Walk Left 3",
      "Walk Left 4",
      "Walk Left 5",
      "Walk Left 6",
      "Walk Left 7",
      "Walk Left 8",
      "Walk Right 1",
      "Walk Right 2",
      "Walk Right 3",
      "Walk Right 4",
      "Walk Right 5",
      "Walk Right 6",
      "Walk Right 7",
      "Walk Right 8",
    ],
    Crab: [
      "Point Left",
      "Point Right",
      "Standing",
      "Swim Left",
      "Swim Right",
      "Floating",
    ],
    Cloak: [],
    Inactive: [
      "Sun",
      "Moon",
    ],
    Active: [
      "Sun",
      "Moon",
    ],
    Telescope: [
      "Sun",
      "Moon",
    ],
    Helix: [],
    Beacon: [],
    Torch: [],
    Map: [
      "Plain",
      "With Time",
      "With Date",
      "With Time, Date",
      "With Location",
      "With Time, Location",
      "With Date, Location",
      "With Time, Date, Location",
    ],
    Teleport: [],
    Glasses: [],
    Eclipse: [],
    Door: [
      "Open",
      "Closed",
    ],
    Hidden: [],
    Star: [],
    Artwork: [
      "Art 0",
      "Art 1",
    ],
  };

  const puzzlesPerSeries = {
    "Darkness Yields Light": ["I", "II", "III", "IV"],
    "Teamwork": ["I", "II", "III", "IV", "V", "VI"],
  };

  const numVariantsPerType = PuzzleCard.TYPE_NAMES.map(type => variantsPerType[type].length);
  const variantNames = orderVariants(variantsPerType);

  const variantOffsetPerType = PuzzleCard.TYPE_NAMES.map(type => (
    variantNames.findIndex(v => v === (variantsPerType[type][0] || "None"))
  ));

  const seriesNames = Object.keys(puzzlesPerSeries);
  const puzzleNames = seriesNames.flatMap(series => puzzlesPerSeries[series]);

  const numPuzzlesPerSeries = seriesNames.map(series => puzzlesPerSeries[series].length);
  const seriesForEachPuzzle = buildReverseIndex(numPuzzlesPerSeries);

  const puzzleOffsetPerSeries = seriesNames.map((_, i) => (
    numPuzzlesPerSeries.slice(0, i).reduce((a, b) => a + b, 0)
  ));

  const args = {
    numVariantsPerType,
    variantNames,
    variantOffsetPerType,
    seriesNames,
    puzzleNames,
    numPuzzlesPerSeries,
    seriesForEachPuzzle,
    puzzleOffsetPerSeries,
  };

  updateConstants("public/PuzzleCard.js", args);
  updateConstants("contracts/PuzzleCard.sol", args);

  // TODO: add a --deploy flag to the script that also calls the #updateConstants contract method
};

const orderVariants = (variantsPerType) => {
  const ordered = { None: 0, Sun: 1, Moon: 2, Open: 3, Closed: 4 };
  let nextIndex = 5;

  const remainingTypes = PuzzleCard.TYPE_NAMES.filter(t => (
    t !== "Active" && t !== "Inactive" && t !== "Telescope" && t !== "Door"
  ));

  for (let type of remainingTypes) {
    for (let variant of variantsPerType[type]) {
      if (ordered.hasOwnProperty(variant)) {
        throw new Error(`Variant ${variant} is repeated`);
      }

      ordered[variant] = nextIndex;
      nextIndex += 1;
    }
  }

  return Object.keys(ordered);
};

const buildReverseIndex = (numPuzzlesPerSeries) => {
  const seriesForEachPuzzle = [];

  for (let series = 0; series < numPuzzlesPerSeries.length; series += 1) {
    for (let i = 0; i < numPuzzlesPerSeries[series]; i += 1) {
      seriesForEachPuzzle.push(series);
    }
  }

  return seriesForEachPuzzle;
}

const updateConstants = (filename, args) => {
  const content = fs.readFileSync(filename, "utf8")
    .replace(/NUM_VARIANTS_PER_TYPE = .*;/, `NUM_VARIANTS_PER_TYPE = ${JSON.stringify(args.numVariantsPerType).replaceAll(",", ", ")};`)
    .replace(/VARIANT_NAMES = .*;/, `VARIANT_NAMES = ${JSON.stringify(args.variantNames).replaceAll(",", ", ").replaceAll(",  ", ", ")};`)
    .replace(/VARIANT_OFFSET_PER_TYPE = .*;/, `VARIANT_OFFSET_PER_TYPE = ${JSON.stringify(args.variantOffsetPerType).replaceAll(",", ", ")};`)
    .replace(/SERIES_NAMES = .*;/, `SERIES_NAMES = ${JSON.stringify(args.seriesNames).replaceAll(",", ", ")};`)
    .replace(/PUZZLE_NAMES = .*;/, `PUZZLE_NAMES = ${JSON.stringify(args.puzzleNames).replaceAll(",", ", ")};`)
    .replace(/NUM_PUZZLES_PER_SERIES = .*;/, `NUM_PUZZLES_PER_SERIES = ${JSON.stringify(args.numPuzzlesPerSeries).replaceAll(",", ", ")};`)
    .replace(/SERIES_FOR_EACH_PUZZLE = .*;/, `SERIES_FOR_EACH_PUZZLE = ${JSON.stringify(args.seriesForEachPuzzle).replaceAll(",", ", ")};`)
    .replace(/PUZZLE_OFFSET_PER_SERIES = .*;/, `PUZZLE_OFFSET_PER_SERIES = ${JSON.stringify(args.puzzleOffsetPerSeries).replaceAll(",", ", ")};`)

  fs.writeFileSync(filename, content);
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
