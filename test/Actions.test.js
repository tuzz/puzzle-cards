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

  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const cloakCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Cloak", color1: "Black", color2: "None", variant: "None", condition: "Excellent" };
  const inactiveCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Inactive", color1: "Black", color2: "None", variant: "Sun", condition: "Excellent" };

  it("has a test helper that mints exact cards by attribute names", async () => {
    await contract.mintExactByNames(playerCard, owner.address);
    const tokenID = 1;

    expect(await contract.seriesName(tokenID)).to.equal("Teamwork");
    expect(await contract.puzzleName(tokenID)).to.equal("2");
    expect(await contract.tierName(tokenID)).to.equal("Mortal");
    expect(await contract.typeName(tokenID)).to.equal("Player");
    expect(await contract.color1Name(tokenID)).to.equal("None");
    expect(await contract.color2Name(tokenID)).to.equal("None");
    expect(await contract.variantName(tokenID)).to.equal("None");
    expect(await contract.conditionName(tokenID)).to.equal("Excellent");
  });

  it("randomly picks a new puzzle each time a card is minted", async () => {
    const puzzleNames = [];

    for (let tokenID = 1; tokenID <= 15; tokenID += 3) {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      await contract.activateSunOrMoon([tokenID, tokenID + 1]);
      puzzleNames.push(await contract.puzzleName(tokenID + 2));
    }

    expect(puzzleNames.length).to.be.above(1);
  });

  it("has a chance to degrade the condition of the minted card", async () => {
    const conditionNames = [];

    for (let tokenID = 1; tokenID <= 600; tokenID += 3) {
      await contract.mintExactByNames(playerCard, owner.address);
      await contract.mintExactByNames(inactiveCard, owner.address);

      await contract.activateSunOrMoon([tokenID, tokenID + 1]);
      conditionNames.push(await contract.conditionName(tokenID + 2));
    }

    const set = new Set(conditionNames);
    expect(set.size).to.equal(2);

    expect(set.has("Excellent")).to.equal(true);
    expect(set.has("Reasonable")).to.equal(true);

    const numExcellent = conditionNames.filter(s => s === "Excellent").length;
    const numReasonable = conditionNames.filter(s => s === "Reasonable").length;

    expect(numExcellent).to.be.above(numReasonable * 3);
  });

  it("doesn't degrade cards that are already the lowest condition", async () => {
    const conditionNames = new Set();

    for (let tokenID = 1; tokenID <= 60; tokenID += 3) {
      await contract.mintExactByNames({ ...playerCard, condition: "Dire" }, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, condition: "Dire" }, owner.address);

      await contract.activateSunOrMoon([tokenID, tokenID + 1]);
      conditionNames.add(await contract.conditionName(tokenID + 2));
    }

    expect(conditionNames.size).to.equal(1);
  });

  it("doesn't degrade cards at immortal tier", async () => {
    const conditionNames = new Set();

    for (let tokenID = 1; tokenID <= 60; tokenID += 3) {
      await contract.mintExactByNames({ ...playerCard, tier: "Immortal" }, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, tier: "Immortal" }, owner.address);

      await contract.activateSunOrMoon([tokenID, tokenID + 1]);
      conditionNames.add(await contract.conditionName(tokenID + 2));
    }

    expect(conditionNames.size).to.equal(1);
  });

  it("doesn't degrade cards at godly tier", async () => {
    const conditionNames = new Set();

    for (let tokenID = 1; tokenID <= 60; tokenID += 3) {
      await contract.mintExactByNames({ ...cloakCard, tier: "Godly" }, owner.address);
      await contract.mintExactByNames({ ...inactiveCard, tier: "Godly" }, owner.address);

      await contract.activateSunOrMoon([tokenID, tokenID + 1]);
      conditionNames.add(await contract.conditionName(tokenID + 2));
    }

    expect(conditionNames.size).to.equal(1);
  });
});
