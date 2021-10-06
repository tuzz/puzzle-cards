const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./TestUtils");

describe("Actions", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    TestUtils.addHelpfulMethodsTo(contract);
  });

  const defaults = {
    series: "Teamwork",
    puzzle: "2",
    tier: "Ethereal",
    type: "Active",
    color1: "Blue",
    color2: "None",
    variant: "Moon",
    condition: "Poor",
  };

  it("has a test helper that mints exact cards by attribute names", async () => {
    await contract.mintExactByNames(defaults, owner.address);
    const tokenID = 1;

    expect(await contract.seriesName(tokenID)).to.equal("Teamwork");
    expect(await contract.puzzleName(tokenID)).to.equal("2");
    expect(await contract.tierName(tokenID)).to.equal("Ethereal");
    expect(await contract.typeName(tokenID)).to.equal("Active");
    expect(await contract.color1Name(tokenID)).to.equal("Blue");
    expect(await contract.color2Name(tokenID)).to.equal("None");
    expect(await contract.variantName(tokenID)).to.equal("Moon");
    expect(await contract.conditionName(tokenID)).to.equal("Poor");
  });

  describe("#canActivateSunOrMoon", () => {
    it("returns false if the wrong number of puzzle cards is provded", async () => {
      [isAllowed, reasonsForBeingUnable] = await contract.canActivateSunOrMoon([]);

      expect(isAllowed).to.equal(false);
      expect(reasonsForBeingUnable).to.deep.include("[action requires 2 puzzle cards]");
    });

    it("returns false if the user doesn't own all the puzzle cards", async () => {
      await contract.mintExactByNames(defaults, owner.address);
      await contract.mintExactByNames(defaults, user1.address);

      [isAllowed, reasonsForBeingUnable] = await contract.canActivateSunOrMoon([1, 2]);

      expect(isAllowed).to.equal(false);
      expect(reasonsForBeingUnable).to.deep.include("[user doesn't own all the puzzle cards]");
    });
  });
});
