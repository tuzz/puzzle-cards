const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsAPromotedCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");

describe("TeleportToNextArea", () => {
  const playerCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Player", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const teleportCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Teleport", color1: "None", color2: "None", variant: "None", condition: "Excellent" };
  const mapCard = { series: "Teamwork", puzzle: "2", tier: "Mortal", type: "Map", color1: "None", color2: "None", variant: "None", condition: "Excellent" };

  itBehavesLikeAnAction("teleportToNextArea", [playerCard, teleportCard, mapCard], [["Player"], ["Teleport"], ["Map"]], "Immortal");
  itMintsAPromotedCard("teleportToNextArea", [playerCard, teleportCard, mapCard], true);
});
