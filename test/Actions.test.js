const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./TestUtils");

describe("Actions", () => {
  let factory, contract, owner;

  before(async () => {
    factory = await ethers.getContractFactory("TestUtils");
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await factory.deploy(constants.ZERO_ADDRESS);
    TestUtils.addHelpfulMethodsTo(contract);
  });

  it("has a test helper that mints exact cards by attribute names", async () => {
    await contract.mintExactByNames({ series: "Teamwork", puzzle: "2", tier: "Ethereal", type: "Active", color1: "Blue", color2: "None", variant: "Moon", condition: "Poor" });
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
});
