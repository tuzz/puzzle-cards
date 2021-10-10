const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./test_utils/TestUtils");

describe("Setters", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
  });

  describe("#setPriceToMint", () => {
    it("allows the contract owner to set the price of a puzzle card", async () => {
      await contract.setPriceToMint(50000000000000000n);

      const priceForOne = await contract.priceToMint(1);
      expect(priceForOne.toBigInt()).to.equal(50000000000000000n);
    });

    it("does not allow other users to set the price", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setPriceToMint(50000000000000000n));
    });
  });

  describe("#setBaseTokenURI", () => {
    it("allows the contract owner to set the URL of the off-chain API", async () => {
      await contract.setBaseTokenURI("https://foo.com/api/");

      const baseTokenURI = await contract.baseTokenURI();
      expect(baseTokenURI).to.equal("https://foo.com/api/");
    });

    it("does not allow other users to set the price", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setBaseTokenURI("https://foo.com/api"));
    });
  });

  describe("#setPuzzleNames", () => {
    it("allows the contract owner to update puzzle names, e.g. when new puzzles are added", async () => {
      const seriesNames = ["None", "Teamwork", "Mutual Exclusion"];
      const puzzleNames = ["Trial of Skill", "Trial of Reign", "1", "2", "3", "4", "1"];
      const numPuzzlesPerSeries = [2, 4, 1];
      const puzzleOffsetPerSeries = [0, 2, 6];

      await contract.setPuzzleNames(seriesNames, puzzleNames, numPuzzlesPerSeries, puzzleOffsetPerSeries);
      const tokenIDs = await TestUtils.batchTokenIDs(contract.gift(100, owner.address));

      const names = [];

      for (const tokenID of tokenIDs) {
        const seriesName = await contract.seriesName(tokenID);
        const puzzleName = await contract.puzzleName(tokenID);

        names.push([seriesName, puzzleName]);
      }

      expect(names).to.deep.include(["Teamwork", "4"]);
      expect(names).to.deep.include(["Mutual Exclusion", "1"]);
    });

    it("does not allow other users to update puzzle names", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setPuzzleNames([], [], [], []));
    });
  });

  describe("#setVariantNames", () => {
    it("allows the contract owner to update variant names, e.g. when new art is added", async () => {
      const variantNames = ["None", "Sun", "Moon", "Open", "Closed", "Player Facing Forwards", "Player Facing Right"];
      const numVariantsPerType   = [2, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];
      const variantOffsetPerType = [5, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];
                              //    ^
                              // the number of variants and the offset for the player type changed from 0

      await contract.setVariantNames(variantNames, numVariantsPerType, variantOffsetPerType);

      let tokenIDs = [];

      for (let i = 0; i < 5; i += 1) {
        const batch = await TestUtils.batchTokenIDs(contract.gift(100, owner.address));
        tokenIDs = tokenIDs.concat(batch);
      }

      const names = [];

      for (const tokenID of tokenIDs) {
        const typeName = await contract.typeName(tokenID);
        const variantName = await contract.variantName(tokenID);

        names.push([typeName, variantName]);
      }

      expect(names).to.deep.include(["Player", "Player Facing Forwards"]);
      expect(names).to.deep.include(["Player", "Player Facing Right"]);
    });

    it("does not allow other users to update variant names", async () => {
      const contractAsUser1 = contract.connect(user1);
      await expectRevert.unspecified(contractAsUser1.setVariantNames([], [], []));
    });
  });
});
