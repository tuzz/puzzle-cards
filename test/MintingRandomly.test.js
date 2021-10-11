const { expect } = require("chai");
const { it: _it } = require("mocha");
const { constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");

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
  });

  describe("series", () => {
    it(0)("picks randomly", async () => {
      const tokenIDs = await mintInBatches(1000);

      const seriesNames = await mapTokenIDs(tokenIDs, contract.seriesName);
      const frequencies = TestUtils.tallyFrequencies(seriesNames);

      expect(frequencies["Series 0"]).to.be.within(0.47, 0.53); // 50%
      expect(frequencies["Series 1"]).to.be.within(0.47, 0.53); // 50%
    });
  });

  describe("puzzle", () => {
    it(1)("picks randomly within the series", async () => {
      const tokenIDs = await mintInBatches(2500);

      const puzzleNames = await mapTokenIDsBySeries(tokenIDs, contract.puzzleName);
      const frequencies = TestUtils.tallyFrequenciesInGroups(puzzleNames);

      expect(frequencies["Series 0"]["Puzzle 0-0"]).to.be.within(0.47, 0.53); // 50%
      expect(frequencies["Series 0"]["Puzzle 0-1"]).to.be.within(0.47, 0.53); // 50%

      expect(frequencies["Series 1"]["Puzzle 1-0"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Series 1"]["Puzzle 1-1"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Series 1"]["Puzzle 1-2"]).to.be.within(0.303, 0.366); // 33.3%
    });
  });

  describe("tier", () => {
    it(2)("picks according to the probability distribution", async () => {
      const tokenIDs = await mintInBatches(1000);

      const tierNames = await mapTokenIDs(tokenIDs, contract.tierName);
      const frequencies = TestUtils.tallyFrequencies(tierNames);

      expect(frequencies["Mortal"]).to.be.within(0.87, 0.93);   // 90%
      expect(frequencies["Immortal"]).to.be.within(0.07, 0.13); // 10%
      expect(frequencies["Ethereal"]).to.be.undefined;          // 0%
      expect(frequencies["Virtual"]).to.be.undefined;           // 0%
      expect(frequencies["Celestial"]).to.be.undefined;         // 0%
      expect(frequencies["Godly"]).to.be.undefined;             // 0%
      expect(frequencies["Master"]).to.be.undefined;            // 0%
    });
  });

  describe("type", () => {
    it(3)("picks according to the probability distribution", async () => {
      const tokenIDs = await mintInBatches(1000);

      const typeNames = await mapTokenIDs(tokenIDs, contract.typeName);
      const frequencies = TestUtils.tallyFrequencies(typeNames);

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
      const tokenIDs = await mintInBatches(2000);

      const pairs = await mapTokenIDsByType(tokenIDs, contract.color1Name);

      const uncolored = ["Player", "Crab", "Map", "Teleport", "Eclipse", "Door", "Hidden", "Artwork"];
      const colored = ["Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Glasses", "Star"];

      const colors1 = pairs.filter(([type, _]) => uncolored.indexOf(type) !== -1).map(([_, color]) => color);
      const colors2 = pairs.filter(([type, _]) => colored.indexOf(type) !== -1).map(([_, color]) => color);

      const frequencies1 = TestUtils.tallyFrequencies(colors1)
      const frequencies2 = TestUtils.tallyFrequencies(colors2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      expect(frequencies2["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["None"]).to.be.undefined;            // 0%;
    });
  });

  describe("color2", () => {
    it(5)("picks according to the probability distribution for types with two colors", async () => {
      const tokenIDs = await mintInBatches(15000);

      const pairs = await mapTokenIDsByType(tokenIDs, contract.color2Name);

      const uncolored = ["Player", "Crab", "Map", "Teleport", "Inactive", "Active", "Cloak", "Telescope", "Beacon", "Eclipse", "Door", "Hidden", "Artwork", "Star"];
      const colored = ["Helix", "Torch", "Glasses"];

      const colors1 = pairs.filter(([k, _]) => uncolored.indexOf(k) !== -1).map(([_, v]) => v);
      const colors2 = pairs.filter(([k, _]) => colored.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = TestUtils.tallyFrequencies(colors1)
      const frequencies2 = TestUtils.tallyFrequencies(colors2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      expect(frequencies2["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["None"]).to.be.undefined;            // 0%;
    });
  });

  describe("variant", () => {
    it(6)("picks according to the probability distribution for types with variants", async () => {
      const tokenIDs = await mintInBatches(2500);

      const pairs = await mapTokenIDsByType(tokenIDs, contract.variantName);

      const dontVary = ["Player", "Crab", "Cloak", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Hidden", "Artwork", "Star"];
      const vary = ["Inactive", "Active", "Telescope", "Door"];

      const variants1 = pairs.filter(([k, _]) => dontVary.indexOf(k) !== -1).map(([_, v]) => v);
      const variants2 = pairs.filter(([k, _]) => vary.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = TestUtils.tallyFrequencies(variants1)
      const frequencies2 = TestUtils.tallyFrequencies(variants2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      // active/inactive occur 30% of the time, doors occur 0.6% of the time
      expect(frequencies2["Sun"]).to.be.within(0.46, 0.52);  // 49% = 50% * (30/30.6)
      expect(frequencies2["Moon"]).to.be.within(0.48, 0.52); // 49% = 50% * (30/30.6)
      expect(frequencies2["Open"]).to.be.below(0.01);       // 0.1% = 50% * (0.6/30.6)
      expect(frequencies2["Closed"]).to.be.below(0.01);     // 0.1% = 50% * (0.6/30.6)
      expect(frequencies2["None"]).to.be.undefined;

    });
  });

  describe("condition", () => {
    it(7)("picks according to the probability distribution", async () => {
      const tokenIDs = await mintInBatches(1000);

      const conditionNames = await mapTokenIDs(tokenIDs, contract.conditionName);
      const frequencies = TestUtils.tallyFrequencies(conditionNames);

      expect(frequencies["Dire"]).to.be.undefined;                // 0%
      expect(frequencies["Poor"]).to.be.undefined;                // 0%
      expect(frequencies["Reasonable"]).to.be.undefined;          // 0%
      expect(frequencies["Excellent"]).to.be.within(0.17, 0.23);  // 20%
      expect(frequencies["Pristine"]).to.be.within(0.77, 0.83);   // 80%
    });
  });

  // utility functions

  const mintInBatches = async (numberToMint) => {
    let tokenIDs = [];

    for (let i = 0; i < Math.floor(numberToMint / 100); i += 1) {
      const batch = await TestUtils.batchTokenIDs(contract.gift(100, owner.address));
      tokenIDs = tokenIDs.concat(batch);
    }

    const batch = await TestUtils.batchTokenIDs(contract.gift(numberToMint % 100, owner.address));
    tokenIDs = tokenIDs.concat(batch);

    return tokenIDs;
  };

  const mapTokenIDs = (tokenIDs, fn) => {
    const promises = [];

    for (const tokenID of tokenIDs) {
      promises.push(fn(tokenID));
    }

    return Promise.all(promises);
  };

  const mapTokenIDsBySeries = (tokenIDs, fn) => (
    mapTokenIDs(tokenIDs, (id) => Promise.all([contract.seriesName(id), fn(id)]))
  );

  const mapTokenIDsByType = (tokenIDs, fn) => (
    mapTokenIDs(tokenIDs, (id) => Promise.all([contract.typeName(id), fn(id)]))
  );
});
