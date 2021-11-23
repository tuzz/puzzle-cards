const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { tokenID, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("ActivateSunOrMoon", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player", variant: "Dive" });
  const cloakCard = new PuzzleCard({ ...baseCard, type: "Cloak", color1: "Black" });
  const inactiveCard = new PuzzleCard({ ...baseCard, type: "Inactive", color1: "Black", variant: "Sun" });

  itBehavesLikeAnAction("activateSunOrMoon", [cloakCard, inactiveCard], [["Player", "Crab", "Cloak"], ["Inactive"]], "Mortal");

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

    it("cannot be performed if the cloak's color does not match that of the sun or moon", async () => {
      const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...cloakCard, color1: "Red" }), owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, color1: "Blue" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canActivateSunOrMoon([card1, card2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the color of the cloak doesn't match]", reasons);
    });

    for (const tier of ["Ethereal", "Godly"]) {
      it(`cannot be performed if a non-cloak card is provided at ${tier} tier`, async () => {
        const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...playerCard, tier }), owner.address);
        const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, tier }), owner.address);

        const [isAllowed, reasons] = await PuzzleCard.canActivateSunOrMoon([card1, card2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    }

    it("mints an Active card that matches the color and variant of the Inactive card", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);
      await PuzzleCard.mintExact(inactiveCard, owner.address);

      const mintedCard = (await PuzzleCard.activateSunOrMoon([playerCard, inactiveCard]))[0];

      expect(mintedCard.type).to.equal("Active");
      expect(mintedCard.color1).to.equal("Black");
      expect(mintedCard.color2).to.equal("None");
      expect(mintedCard.variant).to.equal("Sun");
    });
  });
});
