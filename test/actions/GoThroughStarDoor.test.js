const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const tokenID = TestUtils.tokenID;

describe("GoThroughStarDoor", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const doorCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Open", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("goThroughStarDoor", [playerCard, doorCard], [["Player"], ["Door"]], "Immortal");
  itMintsATierStarterCard("goThroughStarDoor", [playerCard, doorCard], true);

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

    it("cannot be performed if the door hasn't been opened", async () => {
      const tokenID1 = await tokenID(contract.mintExactByNames(playerCard, owner.address));
      const tokenID2 = await tokenID(contract.mintExactByNames({ ...doorCard, variant: "Closed" }, owner.address));

      const [isAllowed, reasons] = await contract.canGoThroughStarDoor([tokenID1, tokenID2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the door hasn't been opened]", reasons);
    });
  });
});