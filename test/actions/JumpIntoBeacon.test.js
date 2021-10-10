const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("JumpIntoBeacon", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const torchCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Torch", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const glassesCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Glasses", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const beaconCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Beacon", color1: "Blue", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("jumpIntoBeacon", [playerCard, torchCard, beaconCard], [["Player"], ["Torch", "Glasses"], ["Beacon"]], "Mortal");

  describe("action specific behaviour", () => {
    let factory, contract, owner, user1;

    before(async () => {
      factory = await ethers.getContractFactory("TestUtils");
      [owner, user1] = await ethers.getSigners();
    });

    beforeEach(async () => {
      contract = await factory.deploy(constants.ZERO_ADDRESS);
      TestUtils.addHelpfulMethodsTo(contract);
    });

    it("mints a torch card matching the beacon color if a torch card was combined", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(torchCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(beaconCard, owner.address));

      const mintedTokenID = await tokenID(contract.jumpIntoBeacon([tokenID1, tokenID2, tokenID3]));

      const type = await contract.typeName(mintedTokenID);
      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Torch");
      expect(color1).to.equal("Blue");
      expect(color2).to.equal("Blue");
      expect(variant).to.equal("None");
    });

    it("mints a glasses card matching the beacon color if a glasses card was combined", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(glassesCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(beaconCard, owner.address));

      const mintedTokenID = await tokenID(contract.jumpIntoBeacon([tokenID1, tokenID2, tokenID3]));

      const type = await contract.typeName(mintedTokenID);
      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Glasses");
      expect(color1).to.equal("Blue");
      expect(color2).to.equal("Blue");
      expect(variant).to.equal("None");
    });
  });
});