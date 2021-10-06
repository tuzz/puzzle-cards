const { expect } = require("chai");
const { it: _it } = require("mocha");
const { constants } = require("@openzeppelin/test-helpers");

const it = (n) => {
  if (typeof n !== "number") { throw new Error(`No test number for '${n}'`); }
  return TEST_TO_ISOLATE === n || TEST_TO_ISOLATE === -1 ? _it : _it.skip;
};

const TEST_TO_ISOLATE = -1;

describe("MintingRandomly", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  describe("series", () => {
    it(0)("picks randomly", async () => {
      await mintInBatches(1000);

      const seriesNames = await mapTokenIDs(1, 1000, contract.seriesName);
      const frequencies = tallyFrequencies(seriesNames);

      expect(frequencies["None"]).to.be.within(0.47, 0.53);     // 50%
      expect(frequencies["Teamwork"]).to.be.within(0.47, 0.53); // 50%
    });
  });

  describe("puzzle", () => {
    it(1)("picks randomly within the series", async () => {
      await mintInBatches(2500);

      const puzzleNames = await mapTokenIDsBySeries(1, 2500, contract.puzzleName);
      const frequencies = tallyFrequenciesInGroups(puzzleNames);

      expect(frequencies["None"]["Trial of Skill"]).to.be.within(0.47, 0.53); // 50%
      expect(frequencies["None"]["Trial of Reign"]).to.be.within(0.47, 0.53); // 50%

      expect(frequencies["Teamwork"]["1"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Teamwork"]["2"]).to.be.within(0.303, 0.366); // 33.3%
      expect(frequencies["Teamwork"]["3"]).to.be.within(0.303, 0.366); // 33.3%
    }).timeout(50000);
  });

  describe("tier", () => {
    it(2)("picks according to the probability distribution", async () => {
      await mintInBatches(1000);

      const tierNames = await mapTokenIDs(1, 1000, contract.tierName);
      const frequencies = tallyFrequencies(tierNames);

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
      await mintInBatches(1000);

      const typeNames = await mapTokenIDs(1, 1000, contract.typeName);
      const frequencies = tallyFrequencies(typeNames);

      expect(frequencies["Player"]).to.be.within(0.17, 0.23);    // 20%
      expect(frequencies["Crab"]).to.be.within(0.17, 0.23);      // 20%
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
      await mintInBatches(2000);

      const pairs = await mapTokenIDsByType(1, 2000, contract.color1Name);

      const uncolored = ["Player", "Crab", "Map", "Teleport", "Eclipse", "Door", "Hidden", "Artwork"];
      const colored = ["Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Glasses", "Star"];

      const colors1 = pairs.filter(([type, _]) => uncolored.indexOf(type) !== -1).map(([_, color]) => color);
      const colors2 = pairs.filter(([type, _]) => colored.indexOf(type) !== -1).map(([_, color]) => color);

      const frequencies1 = tallyFrequencies(colors1)
      const frequencies2 = tallyFrequencies(colors2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      expect(frequencies2["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["None"]).to.be.undefined;            // 0%;
    }).timeout(40000);
  });

  describe("color2", () => {
    it(5)("picks according to the probability distribution for types with two colors", async () => {
      await mintInBatches(15000);

      const pairs = await mapTokenIDsByType(1, 15000, contract.color2Name);

      const uncolored = ["Player", "Crab", "Map", "Teleport", "Inactive", "Active", "Cloak", "Telescope", "Beacon", "Eclipse", "Door", "Hidden", "Artwork", "Star"];
      const colored = ["Helix", "Torch", "Glasses"];

      const colors1 = pairs.filter(([k, _]) => uncolored.indexOf(k) !== -1).map(([_, v]) => v);
      const colors2 = pairs.filter(([k, _]) => colored.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = tallyFrequencies(colors1)
      const frequencies2 = tallyFrequencies(colors2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      expect(frequencies2["Red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["Green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["Yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["Pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["White"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["Black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["None"]).to.be.undefined;            // 0%;
    }).timeout(300000);
  });

  describe("variant", () => {
    it(6)("picks according to the probability distribution for types with variants", async () => {
      await mintInBatches(2500);

      const pairs = await mapTokenIDsByType(1, 2500, contract.variantName);

      const dontVary = ["Player", "Crab", "Cloak", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Hidden", "Artwork", "Star"];
      const vary = ["Inactive", "Active", "Telescope", "Door"];

      const variants1 = pairs.filter(([k, _]) => dontVary.indexOf(k) !== -1).map(([_, v]) => v);
      const variants2 = pairs.filter(([k, _]) => vary.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = tallyFrequencies(variants1)
      const frequencies2 = tallyFrequencies(variants2)

      expect(frequencies1["None"]).to.equal(1); // 100%

      // active/inactive occur 30% of the time, doors occur 0.6% of the time
      expect(frequencies2["Sun"]).to.be.within(0.46, 0.52);  // 49% = 50% * (30/30.6)
      expect(frequencies2["Moon"]).to.be.within(0.48, 0.52); // 49% = 50% * (30/30.6)
      expect(frequencies2["Open"]).to.be.below(0.01);       // 0.1% = 50% * (0.6/30.6)
      expect(frequencies2["Closed"]).to.be.below(0.01);     // 0.1% = 50% * (0.6/30.6)
      expect(frequencies2["None"]).to.be.undefined;

    }).timeout(50000);
  });

  describe("condition", () => {
    it(7)("picks according to the probability distribution", async () => {
      await mintInBatches(1000);

      const conditionNames = await mapTokenIDs(1, 1000, contract.conditionName);
      const frequencies = tallyFrequencies(conditionNames);

      expect(frequencies["Dire"]).to.be.undefined;                // 0%
      expect(frequencies["Poor"]).to.be.undefined;                // 0%
      expect(frequencies["Reasonable"]).to.be.undefined;          // 0%
      expect(frequencies["Excellent"]).to.be.within(0.17, 0.23);  // 20%
      expect(frequencies["Pristine"]).to.be.within(0.77, 0.83);   // 80%
    });
  });

  // utility functions

  const mintInBatches = (numberToMint) => {
    const promises = [];

    for (let i = 0; i < Math.floor(numberToMint / 100); i += 1) {
      promises.push(contract.gift(100, owner.address));
    }
    promises.push(contract.gift(numberToMint % 100, owner.address));

    return Promise.all(promises);
  };

  const mapTokenIDs = (from, to, fn) => {
    const promises = [];

    for (let tokenID = from; tokenID < to; tokenID += 1) {
      promises.push(fn(tokenID));
    }

    return Promise.all(promises);
  };

  const mapTokenIDsBySeries = (from, to, fn) => (
    mapTokenIDs(from, to, (id) => Promise.all([contract.seriesName(id), fn(id)]))
  );

  const mapTokenIDsByType = (from, to, fn) => (
    mapTokenIDs(from, to, (id) => Promise.all([contract.typeName(id), fn(id)]))
  );

  const tallyFrequencies = (array) => {
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

  const tallyFrequenciesInGroups = (pairs) => {
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
});
