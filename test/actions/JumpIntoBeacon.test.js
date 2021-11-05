const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { card, baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("JumpIntoBeacon", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const torchCard = new PuzzleCard({ ...baseCard, type: "Torch", color1: "Red", color2: "Green" });
  const glassesCard = new PuzzleCard({ ...baseCard, type: "Glasses", color1: "Red", color2: "Green" });
  const beaconCard = new PuzzleCard({ ...baseCard, type: "Beacon", color1: "Blue" });

  itBehavesLikeAnAction("jumpIntoBeacon", [playerCard, torchCard, beaconCard], [["Player"], ["Torch", "Glasses"], ["Beacon"]], "Mortal");

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

    it("mints a torch card matching the beacon color if a torch card was combined", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);
      await PuzzleCard.mintExact(torchCard, owner.address);
      await PuzzleCard.mintExact(beaconCard, owner.address);

      const mintedCard = (await PuzzleCard.jumpIntoBeacon([playerCard, torchCard, beaconCard]))[0];

      expect(mintedCard.type).to.equal("Torch");
      expect(mintedCard.color1).to.equal("Blue");
      expect(mintedCard.color2).to.equal("Blue");
      expect(mintedCard.variant).to.equal("None");
    });

    it("mints a glasses card matching the beacon color if a glasses card was combined", async () => {
      await PuzzleCard.mintExact(playerCard, owner.address);
      await PuzzleCard.mintExact(glassesCard, owner.address);
      await PuzzleCard.mintExact(beaconCard, owner.address);

      const mintedCard = (await PuzzleCard.jumpIntoBeacon([playerCard, glassesCard, beaconCard]))[0];

      expect(mintedCard.type).to.equal("Glasses");
      expect(mintedCard.color1).to.equal("Blue");
      expect(mintedCard.color2).to.equal("Blue");
      expect(mintedCard.variant).to.equal("None");
    });
  });
});
