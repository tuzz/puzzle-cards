const fs = require("fs")

const main = async () => {
  let PuzzleCard = require("../public/PuzzleCard");

  const variantsPerType = {
    Player: [
      "Idle Front",
      "Idle Back",
      "Idle Left",
      "Idle Right",
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
      "Climb 1",
      "Climb 2",
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
      "Dive",
    ],
    Crab: [
      "Standing",
      "Point Left",
      "Point Right",
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
      "Player Sketch",
      "Car Body",
      "Car Tyre",
      "Two Torches",
      "Solar Spikes",
      "Sun Padlock",
      "Book Cover",
      "Ancient Door",
      "Overgrown Door",
      "Seaweed",
      "Starfish",
      "Jellyfish",
      "Anglerfish",
      "Helix Coral",
      "Big Tree",
      "Small Tree",
      "Ladder Tree",
      "Baby Crab",
      "Black Hourglass",
      "White Hourglass",
      "Frozen Moon",
      "Frozen Sun",
      "Ice Block",
    ],
  };

  const puzzlesPerSeries = {
    "The Beginning": [
      "What is this?",
      "Hidden Entrance",
      "Death Pit",
      "God Rays",
    ],
    "Getting Started": [
      "Unlock the Door",
      "In the Dark",
      "Locked Out",
      "One Way Up",
      "Red Room",
      "Above and Below",
      "Yellow Moon Maze",
      "Stuck on the Roof",
      "One of Each",
    ],
    "Escape": [
      "Locked In",
      "Be Patient",
      "Out of Reach",
      "Mini Gauntlet",
      "Need a Lift",
      "Prior Descent",
      "Missing Moon",
      "Rising Pillars",
      "Forbidden Door",
      "Up We Go",
      "The Way Back",
      "Pit Stop",
      "Platform Ride",
    ],
    "Star Gazing": [
      "Cryptic Conversation",
      "Asteroid Hopping",
      "Mysterious Aura",
    ],
    "Darkness Yields Light": [
      "Beach Vandals",
      "Buried in the Sand",
      "Underwater Impasse",
      "Too Dark To See",
      "Watch Those Stings",
      "My Beautiful Children",
      "Bask Briefly",
    ],
    "Teamwork": [
      "Sand Pit",
      "Along for the Ride",
      "Asymmetry",
      "Down Down Down",
      "Sand Trap",
      "Not Helpful",
      "Catch a Star",
      "Alternating Pillars",
      "Pillar of Crabs",
      "Beach Obstacle",
      "Crab Construction",
      "Balancing Act I",
      "Balancing Act II",
      "Hidden Blockade",
    ],
    "Mutual Exclusion": [
      "Three Pillars",
      "Time to Stack",
      "Oscillator",
      "Stepping Stones",
      "Pink Gauntlet",
      "Remote Control",
      "Crab Sticks",
      "Friendly Support",
      "Mind Your Head",
      "Moon Stairs",
      "All Aboard",
      "Vertical Stack",
      "Side by Side",
      "Build a Bridge",
    ],
    "Crab???s Day Out": [
      "Out to Sea",
      "Tree Timer",
      "Ahoy, Me Crab",
      "Crow???s Star",
    ],
    "Dark Channel": [
      "Hungry for Crab",
      "Ghost Raft",
      "Guarded Door",
    ],
    "Sands of Time": [
      "Come Back Earlier",
      "Missed the Drop",
      "Sky Crab",
      "Spawn Points",
      "Star Up High",
      "Hop the Barrier",
      "State Change",
      "They See Me Rollin???",
    ],
    "Contending Claws": [
      "Island Hopping",
      "Rock Moon",
      "Crab Island",
      "Phase",
    ],
    "Trial of Rebirth": [
      "Rock Jellyfish",
      "Superlumi-Nonsense",
      "Base Pair",
      "Gerald Ellyfish I",
      "Gerald Ellyfish II",
    ],
    "Pitch Black": [
      "Dark Star",
      "Squashed",
      "Mental Model",
      "Broken Ladder",
      "Misdirection",
      "Sunken Ring",
    ],
    "Two by Two": [
      "Brief Bridge",
      "A Leg Up",
      "My Visiting Children",
      "Self Support",
      "Stack Building",
      "Not High Enough",
      "Opposite Ends",
      "Prior Ascent",
    ],
    "Trial of Logic": [
      "The Wrong Side",
      "Red Moon Maze",
      "Green Moon Maze",
      "Mesh",
    ],
    "Trial of Skill": [
      "Six Crabs",
      "Muscle Memory",
      "Decoy Step",
      "Over the Wall",
      "Waterfall",
      "Forbidden TV",
    ],
    "Trial of Reign": [
      "Hands Gruber I",
      "Hands Gruber II",
      "Hands Gruber III",
      "Hands Gruber IV",
    ],
  };

  const numVariantsPerType = PuzzleCard.TYPE_NAMES.map(type => variantsPerType[type].length);
  const variantNames = orderVariants(variantsPerType, PuzzleCard);

  const variantOffsetPerType = PuzzleCard.TYPE_NAMES.map(type => (
    variantNames.findIndex(v => v === (variantsPerType[type][0] || "None"))
  ));

  const seriesNames = Object.keys(puzzlesPerSeries);
  const puzzleNames = orderPuzzles(puzzlesPerSeries, PuzzleCard);

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

  if (process.env.DEPLOY !== "true") {
    console.log("PuzzleCard.js updated but not deploying because DEPLOY=true was not set.");
    return;
  }

  PuzzleCard = reload(PuzzleCard);

  const [owner] = await ethers.getSigners();

  PuzzleCard.attach(ethers, ethers.provider);
  PuzzleCard.connect(owner);

  const receipt = await PuzzleCard.updateConstants();
  const transaction = await receipt.wait();

  console.log(transaction);
  console.log(`PuzzleCard.js updated and deployed to contract ${PuzzleCard.CONTRACT_ADDRESS}`);
};

