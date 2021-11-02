const { expect } = require("chai");
const { it: _it } = require("mocha");
const { constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");
const PuzzleCard = require("../public/PuzzleCard");

const it = (n) => {
  if (typeof n !== "number") { throw new Error(`No test number for '${n}'`); }
  return TEST_TO_ISOLATE === n || TEST_TO_ISOLATE === -1 ? _it : _it.skip;
};

const TEST_TO_ISOLATE = -1;

describe("MintingRandomly", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    PuzzleCard.setContract(contract);

    // Prevent these tests from running out of gas. For some reason the first
    // few calls to the contract require more gas than they do in the long run.
    // Gifting the maximum number of cards doesn't run out of gas in production.
    PuzzleCard.GAS_LIMIT_MINIMUM = 30000000;
    PuzzleCard.GAS_LIMIT_MAXIMUM = 30000000;
  });

  describe("series", () => {
    it(0)("picks randomly", async () => {
      const cards = await PuzzleCard.gift(1000, "Mortal", owner.address);
      const frequencies = TestUtils.tallyFrequencies(cards.map(c => c.series));

      expect(frequencies["Series 0"]).to.be.within(0.47, 0.53); // 50%
      expect(frequencies["Series 1"]).to.be.within(0.47, 0.53); // 50%
    });
  });

  describe("puzzle", () => {
    it(1)("picks randomly within the series", async () => {
      const cards = await PuzzleCard.gift(2500, "Mortal", owner.address);
      const frequencies = TestUtils.tallyFrequenciesInGroups(cards.map(c => [c.series, c.puzzle]));

      expect(frequencies["Series 0"]["Puzzle 0-0"]).to.be.within(0.47, 0.53); // 50%
      expect(frequencies["Series 0"]["Puzzle 0-1"]).to.be.within(0.47, 0.53); // 50%

      expect(frequencies["Series 1"]["Puzzle 1-0"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Series 1"]["Puzzle 1-1"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Series 1"]["Puzzle 1-2"]).to.be.within(0.303, 0.366); // 33.3%
    });
  });

  describe("tier", () => {
    it(2)("sets the tier to the one specified", async () => {
      const mortalCards = await PuzzleCard.gift(100, "Mortal", owner.address);
      for (let card of mortalCards) { expect(card.tier).to.equal("Mortal"); }

      const immortalCards = await PuzzleCard.gift(100, "Immortal", owner.address);
      for (let card of immortalCards) { expect(card.tier).to.equal("Immortal"); }

      const etherealCards = await PuzzleCard.gift(100, "Ethereal", owner.address);
      for (let card of etherealCards) { expect(card.tier).to.equal("Ethereal"); }

      const virtualCards = await PuzzleCard.gift(100, "Virtual", owner.address);
      for (let card of virtualCards) { expect(card.tier).to.equal("Virtual"); }

      const celestialCards = await PuzzleCard.gift(100, "Celestial", owner.address);
      for (let card of celestialCards) { expect(card.tier).to.equal("Celestial"); }

      const godlyCards = await PuzzleCard.gift(100, "Godly", owner.address);
      for (let card of godlyCards) { expect(card.tier).to.equal("Godly"); }

      const masterCards = await PuzzleCard.gift(100, "Master", owner.address);
      for (let card of masterCards) { expect(card.tier).to.equal("Master"); }
    });
  });

  describe("type", () => {
    it(3)("picks according to the probability distribution", async () => {
      const cards = await PuzzleCard.gift(2000, "Mortal", owner.address);
      const frequencies = TestUtils.tallyFrequencies(cards.map(c => c.type));

      expect(frequencies["Player"]).to.be.within(0.27, 0.33);    // 30%
      expect(frequencies["Crab"]).to.be.within(0.07, 0.13);      // 10%
      expect(frequencies["Inactive"]).to.be.within(0.17, 0.23);  // 20%
      expect(frequencies["Active"]).to.be.within(0.07, 0.13);    // 10%
      expect(frequencies["Cloak"]).to.be.within(0.07, 0.13);     // 10%
      expect(frequencies["Telescope"]).to.be.within(0.07, 0.13); // 10%
      expect(frequencies["Helix"]).to.be.below(0.05);            // 2%
      expect(frequencies["Torch"]).to.be.below(0.05);            // 2%
      expect(frequencies["Beacon"]).to.be.below(0.05);           // 2%
      expect(frequencies["Map"]).to.be.below(0.03);              // 1%
      expect(frequencies["Teleport"]).to.be.below(0.03);         // 1%
      expect(frequencies["Glasses"]).to.be.below(0.03);          // 1%
      expect(frequencies["Eclipse"]).to.be.below(0.02);          // 0.4%
      expect(frequencies["Door"]).to.be.below(0.02);             // 0.6%
      expect(frequencies["Hidden"]).to.be.undefined;             // 0%
      expect(frequencies["Artwork"]).to.be.undefined;            // 0%
      expect(frequencies["Star"]).to.be.undefined;               // 0%
    });
  });

  describe("color1", () => {
    it(4)("picks according to the probability distribution for types with one or more colors", async () => {
      const cards = await PuzzleCard.gift(2000, "Mortal", owner.address);

      const uncoloredTypes = ["Player", "Crab", "Map", "Teleport", "Eclipse", "Door", "Hidden", "Artwork"];
      const coloredTypes = ["Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Glasses", "Star"];

      const uncoloredColors = cards.filter(c => uncoloredTypes.indexOf(c.type) !== -1).map(c => c.color1);
      const coloredColors = cards.filter(c => coloredTypes.indexOf(c.type) !== -1).map(c => c.color1);

      const uncoloredFrequencies = TestUtils.tallyFrequencies(uncoloredColors)
      const coloredFrequencies = TestUtils.tallyFrequencies(coloredColors)

      expect(uncoloredFrequencies["None"]).to.equal(1); // 100%

      expect(coloredFrequencies["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(coloredFrequencies["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(coloredFrequencies["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(coloredFrequencies["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(coloredFrequencies["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["None"]).to.be.undefined;            // 0%;
    });
  });

  describe("color2", () => {
    it(5)("picks according to the probability distribution for types with two colors", async () => {
      const cards = await PuzzleCard.gift(15000, "Mortal", owner.address);

      const uncoloredTypes = ["Player", "Crab", "Map", "Teleport", "Inactive", "Active", "Cloak", "Telescope", "Beacon", "Eclipse", "Door", "Hidden", "Artwork", "Star"];
      const coloredTypes = ["Helix", "Torch", "Glasses"];

      const uncoloredColors = cards.filter(c => uncoloredTypes.indexOf(c.type) !== -1).map(c => c.color2);
      const coloredColors = cards.filter(c => coloredTypes.indexOf(c.type) !== -1).map(c => c.color2);

      const uncoloredFrequencies = TestUtils.tallyFrequencies(uncoloredColors);
      const coloredFrequencies = TestUtils.tallyFrequencies(coloredColors);

      expect(uncoloredFrequencies["None"]).to.equal(1); // 100%

      expect(coloredFrequencies["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(coloredFrequencies["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(coloredFrequencies["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(coloredFrequencies["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(coloredFrequencies["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(coloredFrequencies["None"]).to.be.undefined;            // 0%;
    });
  });

  describe("variant", () => {
    it(6)("picks according to the probability distribution for types with variants", async () => {
      const cards = await PuzzleCard.gift(2500, "Mortal", owner.address);

      const nonVaryingTypes = ["Player", "Crab", "Cloak", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Hidden", "Artwork", "Star"];
      const varyingTypes = ["Inactive", "Active", "Telescope", "Door"];

      const nonVaryingVariants= cards.filter(c => nonVaryingTypes.indexOf(c.type) !== -1).map(c => c.variant);
      const varyingVariants = cards.filter(c => varyingTypes.indexOf(c.type) !== -1).map(c => c.variant);

      const nonVaryingFrequencies = TestUtils.tallyFrequencies(nonVaryingVariants);
      const varyingFrequencies = TestUtils.tallyFrequencies(varyingVariants);

      expect(nonVaryingFrequencies["None"]).to.equal(1); // 100%

      // active/inactive occur 30% of the time, doors occur 0.6% of the time
      expect(varyingFrequencies["Sun"]).to.be.within(0.46, 0.52);  // 49% = 50% * (30/30.6)
      expect(varyingFrequencies["Moon"]).to.be.within(0.48, 0.52); // 49% = 50% * (30/30.6)
      expect(varyingFrequencies["Open"]).to.be.below(0.01);       // 0.1% = 50% * (0.6/30.6)
      expect(varyingFrequencies["Closed"]).to.be.below(0.01);     // 0.1% = 50% * (0.6/30.6)
      expect(varyingFrequencies["None"]).to.be.undefined;
    });
  });

  describe("condition", () => {
    it(7)("picks according to the probability distribution", async () => {
      const cards = await PuzzleCard.gift(1000, "Mortal", owner.address);
      const frequencies = TestUtils.tallyFrequencies(cards.map(c => c.condition));

      expect(frequencies["Dire"]).to.be.undefined;                // 0%
      expect(frequencies["Poor"]).to.be.undefined;                // 0%
      expect(frequencies["Reasonable"]).to.be.undefined;          // 0%
      expect(frequencies["Excellent"]).to.be.within(0.47, 0.53);  // 50%
      expect(frequencies["Pristine"]).to.be.within(0.47, 0.53);   // 50%
    });
  });
});
