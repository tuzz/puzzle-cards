const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("ShineTorchOnBasePair", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const torchCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Torch", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const helixCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Helix", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };

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
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...torchCard, color1: "Red", color2: "Green" }, owner.address);
      await contract.mintExactByNames({ ...helixCard, color1: "Red", color2: "Blue" }, owner.address);

      const [isAllowed, reasons] = await contract.canShineTorchOnBasePair([1, 2, 3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("cannot be performed if the colors are the wrong way round", async () => {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...torchCard, color1: "Green", color2: "Red" }, owner.address);
      await contract.mintExactByNames({ ...helixCard, color1: "Red", color2: "Green" }, owner.address);

      const [isAllowed, reasons] = await contract.canShineTorchOnBasePair([1, 2, 3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the torch colors don't match the base pair]", reasons);
    });

    it("mints either a Map or Teleport card with equal probability", async () => {
      const typeNames = [];

      for (let i = 0; i < 100; i += 1) {
        await contract.mintExactByNames(playerCard, owner.address);
        await contract.mintExactByNames(torchCard, owner.address);
        await contract.mintExactByNames(helixCard, owner.address);

        const batchOffset = i * 4;
        const batchTokenIDs = [1, 2, 3].map(t => t + batchOffset);

        await contract.shineTorchOnBasePair(batchTokenIDs);
        const mintedTokenID = batchOffset + 4;

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
