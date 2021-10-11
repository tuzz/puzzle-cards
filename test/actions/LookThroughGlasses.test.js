const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { baseCard } = TestUtils;

describe("LookThroughGlasses", () => {
  const playerCard = { ...baseCard, tier: "Virtual", type: "Player" };
  const glassesCard = { ...baseCard, tier: "Virtual", type: "Glasses", color1: "Red", color2: "Green" };
  const hiddenCard = { ...baseCard, tier: "Virtual", type: "Hidden" };

  itBehavesLikeAnAction("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], [["Player"], ["Glasses"], ["Hidden"]], "Virtual");
  itMintsATierStarterCard("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], false);
});
