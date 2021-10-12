const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../contracts/PuzzleCard");

describe("JumpIntoEclipse", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const doorCard = new PuzzleCard({ ...baseCard, type: "Door", variant: "Closed" });
  const eclipseCard = new PuzzleCard({ ...baseCard, type: "Eclipse" });

  itBehavesLikeAnAction("jumpIntoEclipse", [playerCard, doorCard, eclipseCard], [["Player"], ["Door"], ["Eclipse"]], "Mortal");

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

    it("cannot be performed if the door has already been opened", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...doorCard, variant: "Open" }), owner.address);
      const card3 = await PuzzleCard.mintExact(eclipseCard, owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canJumpIntoEclipse([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the door has already been opened]", reasons);
    });

    it("mints a door card that has been opened", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(doorCard, owner.address);
      const card3 = await PuzzleCard.mintExact(eclipseCard, owner.address);

      const mintedCard = await PuzzleCard.jumpIntoEclipse([card1, card2, card3]);

      expect(mintedCard.type).to.equal("Door");
      expect(mintedCard.color1).to.equal("None");
      expect(mintedCard.color2).to.equal("None");
      expect(mintedCard.variant).to.equal("Open");
    });
  });
});
