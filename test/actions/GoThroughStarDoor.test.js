const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("GoThroughStarDoor", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const doorCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Door", color1: "None", color2: "None", variant: "Open", condition: "Excellent" };

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
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames({ ...doorCard, variant: "Closed" }, owner.address);

      const [isAllowed, reasons] = await contract.canGoThroughStarDoor([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasons).to.deep.include("[the door hasn't been opened]", reasons);
    });
  });
});
