const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("LookThroughGlasses", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Virtual", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const glassesCard = { series: "Teamwork", puzzle: "2", tier: "Virtual", type: "Glasses", color1: "Red", color2: "Green", variant: "None", condition: "Excellent", edition: "Standard" };
  const hiddenCard = { series: "Teamwork", puzzle: "2", tier: "Virtual", type: "Hidden", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], [["Player"], ["Glasses"], ["Hidden"]], "Virtual");
  itMintsATierStarterCard("lookThroughGlasses", [playerCard, glassesCard, hiddenCard], false);
});
