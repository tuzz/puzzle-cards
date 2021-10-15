const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("GoThroughStarDoor", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const doorCard = new PuzzleCard({ ...baseCard, type: "Door", variant: "Open" });

  itBehavesLikeAnAction("goThroughStarDoor", [playerCard, doorCard], [["Player"], ["Door"]], "Immortal");
  itMintsATierStarterCard("goThroughStarDoor", [playerCard, doorCard], true);

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

    it("cannot be performed if the door hasn't been opened", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...doorCard, variant: "Closed" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canGoThroughStarDoor([card1, card2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the door hasn't been opened]", reasons);
    });
  });
});
