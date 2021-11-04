const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("Discard2Pickup1", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const doorCard = new PuzzleCard({ ...baseCard, type: "Door", variant: "Open" });

  const anyType = PuzzleCard.TYPE_NAMES;

  itBehavesLikeAnAction("discard2Pickup1", [playerCard, doorCard], [anyType, anyType], "Mortal", { skipAllDegradeTests: true });
  itMintsATierStarterCard("discard2Pickup1", [playerCard, doorCard], false);

  describe("action specific behaviour", () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      PuzzleCard.setContract(contract);
    });

    it("can be performed if two copies of the same card are used", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);
      await PuzzleCard.mintExact(playerCard, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canDiscard2Pickup1([playerCard, playerCard]);

      expect(isAllowed).to.equal(true);
    });

    it("cannot be performed if the same card is used twice (double spent)", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canDiscard2Pickup1([playerCard, playerCard]);

      expect(isAllowed).to.equal(false);
    });

    it("has a 50/50 chance to mint the new card at Pristine/Excellent condition", async () => {
      const conditions = [];

      for (let i = 0; i < 1000; i += 1) {
        const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
        const card2 = await PuzzleCard.mintExact(doorCard, owner.address);

        const mintedCard = await PuzzleCard.discard2Pickup1([card1, card2]);

        conditions.push(mintedCard.condition);
      }

      const frequencies = TestUtils.tallyFrequencies(conditions);

      expect(frequencies["Dire"]).to.be.undefined;                // 0%
      expect(frequencies["Poor"]).to.be.undefined;                // 0%
      expect(frequencies["Reasonable"]).to.be.undefined;          // 0%
      expect(frequencies["Excellent"]).to.be.within(0.47, 0.53);  // 50%
      expect(frequencies["Pristine"]).to.be.within(0.47, 0.53);   // 50%
    });
  });
});
