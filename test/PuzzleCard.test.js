const { expect } = require("chai");
const PuzzleCard = require("../contracts/PuzzleCard");

describe("PuzzleCard", () => {
  it("can get the contract struct's index values for each field", () => {
    const puzzleCard = new PuzzleCard({
      series: "Series 1",
      puzzle: "Puzzle 1-2",
      tier: "Celestial",
      type: "Active",
      color1: "Red",
      color2: "None",
      variant: "Moon",
      condition: "Excellent",
      edition: "Standard",
    });

    expect(puzzleCard.seriesIndex()).to.equal(1);
    expect(puzzleCard.puzzleIndex()).to.equal(4);
    expect(puzzleCard.relativePuzzleIndex()).to.equal(2);
    expect(puzzleCard.tierIndex()).to.equal(4);
    expect(puzzleCard.typeIndex()).to.equal(3);
    expect(puzzleCard.color1Index()).to.equal(6);
    expect(puzzleCard.color2Index()).to.equal(0);
    expect(puzzleCard.variantIndex()).to.equal(2);
    expect(puzzleCard.relativeVariantIndex()).to.equal(1);
    expect(puzzleCard.conditionIndex()).to.equal(3);
    expect(puzzleCard.editionIndex()).to.equal(0);
  });

  it("can get the tokenID for a puzzle card", () => {
    const puzzleCard = new PuzzleCard({
      series: "Series 1",
      puzzle: "Puzzle 1-2",
      tier: "Celestial",
      type: "Active",
      color1: "Red",
      color2: "None",
      variant: "Moon",
      condition: "Excellent",
      edition: "Standard",
    });

    expect(puzzleCard.tokenID()).to.equal(18591988485997003520n);
  });

  it("can build a puzzle card from a tokenID", () => {
    const puzzleCard = PuzzleCard.fromTokenID(18591988485997003520n);

    expect(puzzleCard.series).to.equal("Series 1");
    expect(puzzleCard.puzzle).to.equal("Puzzle 1-2");
    expect(puzzleCard.tier).to.equal("Celestial");
    expect(puzzleCard.type).to.equal("Active");
    expect(puzzleCard.color1).to.equal("Red");
    expect(puzzleCard.color2).to.equal("None");
    expect(puzzleCard.variant).to.equal("Moon");
    expect(puzzleCard.condition).to.equal("Excellent");
    expect(puzzleCard.edition).to.equal("Standard");
  });
});
