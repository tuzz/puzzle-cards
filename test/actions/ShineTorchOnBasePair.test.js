const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("ShineTorchOnBasePair", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const torchCard = new PuzzleCard({ ...baseCard, type: "Torch", color1: "Red", color2: "Green" });
  const helixCard = new PuzzleCard({ ...baseCard, type: "Helix", color1: "Red", color2: "Green" });

  itBehavesLikeAnAction("shineTorchOnBasePair", [playerCard, torchCard, helixCard], [["Player"], ["Torch"], ["Helix"]], "Mortal");

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

    it("cannot be performed if the colors don't match", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...torchCard, color1: "Red", color2: "Green" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...helixCard, color1: "Red", color2: "Blue" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canShineTorchOnBasePair([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("cannot be performed if the colors are the wrong way round", async () => {
      const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
      const card2 = await PuzzleCard.mintExact(new PuzzleCard({ ...torchCard, color1: "Green", color2: "Red" }), owner.address);
      const card3 = await PuzzleCard.mintExact(new PuzzleCard({ ...helixCard, color1: "Red", color2: "Green" }), owner.address);

      const [isAllowed, reasons] = await PuzzleCard.canShineTorchOnBasePair([card1, card2, card3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("mints either a Map or Teleport card with equal probability", async () => {
      const typeNames = [];

      for (let i = 0; i < 100; i += 1) {
        const card1 = await PuzzleCard.mintExact(playerCard, owner.address);
        const card2 = await PuzzleCard.mintExact(torchCard, owner.address);
        const card3 = await PuzzleCard.mintExact(helixCard, owner.address);

        const mintedCard = (await PuzzleCard.shineTorchOnBasePair([card1, card2, card3]))[0];

        expect(["Map", "Teleport"]).to.include(mintedCard.type);
        expect(mintedCard.color1).to.equal("None");
        expect(mintedCard.color2).to.equal("None");
        expect(mintedCard.variant).to.equal("None");

        typeNames.push(mintedCard.type);
      }

      const typeFrequencies = TestUtils.tallyFrequencies(typeNames)

      expect(typeFrequencies["Map"]).to.be.within(0.4, 0.6);      // 50%
      expect(typeFrequencies["Teleport"]).to.be.within(0.4, 0.6); // 50%
    });
  });
});
