const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("ActivateSunOrMoon", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const cloakCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Cloak", color1: "Black", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const inactiveCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Inactive", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("activateSunOrMoon", [cloakCard, inactiveCard], [["Player", "Crab", "Cloak"], ["Inactive"]], "Mortal");

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
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...inactiveCard, color1: "Blue" }, owner.address));

      const [isAllowed, reasons] = await contract.canActivateSunOrMoon([tokenID1, tokenID2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the color of the cloak does not match]", reasons);
    });

    for (const tier of ["Ethereal", "Godly"]) {
      it(`cannot be performed if a non-cloak card is provided at ${tier} tier`, async () => {
        const tokenID1 = await tokenID(contract.mintExactByNames({ ...playerCard, tier }, owner.address));
        const tokenID2 = await tokenID(contract.mintExactByNames({ ...inactiveCard, tier }, owner.address));

        const [isAllowed, reasons] = await contract.canActivateSunOrMoon([tokenID1, tokenID2]);

        expect(isAllowed).to.equal(false);
        expect(reasons).to.deep.include("[only works with a cloak card at this tier]", reasons);
      });
    }

    it("sets the type of the minted card to Active", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(inactiveCard, owner.address));

      const mintedTokenID = await tokenID(contract.activateSunOrMoon([tokenID1, tokenID2]));

      expect(await contract.typeName(mintedTokenID)).to.equal("Active");
    });

    it("sets the color of the minted card to the same as the Inactive card", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(inactiveCard, owner.address));

      const mintedTokenID = await tokenID(contract.activateSunOrMoon([tokenID1, tokenID2]));

      expect(await contract.color1Name(mintedTokenID)).to.equal("Black");
      expect(await contract.color2Name(mintedTokenID)).to.equal("None");
    });

    it("sets the variant of the minted card to the same as the Inactive card", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(inactiveCard, owner.address));

      const mintedTokenID = await tokenID(contract.activateSunOrMoon([tokenID1, tokenID2]));

      expect(await contract.variantName(mintedTokenID)).to.equal("Sun");
    });
  });
});
