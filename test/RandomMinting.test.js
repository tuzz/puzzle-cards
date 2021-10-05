const { expect } = require("chai");
const { it: _it } = require("mocha");
const { constants } = require("@openzeppelin/test-helpers");

const it = (n) => {
  if (typeof n !== "number") { throw new Error(`No test number for '${n}'`); }
  return TEST_TO_ISOLATE === n || TEST_TO_ISOLATE === -1 ? _it : _it.skip;
};

const TEST_TO_ISOLATE = -1;

describe("RandomMinting", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  describe("tier", () => {
    it(0)("picks according to the probability distribution", async () => {
      await mintInBatches(1000);

      const tierNames = await mapTokenIDs(1, 1000, contract.tierName);
      const frequencies = tallyFrequencies(tierNames);

      expect(frequencies["mortal"]).to.be.within(0.87, 0.93);   // 90%
      expect(frequencies["immortal"]).to.be.within(0.07, 0.13); // 10%
      expect(frequencies["ethereal"]).to.be.undefined;          // 0%
      expect(frequencies["virtual"]).to.be.undefined;           // 0%
      expect(frequencies["celestial"]).to.be.undefined;         // 0%
      expect(frequencies["godly"]).to.be.undefined;             // 0%
      expect(frequencies["master"]).to.be.undefined;            // 0%
    });
  });

  describe("type", () => {
    it(1)("picks according to the probability distribution", async () => {
      await mintInBatches(1000);

      const typeNames = await mapTokenIDs(1, 1000, contract.typeName);
      const frequencies = tallyFrequencies(typeNames);

      expect(frequencies["player"]).to.be.within(0.17, 0.23);    // 20%
      expect(frequencies["crab"]).to.be.within(0.17, 0.23);      // 20%
      expect(frequencies["inactive"]).to.be.within(0.17, 0.23);  // 20%
      expect(frequencies["active"]).to.be.within(0.07, 0.13);    // 10%
      expect(frequencies["cloak"]).to.be.within(0.07, 0.13);     // 10%
      expect(frequencies["telescope"]).to.be.within(0.07, 0.13); // 10%
      expect(frequencies["helix"]).to.be.below(0.06);            // 3%
      expect(frequencies["torch"]).to.be.below(0.06);            // 3%
      expect(frequencies["beacon"]).to.be.below(0.06);           // 3%
      expect(frequencies["map"]).to.exist;                       // 0.33%
      expect(frequencies["teleport"]).to.exist;                  // 0.33%
      expect(frequencies["glasses"]).to.exist;                   // 0.33%
      expect(frequencies["hidden"]).to.be.undefined;             // 0%
      expect(frequencies["artwork"]).to.be.undefined;            // 0%
    });
  });

  describe("color1", () => {
    it(2)("picks according to the probability distribution for types with one or more colors", async () => {
      await mintInBatches(2000);

      const pairs = await mapTokenIDsByType(1, 2000, contract.color1Name);

      const uncolored = ["player", "crab", "map", "teleport", "hidden", "artwork"];
      const colored = ["inactive", "active", "cloak", "telescope", "helix", "torch", "beacon", "glasses"];

      const colors1 = pairs.filter(([type, _]) => uncolored.indexOf(type) !== -1).map(([_, color]) => color);
      const colors2 = pairs.filter(([type, _]) => colored.indexOf(type) !== -1).map(([_, color]) => color);

      const frequencies1 = tallyFrequencies(colors1)
      const frequencies2 = tallyFrequencies(colors2)

      expect(frequencies1["none"]).to.equal(1); // 100%

      expect(frequencies2["red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["white"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["none"]).to.be.undefined;            // 0%;
    }).timeout(40000);
  });

  describe("color2", () => {
    it(3)("picks according to the probability distribution for types with two colors", async () => {
      await mintInBatches(15000);

      const pairs = await mapTokenIDsByType(1, 15000, contract.color2Name);

      const uncolored = ["player", "crab", "map", "teleport", "inactive", "active", "cloak", "telescope", "beacon", "hidden", "artwork"];
      const colored = ["helix", "torch", "glasses"];

      const colors1 = pairs.filter(([k, _]) => uncolored.indexOf(k) !== -1).map(([_, v]) => v);
      const colors2 = pairs.filter(([k, _]) => colored.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = tallyFrequencies(colors1)
      const frequencies2 = tallyFrequencies(colors2)

      expect(frequencies1["none"]).to.equal(1); // 100%

      expect(frequencies2["red"]).to.be.within(0.11, 0.17);    // 14.3%
      expect(frequencies2["green"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["blue"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["yellow"]).to.be.within(0.11, 0.17); // 14.3%
      expect(frequencies2["pink"]).to.be.within(0.11, 0.17);   // 14.3%
      expect(frequencies2["white"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["black"]).to.be.within(0.11, 0.17);  // 14.3%
      expect(frequencies2["none"]).to.be.undefined;            // 0%;
    }).timeout(300000);
  });

  describe("variant", () => {
    it(4)("picks according to the probability distribution for types with variants", async () => {
      await mintInBatches(2500);

      const pairs = await mapTokenIDsByType(1, 2500, contract.variantName);

      const dontVary = ["player", "crab", "cloak", "helix", "torch", "beacon", "map", "teleport", "glasses", "hidden", "artwork"];
      const vary = ["inactive", "active", "telescope"];

      const variants1 = pairs.filter(([k, _]) => dontVary.indexOf(k) !== -1).map(([_, v]) => v);
      const variants2 = pairs.filter(([k, _]) => vary.indexOf(k) !== -1).map(([_, v]) => v);

      const frequencies1 = tallyFrequencies(variants1)
      const frequencies2 = tallyFrequencies(variants2)

      expect(frequencies1["none"]).to.equal(1); // 100%

      expect(frequencies2["sun"]).to.be.within(0.47, 0.53);  // 50%;
      expect(frequencies2["moon"]).to.be.within(0.47, 0.53); // 50%;
      expect(frequencies2["none"]).to.be.undefined;          // 0%;
    }).timeout(50000);
  });

  describe("condition", () => {
    it(5)("picks according to the probability distribution", async () => {
      await mintInBatches(1000);

      const conditionNames = await mapTokenIDs(1, 1000, contract.conditionName);
      const frequencies = tallyFrequencies(conditionNames);

      expect(frequencies["dire"]).to.be.undefined;                // 0%
      expect(frequencies["poor"]).to.be.undefined;                // 0%
      expect(frequencies["reasonable"]).to.be.undefined;          // 0%
      expect(frequencies["excellent"]).to.be.within(0.17, 0.23);  // 20%
      expect(frequencies["pristine"]).to.be.within(0.77, 0.83);   // 80%
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

  const tallyFrequenciesByType = (pairs) => {
    const arrays = {};
    const groups = {};

    for (const [type, value] of pairs) {
      arrays[type] = arrays[type] || [];
      arrays[type].push(value);
    };

    for (const [type, array] of Object.entries(arrays)) {
      groups[type] = tallyFrequencies(array);
    }

    return groups;
  };
});
