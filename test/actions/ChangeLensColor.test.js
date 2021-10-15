const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { tokenID, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("ChangeLensColor", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const cloakCard = new PuzzleCard({ ...baseCard, type: "Cloak", color1: "Red" });
  const torchCard = new PuzzleCard({ ...baseCard, type: "Torch", color1: "Blue", color2: "Green" });
  const glassesCard = new PuzzleCard({ ...baseCard, type: "Glasses", color1: "Blue", color2: "Green" });
  const inactiveCard = new PuzzleCard({ ...baseCard, type: "Inactive", color1: "Red", variant: "Sun" });

  itBehavesLikeAnAction("changeLensColor", [cloakCard, torchCard, inactiveCard], [["Player", "Crab", "Cloak"], ["Torch", "Glasses"], ["Inactive"]], "Mortal");

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
      const card2 = await PuzzleCard.mintExact(torchCard, owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, color1: "Blue" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canChangeLensColor([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the color of the cloak doesn't match]", reasons);
    });

    for (const tier of ["Ethereal", "Godly"]) {
      it(`cannot be performed if a non-cloak card is provided at ${tier} tier`, async () => {
        const card1 = await PuzzleCard.mintExact(new PuzzleCard({ ...playerCard, tier }), owner.address);
        const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...torchCard, tier}), owner.address);
        const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, tier }), owner.address);

        const [isAllowed, reasons] = await PuzzleCard.canChangeLensColor([card1, card2, card3]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    }

    it("mints a torch card if a torch card was combined", async () => {
      await PuzzleCard.mintExact(cloakCard, owner.address);
      await PuzzleCard.mintExact(torchCard, owner.address);
      await PuzzleCard.mintExact(inactiveCard, owner.address);

      const mintedCard = await PuzzleCard.changeLensColor([cloakCard, torchCard, inactiveCard]);

      expect(mintedCard.type).to.equal("Torch");
      expect(mintedCard.variant).to.equal("None");
    });

    it("mints a glasses card if a glasses card was combined", async () => {
      await PuzzleCard.mintExact(cloakCard, owner.address);
      await PuzzleCard.mintExact(glassesCard, owner.address);
      await PuzzleCard.mintExact(inactiveCard, owner.address);

      const mintedCard = await PuzzleCard.changeLensColor([cloakCard, glassesCard, inactiveCard]);

      expect(mintedCard.type).to.equal("Glasses");
      expect(mintedCard.variant).to.equal("None");
    });

    it("only swaps the lens colors if the inactive color matches one of the lens colors", async () => {
      const card1 = await PuzzleCard.mintExact(cloakCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...torchCard, color1: "Red", color2: "Green" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, color1: "Red" }), owner.address);

      const mintedCard = await PuzzleCard.changeLensColor([card1, card2, card3]);

      expect(mintedCard.color1).to.equal("Green");
      expect(mintedCard.color2).to.equal("Red");
    });

    it("swaps the lens colors and sets a random lens to the inactive color if no color matches", async () => {
      const lensColors = [];

      for (let i = 0; i < 200; i += 1) {
        const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
        const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...torchCard, color1: "Red", color2: "Green" }), owner.address);
        const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...inactiveCard, color1: "Blue" }), owner.address);

        const mintedCard = await PuzzleCard.changeLensColor([card1, card2, card3]);

        lensColors.push([mintedCard.color1, mintedCard.color2]);
      }

      const frequencies = TestUtils.tallyFrequencies(lensColors);

      expect(frequencies[["Blue", "Red"]]).to.be.within(0.4, 0.6);   // 50%
      expect(frequencies[["Green", "Blue"]]).to.be.within(0.4, 0.6); // 50%
    });
  });
});
