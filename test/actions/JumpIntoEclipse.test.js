const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("JumpIntoEclipse", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const doorCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Closed", condition: "Excellent", edition: "Standard" };
  const eclipseCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Eclipse", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("jumpIntoEclipse", [playerCard, doorCard, eclipseCard], [["Player"], ["Door"], ["Eclipse"]], "Mortal");

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

    it("cannot be performed if the door has already been opened", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...doorCard, variant: "Open" }, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(eclipseCard, owner.address));

      const [isAllowed, reasons] = await contract.canJumpIntoEclipse([tokenID1, tokenID2, tokenID3]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the door has already been opened]", reasons);
    });

    it("mints a door card that has been opened", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames(doorCard, owner.address));
      const tokenID3 = await tokenID(contract.mintExactByNames(eclipseCard, owner.address));

      const mintedTokenID = await tokenID(contract.jumpIntoEclipse([tokenID1, tokenID2, tokenID3]));

      const type = await contract.typeName(mintedTokenID);
      const color1 = await contract.color1Name(mintedTokenID);
      const color2 = await contract.color2Name(mintedTokenID);
      const variant = await contract.variantName(mintedTokenID);

      expect(type).to.equal("Door");
      expect(color1).to.equal("None");
      expect(color2).to.equal("None");
      expect(variant).to.equal("Open");
    });
  });
});
