const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./TestUtils");

describe("TestUtils", () => {
  let factory, contract, owner, user1;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    TestUtils.addHelpfulMethodsTo(contract);
  });

  it("adds a helper method to the contract that mints exact cards by attribute names", async () => {
    const attributeNames = { series: "Teamwork", puzzle: "2", tier: "Ethereal", type: "Active", color1: "Red", color2: "None", variant: "Sun", condition: "Excellent" }

    await contract.mintExactByNames(attributeNames, owner.address);
    const tokenID = 1;

    expect(await contract.seriesName(tokenID)).to.equal("Teamwork");
    expect(await contract.puzzleName(tokenID)).to.equal("2");
    expect(await contract.tierName(tokenID)).to.equal("Ethereal");
    expect(await contract.typeName(tokenID)).to.equal("Active");
    expect(await contract.color1Name(tokenID)).to.equal("Red");
    expect(await contract.color2Name(tokenID)).to.equal("None");
    expect(await contract.variantName(tokenID)).to.equal("Sun");
    expect(await contract.conditionName(tokenID)).to.equal("Excellent");
  });
});
