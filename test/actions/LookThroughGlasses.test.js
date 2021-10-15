const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { baseCard } = TestUtils;
const PuzzleCard = require("../../public/PuzzleCard");

describe("LookThroughGlasses", () => {
  const playerCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Player" });
  const glassesCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Glasses", color1: "Red", color2: "Green" });
  const hiddenCard = new PuzzleCard({ ...baseCard, tier: "Virtual", type: "Hidden" });

  itBehavesLikeAnAction("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], [["Player"], ["Glasses"], ["Hidden"]], "Virtual");
  itMintsATierStarterCard("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], false);
});
