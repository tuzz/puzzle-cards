const { expect } = require("chai");
const { expectRevert, constants } = require("@openzeppelin/test-helpers");
const { itBehavesLikeAnAction, itMintsATierStarterCard } = require("./SharedExamples");
const TestUtils = require("../test_utils/TestUtils");
const { baseCard } = TestUtils;
const PuzzleCard = require("../../contracts/PuzzleCard");

describe("TeleportToNextArea", () => {
  const playerCard = new PuzzleCard({ ...baseCard, type: "Player" });
  const teleportCard = new PuzzleCard({ ...baseCard, type: "Teleport" });
  const mapCard = new PuzzleCard({ ...baseCard, type: "Map" });

  itBehavesLikeAnAction("teleportToNextArea", [playerCard, teleportCard, mapCard], [["Player"], ["Teleport"], ["Map"]], "Immortal");
  itMintsATierStarterCard("teleportToNextArea", [playerCard, teleportCard, mapCard], true);
});