const orderVariants = (variantsPerType, PuzzleCard) => {
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

const orderPuzzles = (puzzlesPerSeries, PuzzleCard) => {
  const ordered = {};
  let nextIndex = 0;

  for (let series of PuzzleCard.SERIES_NAMES) {
    for (let puzzle of puzzlesPerSeries[series]) {
      if (ordered.hasOwnProperty(puzzle)) {
        throw new Error(`Puzzle ${puzzle} is repeated`);
      }

      ordered[puzzle] = nextIndex;
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
    .replace(/PUZZLE_NAMES = .*;/, `PUZZLE_NAMES = ${JSON.stringify(args.puzzleNames).replaceAll(",", ", ").replaceAll(",  ", ", ")};`)
    .replace(/NUM_PUZZLES_PER_SERIES = .*;/, `NUM_PUZZLES_PER_SERIES = ${JSON.stringify(args.numPuzzlesPerSeries).replaceAll(",", ", ")};`)
    .replace(/SERIES_FOR_EACH_PUZZLE = .*;/, `SERIES_FOR_EACH_PUZZLE = ${JSON.stringify(args.seriesForEachPuzzle).replaceAll(",", ", ")};`)
    .replace(/PUZZLE_OFFSET_PER_SERIES = .*;/, `PUZZLE_OFFSET_PER_SERIES = ${JSON.stringify(args.puzzleOffsetPerSeries).replaceAll(",", ", ")};`)

  fs.writeFileSync(filename, content);
};

const reload = (PuzzleCard) => {
  PuzzleCard.stale = true;

  delete require.cache[require.resolve("../public/PuzzleCard")];
  PuzzleCard = require("../public/PuzzleCard");

  if (PuzzleCard.stale) {
    throw new Error("Reloading PuzzleCard failed.");
  }

  return PuzzleCard;
};

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
