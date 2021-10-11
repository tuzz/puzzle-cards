// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC1155Tradable.sol";
import "./mixins/Conversion.sol";
//import "hardhat/console.sol";

contract PuzzleCard is ERC1155Tradable {
    using Conversion for uint256;
    using Conversion for Instance;

    struct Instance {
        uint8 series;
        uint8 puzzle;
        uint8 tier;
        uint8 type_;
        uint8 color1;
        uint8 color2;
        uint8 variant;
        uint8 condition;
        uint8 edition;
    }

    mapping(uint256 => uint256) public limitedEditions;
    mapping(uint256 => bool) public masterCopiesClaimed;

    string[] public seriesNames = ["Series 0", "Series 1"];
    string[] public puzzleNames = ["Puzzle 0-0", "Puzzle 0-1", "Puzzle 1-0", "Puzzle 1-1", "Puzzle 1-2"];
    string[] public tierNames = ["Mortal", "Immortal", "Ethereal", "Virtual", "Celestial", "Godly", "Master"];
    string[] public typeNames = ["Player", "Crab", "Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Star", "Artwork"];
    string[] public colorNames = ["None", "Yellow", "Black", "Green", "White", "Blue", "Red", "Pink"];
    string[] public variantNames = ["None", "Sun", "Moon", "Open", "Closed", "Art 0", "Art 1"];
    string[] public conditionNames = ["Dire", "Poor", "Reasonable", "Excellent", "Pristine"];
    string[] public editionNames = ["Standard", "Signed", "Limited", "Master Copy"];
    string[] public actionNames = ["activateSunOrMoon", "changeLensColor", "discard2Pickup1", "goThroughStarDoor", "jumpIntoBeacon", "jumpIntoEclipse", "lookThroughGlasses", "lookThroughTelescope", "puzzleMastery1", "puzzleMastery2", "shineTorchOnBasePair", "teleportToNextArea"];

    uint8[] public numPuzzlesPerSeries = [2, 3];
    uint16[] public puzzleOffsetPerSeries = [0, 2];
    uint8[] public numColorSlotsPerType = [0, 0, 1, 1, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 1, 0];
    uint8[] public numVariantsPerType = [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
    uint16[] public variantOffsetPerType = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];
    uint16[] public cardSlotPerType = [0, 0, 2, 2, 0, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2];

    uint256[] public tierProbabilities = [90, 10];
    uint256[] public conditionProbabilities = [80, 20];

    uint256[] public standardTypeProbabilities = [300, 100, 200, 100, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] public virtualTypeProbabilities = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
    uint256[] public masterTypeProbabilities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

    uint256 public currentPriceToMint;
    uint256 public randomCallCount = 0;

    constructor(address proxyAddress) ERC1155Tradable("PuzzleCard", "WSUN", proxyAddress) {
        setPriceToMint(uint256(0.1 * 0.7883 * 1000000000000000000)); // $0.10 in Polygon Wei.
        setMetadataURI("https://worship-the-sun-puzzle-cards.github.io/api/{id}.json");
    }

    // getters

    function seriesName(uint256 tokenID) public view returns (string memory) { return seriesNames[tokenID.card().series]; }
    function puzzleName(uint256 tokenID) public view returns (string memory) { return puzzleNames[puzzleOffsetPerSeries[tokenID.card().series] + tokenID.card().puzzle]; }
    function tierName(uint256 tokenID) public view returns (string memory) { return tierNames[tokenID.card().tier]; }
    function typeName(uint256 tokenID) public view returns (string memory) { return typeNames[tokenID.card().type_]; }
    function color1Name(uint256 tokenID) public view returns (string memory) { return colorNames[tokenID.card().color1]; }
    function color2Name(uint256 tokenID) public view returns (string memory) { return colorNames[tokenID.card().color2]; }
    function variantName(uint256 tokenID) public view returns (string memory) { return variantNames[variantOffsetPerType[tokenID.card().type_] + tokenID.card().variant]; }
    function conditionName(uint256 tokenID) public view returns (string memory) { return conditionNames[tokenID.card().condition]; }
    function editionName(uint256 tokenID) public view returns (string memory) { return editionNames[tokenID.card().edition]; }

    function puzzleForIndex(uint16 puzzleIndex) public view returns (uint8, uint8) { return _puzzleForIndex(puzzleIndex); }
    function numLimitedEditions(uint8 series, uint8 puzzle) public view returns (uint256) { return limitedEditions[editionsKey(series, puzzle)]; }
    function numLimitedEditionsForAllPuzzles() public view returns (uint256[] memory) { return _numLimitedEditionsForAllPuzzles(); }
    function masterCopyClaimed(uint8 series, uint8 puzzle) public view returns (bool) { return masterCopiesClaimed[editionsKey(series, puzzle)]; }
    function masterCopyClaimedForAllPuzzles() public view returns (bool[] memory) { return _masterCopyClaimedForAllPuzzles(); }

    function priceToMint(uint256 numberOfCards) public view returns (uint256) { return currentPriceToMint * numberOfCards; }

    function actionsThatCanBeTaken(uint256[] memory tokenIDs) public view returns (string[] memory) {
        string[] memory names = new string[](actionNames.length);

        (bool a0,)  = canActivateSunOrMoon(tokenIDs);    if (a0)  { names[0]  = actionNames[0]; }
        (bool a1,)  = canChangeLensColor(tokenIDs);      if (a1)  { names[1]  = actionNames[1]; }
        (bool a2,)  = canDiscard2Pickup1(tokenIDs);      if (a2)  { names[2]  = actionNames[2]; }
        (bool a3,)  = canGoThroughStarDoor(tokenIDs);    if (a3)  { names[3]  = actionNames[3]; }
        (bool a4,)  = canJumpIntoBeacon(tokenIDs);       if (a4)  { names[4]  = actionNames[4]; }
        (bool a5,)  = canJumpIntoEclipse(tokenIDs);      if (a5)  { names[5]  = actionNames[5]; }
        (bool a6,)  = canLookThroughGlasses(tokenIDs);   if (a6)  { names[6]  = actionNames[6]; }
        (bool a7,)  = canLookThroughTelescope(tokenIDs); if (a7)  { names[7]  = actionNames[7]; }
        (bool a8,)  = canPuzzleMastery1(tokenIDs);       if (a8)  { names[8]  = actionNames[8]; }
        (bool a9,)  = canPuzzleMastery2(tokenIDs);       if (a9)  { names[9]  = actionNames[9]; }
        (bool a10,) = canShineTorchOnBasePair(tokenIDs); if (a10) { names[10] = actionNames[10]; }
        (bool a11,) = canTeleportToNextArea(tokenIDs);   if (a11) { names[11] = actionNames[11]; }

        return names;
    }

    // setters

    function setPriceToMint(uint256 newPrice) public onlyOwner { currentPriceToMint = newPrice; }
    function setMetadataURI(string memory newURI) public onlyOwner { _setURI(newURI); }

    // Be very careful not to invalidate existing cards when calling these methods.
    // The arrays must be append only and not reorder or remove puzzles.
    function setPuzzleNames(string[] memory seriesNames_, string[] memory puzzleNames_, uint8[] memory numPuzzlesPerSeries_, uint16[] memory puzzleOffsetPerSeries_) public onlyOwner {
        seriesNames = seriesNames_;
        puzzleNames = puzzleNames_;
        numPuzzlesPerSeries = numPuzzlesPerSeries_;
        puzzleOffsetPerSeries = puzzleOffsetPerSeries_;
    }

    function setVariantNames(string[] memory variantNames_, uint8[] memory numVariantsPerType_, uint16[] memory variantOffsetPerType_) public onlyOwner {
        variantNames = variantNames_;
        numVariantsPerType = numVariantsPerType_;
        variantOffsetPerType = variantOffsetPerType_;
    }

    // minting

    function mint(uint256 numberToMint, address to) public payable {
        uint256 price = priceToMint(numberToMint);

        require(msg.value >= price, "[insufficient payment provided]");
        require(numberToMint >= 1, "[unable to mint 0 cards]");
        require(numberToMint <= 100, "[unable to mint more than 100 cards in a single call]");

        payable(owner()).transfer(price);

        uint256[] memory tokenIDs = new uint256[](numberToMint);

        for (uint8 i = 0; i < numberToMint; i += 1) {
            tokenIDs[i] = starterCard().tokenID();
        }

        mintOneOfEach(tokenIDs, to);
    }

    function gift(uint256 numberToGift, address to) public onlyOwner {
        uint256[] memory tokenIDs = new uint256[](numberToGift);

        for (uint8 i = 0; i < numberToGift; i += 1) {
            tokenIDs[i] = starterCard().tokenID();
        }

        mintOneOfEach(tokenIDs, to);
    }

    function starterCard() private returns (Instance memory) {
        uint8 tier = pickRandom(tierProbabilities);
        uint8 condition = PRISTINE_CONDITION - pickRandom(conditionProbabilities);

        return randomCard(tier, condition, standardTypeProbabilities);
    }

    function starterCardForTier(uint8 tier, uint8 condition) private returns (Instance memory) {
        uint256[] memory typeProbabilities =
          tier == MASTER_TIER                        ? masterTypeProbabilities :
          tier == VIRTUAL_TIER || tier == GODLY_TIER ? virtualTypeProbabilities :
                                                       standardTypeProbabilities;

        return randomCard(tier, condition, typeProbabilities);
    }

    function promotedCard(CardSlot[] memory slots) private returns (Instance memory) {
        Instance memory card = slots[0].card;

        uint8 tier = card.tier + 1;
        uint8 condition = randomlyDegrade(slots, card.tier);

        return starterCardForTier(tier, condition);
    }

    function randomCard(uint8 tier, uint8 condition, uint256[] memory typeProbabilities) private returns (Instance memory) {
        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 type_ = pickRandom(typeProbabilities);
        (uint8 color1, uint8 color2) = randomColors(tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 edition = STANDARD_EDITION;

        return Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }

    // randomness

    function randomPuzzle() private returns (uint8, uint8) {
        uint8 series = uint8(randomNumber() % seriesNames.length);
        uint8 puzzle = uint8(randomNumber() % numPuzzlesPerSeries[series]);

        return (series, puzzle);
    }

    function randomColors(uint8 tier, uint8 type_) private returns (uint8, uint8) {
        uint8 numSlots = numColorSlotsPerType[type_];
        uint8 numColors = uint8(colorNames.length) - 1;

        uint8 color1 = numSlots < 1 ? 0 : 1 + uint8(randomNumber() % numColors);

        uint8 color2 = numSlots < 2 ? 0 :
          (type_ == HELIX_TYPE && tier == CELESTIAL_TIER || tier == GODLY_TIER) ? color1 :
          1 + uint8(randomNumber() % numColors);

        return (color1, color2);
    }

    function randomVariant(uint8 type_) private returns (uint8) {
        uint8 numVariants = numVariantsPerType[type_];
        uint8 variant = numVariants < 1 ? 0 : uint8(randomNumber() % numVariants);

        return variant;
    }

    function randomlyDegrade(CardSlot[] memory slots, uint8 tier) private returns (uint8) {
        uint8 worstCondition = MAX_VALUE;

        for (uint8 i = 0; i < slots.length; i += 1) {
            CardSlot memory slot = slots[i];

            if (slot.occupied && slot.card.condition < worstCondition) {
                worstCondition = slot.card.condition;
            }
        }

        if (worstCondition == DIRE_CONDITION || tier == IMMORTAL_TIER || tier == GODLY_TIER) {
            return worstCondition;
        } else {
            return worstCondition - pickRandom(conditionProbabilities);
        }
    }

    function pickRandom(uint256[] memory probabilities) private returns (uint8) {
        uint256 cumulative = 0;
        for (uint8 i = 0; i < probabilities.length; i += 1) {
            cumulative += probabilities[i];
        }

        uint256 random = randomNumber() % cumulative;

        uint256 total = 0;
        for (uint8 i = 0; i < probabilities.length; i += 1) {
          total += probabilities[i];
          if (random < total) { return i; }
        }

        return MAX_VALUE; // Unreachable.
    }

    function randomNumber() private returns (uint256) {
        return uint256(keccak256(abi.encode(
            block.timestamp,
            block.difficulty,
            proxyRegistryAddress,
            randomCallCount++
        )));
    }

    // actions: activateSunOrMoon

    function activateSunOrMoon(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canActivateSunOrMoon(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory inactive = slots[2].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = inactive.tier;
        uint8 type_ = ACTIVE_TYPE;
        uint8 color1 = inactive.color1;
        uint8 color2 = inactive.color2;
        uint8 variant = inactive.variant;
        uint8 condition = randomlyDegrade(slots, inactive.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canActivateSunOrMoon(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canActivateSunOrMoon(tokenIDs); return (ok, r);
    }

    function _canActivateSunOrMoon(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 2);

        if (!ok)                               { return (ok, r, slots); } // Basic checks failed.
        if (!slots[0].occupied)                { ok = false; r[3] = "[a player, crab or cloak card is required]"; }
        if (!hasType(slots[2], INACTIVE_TYPE)) { ok = false; r[4] = "[an inactive sun or moon card is required]"; }
        if (!ok)                               { return (ok, r, slots); } // Type checks failed.

        ok = ok && cloakCanActivateSunOrMoon(slots, r);

        return (ok, r, slots);
    }

    // actions: lookThroughTelescope

    function lookThroughTelescope(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canLookThroughTelescope(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory telescope = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = telescope.tier;
        uint8 type_ = HELIX_TYPE + uint8(randomNumber() % 3);
        (uint8 color1, uint8 color2) = randomColors(tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, telescope.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canLookThroughTelescope(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canLookThroughTelescope(tokenIDs); return (ok, r);
    }

    function _canLookThroughTelescope(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TELESCOPE_TYPE)) { ok = false; r[4] = "[a telescope card is required]"; }
        if (!hasType(slots[2], ACTIVE_TYPE))    { ok = false; r[5] = "[an active sun or moon card is required]"; }
        if (!ok)                                { return (ok, r, slots); } // Type checks failed.

        Instance memory telescope = slots[1].card;
        Instance memory active = slots[2].card;

        bool sameVariant = telescope.variant == active.variant;
        bool sameColor = telescope.color1 == active.color1;

        if (!sameVariant || !sameColor)         { ok = false; r[6] = "[the sun or moon card does not match the telescope]"; }

        return (ok, r, slots);
    }

    // actions: lookThroughGlasses

    function lookThroughGlasses(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canLookThroughGlasses(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory glasses = slots[1].card;

        uint8 tier = glasses.tier;
        uint8 condition = randomlyDegrade(slots, glasses.tier);

        replace(tokenIDs, starterCardForTier(tier, condition));
    }

    function canLookThroughGlasses(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canLookThroughGlasses(tokenIDs); return (ok, r);
    }

    function _canLookThroughGlasses(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], GLASSES_TYPE)) { ok = false; r[4] = "[a glasses card is required]"; }
        if (!hasType(slots[2], HIDDEN_TYPE))  { ok = false; r[5] = "[a hidden card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        return (ok, r, slots);
    }

    // actions: changeLensColor

    function changeLensColor(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canChangeLensColor(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory torchOrGlasses = slots[1].card;
        Instance memory inactive = slots[2].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = torchOrGlasses.tier;
        uint8 type_ = torchOrGlasses.type_;
        uint8 color1 = torchOrGlasses.color2;
        uint8 color2 = torchOrGlasses.color1;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, torchOrGlasses.tier);
        uint8 edition = STANDARD_EDITION;

        if (inactive.color1 != color1 && inactive.color1 != color2) {
            if (randomNumber() % 2 == 0) {
              color1 = inactive.color1;
            } else {
              color2 = inactive.color1;
            }
        }

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canChangeLensColor(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canChangeLensColor(tokenIDs); return (ok, r);
    }

    function _canChangeLensColor(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        bool torchOrGlassesType = hasType(slots[1], TORCH_TYPE) || hasType(slots[1], GLASSES_TYPE);

        if (!ok)                               { return (ok, r, slots); } // Basic checks failed.
        if (!slots[0].occupied)                { ok = false; r[3] = "[a player, crab or cloak card is required]"; }
        if (!torchOrGlassesType)               { ok = false; r[4] = "[a torch or glasses card is required]"; }
        if (!hasType(slots[2], INACTIVE_TYPE)) { ok = false; r[5] = "[an inactive sun or moon card is required]"; }
        if (!ok)                               { return (ok, r, slots); } // Type checks failed.

        ok = ok && cloakCanActivateSunOrMoon(slots, r);

        return (ok, r, slots);
    }

    // actions: shineTorchOnBasePair

    function shineTorchOnBasePair(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canShineTorchOnBasePair(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory helix = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = helix.tier;
        uint8 type_ = MAP_TYPE + uint8(randomNumber() % 2);
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, helix.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canShineTorchOnBasePair(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canShineTorchOnBasePair(tokenIDs); return (ok, r);
    }

    function _canShineTorchOnBasePair(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TORCH_TYPE))     { ok = false; r[4] = "[a torch card is required]"; }
        if (!hasType(slots[2], HELIX_TYPE))     { ok = false; r[5] = "[an helix card is required]"; }
        if (!ok)                                { return (ok, r, slots); } // Type checks failed.

        Instance memory torch = slots[1].card;
        Instance memory helix = slots[2].card;

        bool colorsMatch = torch.color1 == helix.color1 && torch.color2 == helix.color2;

        if (!colorsMatch)                       { ok = false; r[6] = "[the torch colors don't match the base pair]"; }

        return (ok, r, slots);
    }

    // actions: teleportToNextArea

    function teleportToNextArea(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canTeleportToNextArea(tokenIDs); require(ok, string(abi.encode(r)));
        replace(tokenIDs, promotedCard(slots));
    }

    function canTeleportToNextArea(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canTeleportToNextArea(tokenIDs); return (ok, r);
    }

    function _canTeleportToNextArea(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TELEPORT_TYPE))  { ok = false; r[4] = "[a teleport card is required]"; }
        if (!hasType(slots[2], MAP_TYPE))       { ok = false; r[5] = "[a map card is required]"; }

        return (ok, r, slots);
    }

    // actions: goThroughStarDoor

    function goThroughStarDoor(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canGoThroughStarDoor(tokenIDs); require(ok, string(abi.encode(r)));
        replace(tokenIDs, promotedCard(slots));
    }

    function canGoThroughStarDoor(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canGoThroughStarDoor(tokenIDs); return (ok, r);
    }

    function _canGoThroughStarDoor(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 2);

        if (!ok)                             { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE)) { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], DOOR_TYPE))   { ok = false; r[4] = "[a door card is required]"; }
        if (!ok)                             { return (ok, r, slots); } // Type checks failed.

        Instance memory door = slots[1].card;

        if (door.variant != OPEN_VARIANT)    { ok = false; r[6] = "[the door hasn't been opened]"; }

        return (ok, r, slots);
    }

    // actions: jumpIntoBeacon

    function jumpIntoBeacon(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canJumpIntoBeacon(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory torchOrGlasses = slots[1].card;
        Instance memory beacon = slots[2].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = torchOrGlasses.tier;
        uint8 type_ = torchOrGlasses.type_;
        uint8 color1 = beacon.color1;
        uint8 color2 = beacon.color1;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, torchOrGlasses.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoBeacon(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canJumpIntoBeacon(tokenIDs); return (ok, r);
    }

    function _canJumpIntoBeacon(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        bool torchOrGlassesType = hasType(slots[1], TORCH_TYPE) || hasType(slots[1], GLASSES_TYPE);

        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!torchOrGlassesType)              { ok = false; r[4] = "[a torch or glasses card is required]"; }
        if (!hasType(slots[2], BEACON_TYPE))  { ok = false; r[5] = "[a beacon card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        return (ok, r, slots);
    }

    // actions: jumpIntoEclipse

    function jumpIntoEclipse(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canJumpIntoEclipse(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory door = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = door.tier;
        uint8 type_ = DOOR_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = OPEN_VARIANT;
        uint8 condition = randomlyDegrade(slots, door.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoEclipse(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canJumpIntoEclipse(tokenIDs); return (ok, r);
    }

    function _canJumpIntoEclipse(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r, CardSlot[] memory slots) = performBasicChecks(tokenIDs, 3);

        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.
        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], DOOR_TYPE))    { ok = false; r[4] = "[a door card is required]"; }
        if (!hasType(slots[2], ECLIPSE_TYPE)) { ok = false; r[5] = "[an eclipse card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        Instance memory door = slots[1].card;

        if (door.variant == OPEN_VARIANT)    { ok = false; r[6] = "[the door has already been opened]"; }

        return (ok, r, slots);
    }

    // actions: puzzleMastery1

    function puzzleMastery1(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canPuzzleMastery1(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory artwork0 = slots[0].card;

        uint8 series = artwork0.series;
        uint8 puzzle = artwork0.puzzle;
        uint8 tier = MASTER_TIER;
        uint8 type_ = STAR_TYPE;
        uint8 numColors = uint8(colorNames.length) - 1;
        uint8 color1 = 1 + uint8(randomNumber() % numColors);
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, artwork0.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery1(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canPuzzleMastery1(tokenIDs); return (ok, r);
    }

    function _canPuzzleMastery1(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](6));

        // We need to do this manually because both Artwork cards would be put into the same slot otherwise.
        // We can skip the sameTier check because Artwork cards only spawn at Master tier.

        CardSlot[] memory slots = new CardSlot[](2);

        if (tokenIDs.length != 2)  { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))    { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                   { return (ok, r, slots); } // Basic checks failed.

        Instance memory card0 = tokenIDs[0].card();
        Instance memory card1 = tokenIDs[1].card();

        bool artworkType = card0.type_ == ARTWORK_TYPE && card1.type_ == ARTWORK_TYPE;

        if (!artworkType)          { ok = false; r[2] = "[two artwork cards are required]"; }
        if (doubleSpent(tokenIDs)) { ok = false; r[3] = "[the same card was used twice]"; }
        if (!ok)                   { return (ok, r, slots); } // Type checks failed.

        bool samePuzzle = card0.series == card1.series && card0.puzzle == card1.puzzle;
        bool standardEdition = card0.edition == STANDARD_EDITION && card1.edition == STANDARD_EDITION;

        if (!samePuzzle)          { ok = false; r[4] = "[the puzzles don't match]"; }
        if (!standardEdition)     { ok = false; r[5] = "[the artwork is already signed]"; }

        slots[0] = CardSlot(card0, true);
        slots[1] = CardSlot(card1, true);

        return (ok, r, slots);
    }

    // actions: puzzleMastery2

    function puzzleMastery2(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canPuzzleMastery2(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory star = slots[randomNumber() % 7].card;

        uint8 series = star.series;
        uint8 puzzle = star.puzzle;
        uint8 tier = star.tier;
        uint8 type_ = ARTWORK_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, tier);
        uint8 edition = SIGNED_EDITION;

        if (allPristine(slots)) {
            condition = PRISTINE_CONDITION;

            bool tryLimitedEdition = randomNumber() % 10 == 0;

            if (tryLimitedEdition) {
              uint256 editionsKey_ = editionsKey(series, puzzle);
              uint256 numOthers = limitedEditions[editionsKey_];

              if (numOthers < MAX_LIMITED_EDITIONS) {
                  edition = LIMITED_EDITION;
                  limitedEditions[editionsKey_] += 1;

                  if (!masterCopiesClaimed[editionsKey_]) {
                    edition = MASTER_COPY_EDITION;
                    masterCopiesClaimed[editionsKey_] = true;
                  }
              }
            }
        }

        replace(tokenIDs, Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery2(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canPuzzleMastery2(tokenIDs); return (ok, r);
    }

    function _canPuzzleMastery2(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](4));

        // We need to do this manually because all Star cards would be put into the same slot otherwise.
        // We can skip the sameTier check because Star cards only spawn at Master tier.

        CardSlot[] memory slots = new CardSlot[](7);

        if (tokenIDs.length != 7)         { ok = false; r[0] = "[7 cards are required]"; }
        if (!ownsAll(tokenIDs))           { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                          { return (ok, r, slots); } // Basic checks failed.

        bool allStarType = true;

        for (uint8 i = 0; i < 7; i += 1) {
          Instance memory card = tokenIDs[i].card();
          slots[i] = CardSlot(card, true);

          allStarType = allStarType && card.type_ == STAR_TYPE;
        }

        if (!allStarType)                 { ok = false; r[2] = "[7 star cards are required]"; }
        if (!ok)                          { return (ok, r, slots); } // Type checks failed.

        bool[7] memory alreadyUsed = [false, false, false, false, false, false, false];

        for (uint8 i = 0; i < 7; i += 1) {
          uint8 color = slots[i].card.color1 - 1;

          if (alreadyUsed[color])         { ok = false; r[3] = "[a color was repeated]"; }
          alreadyUsed[color] = true;
        }

        return (ok, r, slots);
    }

    // actions: discard2Pickup1

    function discard2Pickup1(uint256[] memory tokenIDs) public {
        (bool ok, string[] memory r, CardSlot[] memory slots) = _canDiscard2Pickup1(tokenIDs); require(ok, string(abi.encode(r)));

        Instance memory card0 = slots[0].card;
        Instance memory card1 = slots[1].card;

        (uint8 highestTier, uint8 lowestTier) = high_low(card0.tier, card1.tier);
        (uint8 highestCond, uint8 lowestCond) = high_low(card0.condition, card1.condition);

        uint8 tier;
        uint8 cond;

        if (randomNumber() % 10 == 0) {
          tier = highestTier;
          cond = highestCond;
        } else if (randomNumber() % 2 == 0) {
          tier = highestTier;
          cond = lowestCond;
        } else {
          tier = lowestTier;
          cond = highestCond;
        }

        for (uint8 i = 0; i < 2; i += 1) {
          Instance memory card = slots[i].card;

          if (card.edition >= LIMITED_EDITION) {
            uint256 editionsKey_ = editionsKey(card.series, card.puzzle);
            limitedEditions[editionsKey_] -= 1;

            if (card.edition == MASTER_COPY_EDITION) {
              masterCopiesClaimed[editionsKey_] = false;
            }
          }
        }

        replace(tokenIDs, starterCardForTier(tier, cond));
    }

    function canDiscard2Pickup1(uint256[] memory tokenIDs) public view returns (bool isAllowed, string[] memory reasonsForBeingUnable) {
        (bool ok, string[] memory r,) = _canDiscard2Pickup1(tokenIDs); return (ok, r);
    }

    function _canDiscard2Pickup1(uint256[] memory tokenIDs) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](4));

        // We need to do this manually because the cards might be put into the same slot.
        // We can skip the sameTier check because you're allowed to discard cards from mixed tiers.

        CardSlot[] memory slots = new CardSlot[](2);

        bool twoCards = tokenIDs.length == 2;

        if (!twoCards)             { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))    { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                   { return (ok, r, slots); } // Basic checks failed.

        if (doubleSpent(tokenIDs)) { ok = false; r[2] = "[the same card was used twice]"; }

        slots[0] = CardSlot(tokenIDs[0].card(), true);
        slots[1] = CardSlot(tokenIDs[1].card(), true);

        return (ok, r, slots);
    }

    // utilities

    struct CardSlot { Instance card; bool occupied; }

    function _puzzleForIndex(uint16 puzzleIndex) private view returns (uint8, uint8) {
        uint16 cumulative = 0;

        for (uint8 series = 0; series < seriesNames.length; series += 1) {
          uint8 numPuzzles = numPuzzlesPerSeries[series];

          if (puzzleIndex < cumulative + numPuzzles) {
            uint8 puzzle = uint8(puzzleIndex - cumulative);

            return (series, puzzle);
          }

          cumulative += numPuzzles;
        }

        return (MAX_VALUE, MAX_VALUE); // Unreachable.
    }

    function _numLimitedEditionsForAllPuzzles() private view returns (uint256[] memory) {
        uint256[] memory counts = new uint256[](puzzleNames.length);

        for (uint16 i = 0; i < puzzleNames.length; i += 1) {
          (uint8 series, uint8 puzzle) = _puzzleForIndex(i);
          counts[i] = numLimitedEditions(series, puzzle);
        }

        return counts;
    }

    function _masterCopyClaimedForAllPuzzles() private view returns (bool[] memory) {
        bool[] memory claimed = new bool[](puzzleNames.length);

        for (uint16 i = 0; i < puzzleNames.length; i += 1) {
          (uint8 series, uint8 puzzle) = _puzzleForIndex(i);
          claimed[i] = masterCopyClaimed(series, puzzle);
        }

        return claimed;
    }

    function editionsKey(uint8 series, uint8 puzzle) private pure returns (uint256) {
      return (uint256(series) << 8) | puzzle;
    }

    function performBasicChecks(uint256[] memory tokenIDs, uint8 numCards) private view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](10));

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (numCards == 2 && tokenIDs.length != 2) { ok = false; r[0] = "[2 cards are required]"; }
        if (numCards == 3 && tokenIDs.length != 3) { ok = false; r[0] = "[3 cards are required]"; }

        if (!ownsAll(tokenIDs))                    { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                      { ok = false; r[2] = "[the tiers of the cards don't match]"; }

        return (ok, r, slots);
    }

    function cardsInSlots(uint256[] memory tokenIDs) private view returns (CardSlot[] memory) {
        CardSlot[] memory slots = new CardSlot[](3);

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
          Instance memory card = tokenIDs[i].card();
          slots[cardSlotPerType[card.type_]] = CardSlot(card, true);
        }

        return slots;
    }

    function ownsAll(uint256[] memory tokenIDs) private view returns (bool) {
        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            if (balanceOf(_msgSender(), tokenIDs[i]) == 0) { return false; }
        }

        return true;
    }

    function doubleSpent(uint256[] memory tokenIDs) private view returns (bool) {
      return tokenIDs[0] == tokenIDs[1] && balanceOf(_msgSender(), tokenIDs[0]) < 2;
    }

    function sameTier(CardSlot[] memory slots) private pure returns (bool) {
        CardSlot memory slot0 = slots[0];
        CardSlot memory slot1 = slots[1];
        CardSlot memory slot2 = slots[2];

        if (slot0.occupied) {
            return (!slot1.occupied || slot0.card.tier == slot1.card.tier) &&
                   (!slot2.occupied || slot0.card.tier == slot2.card.tier);
        }

        if (slot1.occupied) {
            return (!slot2.occupied || slot1.card.tier == slot2.card.tier);
        }

        return true;
    }

    function hasType(CardSlot memory slot, uint8 type_) private pure returns (bool) {
        return slot.occupied && slot.card.type_ == type_;
    }

    function cloakCanActivateSunOrMoon(CardSlot[] memory slots, string[] memory r) private pure returns (bool) {
        bool ok = true;

        Instance memory activator = slots[0].card;
        Instance memory inactive = slots[2].card;

        bool cloakUsed = activator.type_ == CLOAK_TYPE;
        bool colorsMatch = activator.color1 == inactive.color1;
        bool inaccessible = activator.tier == ETHEREAL_TIER || activator.tier == GODLY_TIER;

        if (cloakUsed && !colorsMatch)         { ok = false; r[6] = "[the color of the cloak does not match]"; }
        if (!cloakUsed && inaccessible)        { ok = false; r[7] = "[only works with a cloak card at this tier]"; }

        return ok;
    }

    function allPristine(CardSlot[] memory slots) private pure returns (bool) {
        bool all = true;

        for (uint8 i = 0; i < slots.length; i += 1) {
            all = all && slots[i].card.condition == PRISTINE_CONDITION;
        }

        return all;
    }

    function high_low(uint8 option1, uint8 option2) private pure returns (uint8, uint8) {
      return (option1 > option2) ? (option1, option2) : (option2, option1);
    }

    function replace(uint256[] memory tokenIDs, Instance memory newCard) private {
        burnOneOfEach(tokenIDs, _msgSender());
        mintOne(newCard.tokenID(), _msgSender());
    }

    bytes1 constant ASCII_SPACE = 0x20;
    bytes1 constant ASCII_DASH = 0x2D;
    bytes1 constant ASCII_CAPITAL_A = 0x41;
    bytes1 constant ASCII_CAPITAL_Z = 0x5A;
    uint8 constant ASCII_TO_LOWERCASE = 32;

    uint8 constant MORTAL_TIER = 0;
    uint8 constant IMMORTAL_TIER = 1;
    uint8 constant ETHEREAL_TIER = 2;
    uint8 constant VIRTUAL_TIER = 3;
    uint8 constant CELESTIAL_TIER = 4;
    uint8 constant GODLY_TIER = 5;
    uint8 constant MASTER_TIER = 6;

    uint8 constant PLAYER_TYPE = 0;
    uint8 constant CRAB_TYPE = 1;
    uint8 constant INACTIVE_TYPE = 2;
    uint8 constant ACTIVE_TYPE = 3;
    uint8 constant CLOAK_TYPE = 4;
    uint8 constant TELESCOPE_TYPE = 5;
    uint8 constant HELIX_TYPE = 6;
    uint8 constant TORCH_TYPE = 7;
    uint8 constant BEACON_TYPE = 8;
    uint8 constant MAP_TYPE = 9;
    uint8 constant TELEPORT_TYPE = 10;
    uint8 constant GLASSES_TYPE = 11;
    uint8 constant ECLIPSE_TYPE = 12;
    uint8 constant DOOR_TYPE = 13;
    uint8 constant HIDDEN_TYPE = 14;
    uint8 constant STAR_TYPE = 15;
    uint8 constant ARTWORK_TYPE = 16;

    uint8 constant OPEN_VARIANT = 0; // Relative

    uint8 constant DIRE_CONDITION = 0;
    uint8 constant PRISTINE_CONDITION = 4;

    uint8 constant STANDARD_EDITION = 0;
    uint8 constant SIGNED_EDITION = 1;
    uint8 constant LIMITED_EDITION = 2;
    uint8 constant MASTER_COPY_EDITION = 3;

    uint8 constant MAX_LIMITED_EDITIONS = 10;

    uint8 constant MAX_VALUE = 255;
}
