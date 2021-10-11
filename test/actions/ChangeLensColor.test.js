const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { tokenID, baseCard } = TestUtils;

describe("ChangeLensColor", () => {
  const playerCard = { ...baseCard, type: "Player" };
  const cloakCard = { ...baseCard, type: "Cloak", color1: "Red" };
  const torchCard = { ...baseCard, type: "Torch", color1: "Blue", color2: "Green" };
  const glassesCard = { ...baseCard, type: "Glasses", color1: "Blue", color2: "Green" };
  const inactiveCard = { ...baseCard, type: "Inactive", color1: "Red", variant: "Sun" };

  itBehavesLikeAnAction("changeLensColor", [cloakCard, torchCard, inactiveCard], [["Player", "Crab", "Cloak"], ["Torch", "Glasses"], ["Inactive"]], "Mortal");

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

    it("cannot be performed if the cloak's color does not match that of the sun or moon", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames({ ...cloakCard, color1: "Red" }, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(torchCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...inactiveCard, color1: "Blue" }, owner.address));

      const [isAllowed, reasons] = await contract.canChangeLensColor([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the color of the cloak does not match]", reasons);
    });

    for (const tier of ["Ethereal", "Godly"]) {
      it(`cannot be performed if a non-cloak card is provided at ${tier} tier`, async () => {
        const tokenID1 = await tokenID(contract.mintExactByNames({ ...playerCard, tier }, owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames({ ...torchCard, tier}, owner.address));
        const tokenID3 = await tokenID(contract.mintExactByNames({ ...inactiveCard, tier }, owner.address));

        const [isAllowed, reasons] = await contract.canChangeLensColor([tokenID1, tokenID2, tokenID3]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    }

    it("mints a torch card if a torch card was combined", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(cloakCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(torchCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(inactiveCard, owner.address));

      const mintedTokenID = await tokenID(contract.changeLensColor([tokenID1, tokenID2, tokenID3]));

      const type = await contract.typeName(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Torch");
      expect(variant).to.equal("None");
    });

    it("mints a glasses card if a glasses card was combined", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(cloakCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(glassesCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(inactiveCard, owner.address));

      const mintedTokenID = await tokenID(contract.changeLensColor([tokenID1, tokenID2, tokenID3]));

      const type = await contract.typeName(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Glasses");
      expect(variant).to.equal("None");
    });

    it("only swaps the lens colors if the inactive color matches one of the lens colors", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(cloakCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...torchCard, color1: "Red", color2: "Green" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames({ ...inactiveCard, color1: "Red" }, owner.address));

      const mintedTokenID = await tokenID(contract.changeLensColor([tokenID1, tokenID2, tokenID3]));

      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);

      expect(color1).to.equal("Green");
      expect(color2).to.equal("Red");
    });

    it("swaps the lens colors and sets a random lens to the inactive color if no color matches", async () => {
      const lensColors = [];

      for (let i = 0; i < 200; i += 1) {
        const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames({ ...torchCard, color1: "Red", color2: "Green" }, owner.address));
        const tokenID3 = await tokenID(contract.mintExactByNames({ ...inactiveCard, color1: "Blue" }, owner.address));

        const mintedTokenID = await tokenID(contract.changeLensColor([tokenID1, tokenID2, tokenID3]));

        const color1 = await contract.color1Name(mintedTokenID);
        const color2 = await contract.color2Name(mintedTokenID);

        lensColors.push([color1, color2]);
      }

      const frequencies = TestUtils.tallyFrequencies(lensColors);

      expect(frequencies[["Blue", "Red"]]).to.be.within(0.4, 0.6);   // 50%
      expect(frequencies[["Green", "Blue"]]).to.be.within(0.4, 0.6); // 50%
    });
  });
});
