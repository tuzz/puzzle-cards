const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("TeleportToNextArea", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const teleportCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Teleport", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };
  const mapCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Map", color1: "None", color2: "None", variant: "None", condition: "Excellent", edition: "Standard" };

  itBehavesLikeAnAction("teleportToNextArea", [playerCard, teleportCard, mapCard], [["Player"], ["Teleport"], ["Map"]], "Immortal");
  itMintsATierStarterCard("teleportToNextArea", [playerCard, teleportCard, mapCard], true);
});
