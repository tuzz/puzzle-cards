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

  itBehavesLikeAnAction("discard2Pickup1", [playerCard, doorCard], [anyType, anyType], "Mortal");
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
  });
});
