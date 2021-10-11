const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { baseCard } = TestUtils;

describe("TeleportToNextArea", () => {
  const playerCard = { ...baseCard, type: "Player" };
  const teleportCard = { ...baseCard, type: "Teleport" };
  const mapCard = { ...baseCard, type: "Map" };

  itBehavesLikeAnAction("teleportToNextArea", [playerCard, teleportCard, mapCard], [["Player"], ["Teleport"], ["Map"]], "Immortal");
  itMintsATierStarterCard("teleportToNextArea", [playerCard, teleportCard, mapCard], true);
});
