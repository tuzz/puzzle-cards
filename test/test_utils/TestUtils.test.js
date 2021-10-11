const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const TestUtils = require("./TestUtils");
const { tokenID, baseCard } = TestUtils;

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
    const attributeNames = { ...baseCard, type: "Active", color1: "Red", variant: "Sun" };

    const tokenID1 = await tokenID(contract.mintExactByNames(attributeNames, owner.address));

    expect(await contract.seriesName(tokenID1)).to.equal("Series 1");
    expect(await contract.puzzleName(tokenID1)).to.equal("Puzzle 1-2");
    expect(await contract.tierName(tokenID1)).to.equal("Mortal");
    expect(await contract.typeName(tokenID1)).to.equal("Active");
    expect(await contract.color1Name(tokenID1)).to.equal("Red");
    expect(await contract.color2Name(tokenID1)).to.equal("None");
    expect(await contract.variantName(tokenID1)).to.equal("Sun");
    expect(await contract.conditionName(tokenID1)).to.equal("Excellent");
  });
});
