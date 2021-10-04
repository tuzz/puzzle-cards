const { expect } = require("chai");
const { constants } = require("@openzeppelin/test-helpers");

describe("RandomMinting", function () {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("PuzzleCard");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  it("has a 10% chance to mint an immortal tier card", async () => {
    await mintInBatches(1000);

    const tierNames = await mapTokenIDs(1, 1000, contract.tierName);
    const frequencies = tallyFrequencies(tierNames);

    expect(frequencies["mortal"]).to.be.within(0.88, 0.92); // 90%
    expect(frequencies["immortal"]).to.be.within(0.08, 0.12); // 10%
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
});
