const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { tokenID, baseCard } = TestUtils;

describe("ShineTorchOnBasePair", () => {
  const playerCard = { ...baseCard, type: "Player" };
  const torchCard = { ...baseCard, type: "Torch", color1: "Red", color2: "Green" };
  const helixCard = { ...baseCard, type: "Helix", color1: "Red", color2: "Green" };

  itBehavesLikeAnAction("shineTorchOnBasePair", [playerCard, torchCard, helixCard], [["Player"], ["Torch"], ["Helix"]], "Mortal");

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

    it("cannot be performed if the colors don't match", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...torchCard, color1: "Red", color2: "Green" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...helixCard, color1: "Red", color2: "Blue" }, owner.address));

      const [isAllowed, reasons] = await contract.canShineTorchOnBasePair([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("cannot be performed if the colors are the wrong way round", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...torchCard, color1: "Green", color2: "Red" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...helixCard, color1: "Red", color2: "Green" }, owner.address));

      const [isAllowed, reasons] = await contract.canShineTorchOnBasePair([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("mints either a Map or Teleport card with equal probability", async () => {
      const typeNames = [];

      for (let i = 0; i < 100; i += 1) {
        const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames(torchCard, owner.address));
        const tokenID3 = await tokenID(contract.mintExactByNames(helixCard, owner.address));

        const mintedTokenID = await tokenID(contract.shineTorchOnBasePair([tokenID1, tokenID2, tokenID3]));

        const type = await contract.typeName(mintedTokenID);
        const color1 = await contract.color1Name(mintedTokenID);
        const color2 = await contract.color2Name(mintedTokenID);
        const variant = await contract.variantName(mintedTokenID);

        expect(["Map", "Teleport"]).to.include(type);
        expect(color1).to.equal("None");
        expect(color2).to.equal("None");
        expect(variant).to.equal("None");

        typeNames.push(type);
      }

      const typeFrequencies = TestUtils.tallyFrequencies(typeNames)

      expect(typeFrequencies["Map"]).to.be.within(0.4, 0.6);      // 50%
      expect(typeFrequencies["Teleport"]).to.be.within(0.4, 0.6); // 50%
    });
  });
});
