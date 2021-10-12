// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC1155Tradable.sol";
//import "hardhat/console.sol";

contract PuzzleCard is ERC1155Tradable {
    struct Attributes {
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
    mapping(uint16 => bool) public masterCopiesClaimed;

    constructor(address proxyAddress) ERC1155Tradable("PuzzleCard", "WSUN", proxyAddress) {
        _setURI("https://puzzlecards.github.io/metadata/{id}.json");
    }

    // minting

    function mint(uint256 numberToMint, address to) external payable {
        uint256 price = numberToMint * PRICE_PER_CARD;

        require(msg.value >= price, "[insufficient payment provided]");
        require(numberToMint >= 1, "[unable to mint 0 cards]");
        require(numberToMint <= 100, "[unable to mint more than 100 cards in a single call]");

        payable(owner()).transfer(price);
        mintStarterCards(numberToMint, to);
    }

    function gift(uint256 numberToGift, address to) external onlyOwner {
        mintStarterCards(numberToGift, to);
    }

    function mintStarterCards(uint256 numberToGift, address to) private {
        uint256[] memory tokenIDs = new uint256[](numberToGift);

        for (uint8 i = 0; i < numberToGift; i += 1) {
            tokenIDs[i] = tokenIDForCard(starterCard());
        }

        mintOneOfEach(tokenIDs, to);
    }

    function starterCard() private returns (Attributes memory) {
        uint8 tier = pickRandom(TIER_PROBABILITIES);
        uint8 condition = PRISTINE_CONDITION - pickRandom(CONDITION_PROBABILITIES);

        return randomCard(tier, condition, STANDARD_TYPE_PROBABILITIES);
    }

    function starterCardForTier(uint8 tier, uint8 condition) private returns (Attributes memory) {
        uint256[] memory typeProbabilities =
          tier == MASTER_TIER                        ? MASTER_TYPE_PROBABILITIES :
          tier == VIRTUAL_TIER || tier == GODLY_TIER ? VIRTUAL_TYPE_PROBABILITIES :
                                                       STANDARD_TYPE_PROBABILITIES;

        return randomCard(tier, condition, typeProbabilities);
    }

    function promotedCard(CardSlot[] memory slots) private returns (Attributes memory) {
        Attributes memory card = slots[0].card;

        uint8 tier = card.tier + 1;
        uint8 condition = randomlyDegrade(slots, card.tier);

        return starterCardForTier(tier, condition);
    }

    function randomCard(uint8 tier, uint8 condition, uint256[] memory typeProbabilities) private returns (Attributes memory) {
        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 type_ = pickRandom(typeProbabilities);
        (uint8 color1, uint8 color2) = randomColors(tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 edition = STANDARD_EDITION;

        return Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }

    // conversions

    function tokenIDForCard(PuzzleCard.Attributes memory card) internal pure returns (uint256) {
        return (
            uint256(card.series)    << 64 |
            uint256(card.puzzle)    << 56 |
            uint256(card.tier)      << 48 |
            uint256(card.type_)     << 40 |
            uint256(card.color1)    << 32 |
            uint256(card.color2)    << 24 |
            uint256(card.variant)   << 16 |
            uint256(card.condition) << 8  |
            uint256(card.edition)
        );
    }

    function cardForTokenID(uint256 tokenID) private pure returns (PuzzleCard.Attributes memory) {
        uint8 series    = uint8(tokenID >> 64);
        uint8 puzzle    = uint8(tokenID >> 56);
        uint8 tier      = uint8(tokenID >> 48);
        uint8 type_     = uint8(tokenID >> 40);
        uint8 color1    = uint8(tokenID >> 32);
        uint8 color2    = uint8(tokenID >> 24);
        uint8 variant   = uint8(tokenID >> 16);
        uint8 condition = uint8(tokenID >> 8);
        uint8 edition   = uint8(tokenID);

        return PuzzleCard.Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }

    // randomness

    function randomPuzzle() private returns (uint8, uint8) {
        uint8 series = uint8(randomNumber() % NUM_PUZZLES_PER_SERIES.length);
        uint8 puzzle = uint8(randomNumber() % NUM_PUZZLES_PER_SERIES[series]);

        return (series, puzzle);
    }

    function randomColors(uint8 tier, uint8 type_) private returns (uint8, uint8) {
        uint8 numSlots = NUM_COLOR_SLOTS_PER_TYPE[type_];

        uint8 color1 = numSlots < 1 ? 0 : 1 + uint8(randomNumber() % NUM_COLORS);
        uint8 color2 = numSlots < 2 ? 0 :
          (type_ == HELIX_TYPE && tier == CELESTIAL_TIER || tier == GODLY_TIER) ? color1 :
          1 + uint8(randomNumber() % NUM_COLORS);

        return (color1, color2);
    }

    function randomVariant(uint8 type_) private returns (uint8) {
        uint8 numVariants = NUM_VARIANTS_PER_TYPE[type_];
        uint8 variant = numVariants < 1 ? 0 : uint8(randomNumber() % numVariants);

        return variant;
    }

    function randomlyDegrade(CardSlot[] memory slots, uint8 tier) private returns (uint8) {
        uint8 worstCondition = U8_MAX_VALUE;

        for (uint8 i = 0; i < slots.length; i += 1) {
            CardSlot memory slot = slots[i];

            if (slot.occupied && slot.card.condition < worstCondition) {
                worstCondition = slot.card.condition;
            }
        }

        if (worstCondition == DIRE_CONDITION || tier == IMMORTAL_TIER || tier == GODLY_TIER) {
            return worstCondition;
        } else {
            return worstCondition - pickRandom(CONDITION_PROBABILITIES);
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

        return U8_MAX_VALUE; // Unreachable.
    }

    function randomNumber() private returns (uint256) {
        return uint256(keccak256(abi.encode(
            block.timestamp,
            block.difficulty,
            NUM_RANDOM_CALLS++
        )));
    }

    // actions

    function activateSunOrMoon(uint256 activatorID, uint256 inactiveID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canActivateSunOrMoon(activatorID, inactiveID); require(ok, string(abi.encode(r)));

        Attributes memory inactive = slots[2].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = inactive.tier;
        uint8 type_ = ACTIVE_TYPE;
        uint8 color1 = inactive.color1;
        uint8 color2 = inactive.color2;
        uint8 variant = inactive.variant;
        uint8 condition = randomlyDegrade(slots, inactive.tier);
        uint8 edition = STANDARD_EDITION;

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = activatorID; tokenIDs[1] = inactiveID; // TMP

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canActivateSunOrMoon(uint256 activatorID, uint256 inactiveID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](8));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = activatorID; tokenIDs[1] = inactiveID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 2)              { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))                { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                  { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                               { return (ok, r, slots); } // Basic checks failed.

        if (!slots[0].occupied)                { ok = false; r[3] = "[a player, crab or cloak card is required]"; }
        if (!hasType(slots[2], INACTIVE_TYPE)) { ok = false; r[4] = "[an inactive sun or moon card is required]"; }
        if (!ok)                               { return (ok, r, slots); } // Type checks failed.

        ok = ok && cloakCanActivateSunOrMoon(slots, r);

        return (ok, r, slots);
    }

    function lookThroughTelescope(uint256 playerID, uint256 activeID, uint256 telescopeID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canLookThroughTelescope(playerID, activeID, telescopeID);
        require(ok, string(abi.encode(r)));

        Attributes memory telescope = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        //uint8 tier = telescope.tier;
        uint8 type_ = HELIX_TYPE + uint8(randomNumber() % 3);
        (uint8 color1, uint8 color2) = randomColors(telescope.tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, telescope.tier);
        uint8 edition = STANDARD_EDITION;

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = activeID; tokenIDs[2] = telescopeID; // TMP

        replace(tokenIDs, Attributes(series, puzzle, telescope.tier, type_, color1, color2, variant, condition, edition));
    }

    function canLookThroughTelescope(uint256 playerID, uint256 activeID, uint256 telescopeID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](7));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = activeID; tokenIDs[2] = telescopeID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)               { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))                 { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                   { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TELESCOPE_TYPE)) { ok = false; r[4] = "[a telescope card is required]"; }
        if (!hasType(slots[2], ACTIVE_TYPE))    { ok = false; r[5] = "[an active sun or moon card is required]"; }
        if (!ok)                                { return (ok, r, slots); } // Type checks failed.

        Attributes memory telescope = slots[1].card;
        Attributes memory active = slots[2].card;

        bool sameVariant = telescope.variant == active.variant;
        bool sameColor = telescope.color1 == active.color1;

        if (!sameVariant || !sameColor)         { ok = false; r[6] = "[the sun or moon card does not match the telescope]"; }

        return (ok, r, slots);
    }

    function lookThroughGlasses(uint256 playerID, uint256 glassesID, uint256 hiddenID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canLookThroughGlasses(playerID, glassesID, hiddenID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = glassesID; tokenIDs[2] = hiddenID; // TMP

        Attributes memory glasses = slots[1].card;

        uint8 tier = glasses.tier;
        uint8 condition = randomlyDegrade(slots, glasses.tier);

        replace(tokenIDs, starterCardForTier(tier, condition));
    }

    function canLookThroughGlasses(uint256 playerID, uint256 glassesID, uint256 hiddenID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](6));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = glassesID; tokenIDs[2] = hiddenID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)             { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))               { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                 { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], GLASSES_TYPE)) { ok = false; r[4] = "[a glasses card is required]"; }
        if (!hasType(slots[2], HIDDEN_TYPE))  { ok = false; r[5] = "[a hidden card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        return (ok, r, slots);
    }

    function changeLensColor(uint256 activatorID, uint256 lensID, uint256 inactiveID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canChangeLensColor(activatorID, lensID, inactiveID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = activatorID; tokenIDs[1] = lensID; tokenIDs[2] = inactiveID; // TMP

        Attributes memory torchOrGlasses = slots[1].card;
        Attributes memory inactive = slots[2].card;

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

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canChangeLensColor(uint256 activatorID, uint256 lensID, uint256 inactiveID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](8));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = activatorID; tokenIDs[1] = lensID; tokenIDs[2] = inactiveID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)              { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))                { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                  { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                               { return (ok, r, slots); } // Basic checks failed.

        bool torchOrGlassesType = hasType(slots[1], TORCH_TYPE) || hasType(slots[1], GLASSES_TYPE);

        if (!slots[0].occupied)                { ok = false; r[3] = "[a player, crab or cloak card is required]"; }
        if (!torchOrGlassesType)               { ok = false; r[4] = "[a torch or glasses card is required]"; }
        if (!hasType(slots[2], INACTIVE_TYPE)) { ok = false; r[5] = "[an inactive sun or moon card is required]"; }
        if (!ok)                               { return (ok, r, slots); } // Type checks failed.

        ok = ok && cloakCanActivateSunOrMoon(slots, r);

        return (ok, r, slots);
    }

    function shineTorchOnBasePair(uint256 playerID, uint256 torchID, uint256 helixID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canShineTorchOnBasePair(playerID, torchID, helixID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = torchID; tokenIDs[2] = helixID; // TMP

        Attributes memory helix = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = helix.tier;
        uint8 type_ = MAP_TYPE + uint8(randomNumber() % 2);
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, helix.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canShineTorchOnBasePair(uint256 playerID, uint256 torchID, uint256 helixID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](7));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = torchID; tokenIDs[2] = helixID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)               { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))                 { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                   { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TORCH_TYPE))     { ok = false; r[4] = "[a torch card is required]"; }
        if (!hasType(slots[2], HELIX_TYPE))     { ok = false; r[5] = "[an helix card is required]"; }
        if (!ok)                                { return (ok, r, slots); } // Type checks failed.

        Attributes memory torch = slots[1].card;
        Attributes memory helix = slots[2].card;

        bool colorsMatch = torch.color1 == helix.color1 && torch.color2 == helix.color2;

        if (!colorsMatch)                       { ok = false; r[6] = "[the torch colors don't match the base pair]"; }

        return (ok, r, slots);
    }

    function teleportToNextArea(uint256 playerID, uint256 mapID, uint256 teleportID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canTeleportToNextArea(playerID, mapID, teleportID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = mapID; tokenIDs[2] = teleportID; // TMP

        replace(tokenIDs, promotedCard(slots));
    }

    function canTeleportToNextArea(uint256 playerID, uint256 mapID, uint256 teleportID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](6));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = mapID; tokenIDs[2] = teleportID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)               { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))                 { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                   { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                                { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE))    { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], TELEPORT_TYPE))  { ok = false; r[4] = "[a teleport card is required]"; }
        if (!hasType(slots[2], MAP_TYPE))       { ok = false; r[5] = "[a map card is required]"; }

        return (ok, r, slots);
    }

    function goThroughStarDoor(uint256 playerID, uint256 doorID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canGoThroughStarDoor(playerID, doorID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = playerID; tokenIDs[1] = doorID; // TMP

        replace(tokenIDs, promotedCard(slots));
    }

    function canGoThroughStarDoor(uint256 playerID, uint256 doorID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](7));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = playerID; tokenIDs[1] = doorID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 2)            { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))              { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                             { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE)) { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], DOOR_TYPE))   { ok = false; r[4] = "[a door card is required]"; }
        if (!ok)                             { return (ok, r, slots); } // Type checks failed.

        Attributes memory door = slots[1].card;

        if (door.variant != OPEN_VARIANT)    { ok = false; r[6] = "[the door hasn't been opened]"; }

        return (ok, r, slots);
    }

    function jumpIntoBeacon(uint256 playerID, uint256 lensID, uint256 beaconID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canJumpIntoBeacon(playerID, lensID, beaconID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = lensID; tokenIDs[2] = beaconID; // TMP

        Attributes memory torchOrGlasses = slots[1].card;
        Attributes memory beacon = slots[2].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = torchOrGlasses.tier;
        uint8 type_ = torchOrGlasses.type_;
        uint8 color1 = beacon.color1;
        uint8 color2 = beacon.color1;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, torchOrGlasses.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoBeacon(uint256 playerID, uint256 lensID, uint256 beaconID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](6));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = lensID; tokenIDs[2] = beaconID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)             { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))               { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                 { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.

        bool torchOrGlassesType = hasType(slots[1], TORCH_TYPE) || hasType(slots[1], GLASSES_TYPE);

        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!torchOrGlassesType)              { ok = false; r[4] = "[a torch or glasses card is required]"; }
        if (!hasType(slots[2], BEACON_TYPE))  { ok = false; r[5] = "[a beacon card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        return (ok, r, slots);
    }

    function jumpIntoEclipse(uint256 playerID, uint256 eclipseID, uint256 doorID) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canJumpIntoEclipse(playerID, eclipseID, doorID);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = eclipseID; tokenIDs[2] = doorID; // TMP

        Attributes memory door = slots[1].card;

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = door.tier;
        uint8 type_ = DOOR_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = OPEN_VARIANT;
        uint8 condition = randomlyDegrade(slots, door.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoEclipse(uint256 playerID, uint256 eclipseID, uint256 doorID) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](7));

        uint256[] memory tokenIDs = new uint256[](3); tokenIDs[0] = playerID; tokenIDs[1] = eclipseID; tokenIDs[2] = doorID; // TMP

        CardSlot[] memory slots = cardsInSlots(tokenIDs);

        if (tokenIDs.length != 3)             { ok = false; r[0] = "[3 cards are required]"; }
        if (!ownsAll(tokenIDs))               { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!sameTier(slots))                 { ok = false; r[2] = "[the tiers of the cards don't match]"; }
        if (!ok)                              { return (ok, r, slots); } // Basic checks failed.

        if (!hasType(slots[0], PLAYER_TYPE))  { ok = false; r[3] = "[a player card is required]"; }
        if (!hasType(slots[1], DOOR_TYPE))    { ok = false; r[4] = "[a door card is required]"; }
        if (!hasType(slots[2], ECLIPSE_TYPE)) { ok = false; r[5] = "[an eclipse card is required]"; }
        if (!ok)                              { return (ok, r, slots); } // Type checks failed.

        Attributes memory door = slots[1].card;

        if (door.variant == OPEN_VARIANT)    { ok = false; r[6] = "[the door has already been opened]"; }

        return (ok, r, slots);
    }

    function puzzleMastery1(uint256 artworkID1, uint256 artworkID2) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canPuzzleMastery1(artworkID1, artworkID2);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = artworkID1; tokenIDs[1] = artworkID2;

        Attributes memory artwork0 = slots[0].card;

        uint8 series = artwork0.series;
        uint8 puzzle = artwork0.puzzle;
        uint8 tier = MASTER_TIER;
        uint8 type_ = STAR_TYPE;
        uint8 color1 = 1 + uint8(randomNumber() % NUM_COLORS);
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(slots, artwork0.tier);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery1(uint256 artworkID1, uint256 artworkID2) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](6));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = artworkID1; tokenIDs[1] = artworkID2;

        // We need to do this manually because both Artwork cards would be put into the same slot otherwise.
        // We can skip the sameTier check because Artwork cards only spawn at Master tier.

        CardSlot[] memory slots = new CardSlot[](2);

        if (tokenIDs.length != 2)  { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))    { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                   { return (ok, r, slots); } // Basic checks failed.

        Attributes memory card0 = cardForTokenID(tokenIDs[0]);
        Attributes memory card1 = cardForTokenID(tokenIDs[1]);

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

    function puzzleMastery2(uint256 starID1, uint256 starID2, uint256 starID3, uint256 starID4, uint256 starID5, uint256 starID6, uint256 starID7) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canPuzzleMastery2(starID1, starID2, starID3, starID4, starID5, starID6, starID7);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](7); tokenIDs[0] = starID1; tokenIDs[1] = starID2; tokenIDs[2] = starID3; tokenIDs[3] = starID4; tokenIDs[4] = starID5; tokenIDs[5] = starID6; tokenIDs[6] = starID7;

        Attributes memory star = slots[randomNumber() % 7].card;

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
              uint16 editionsKey_ = editionsKey(series, puzzle);
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

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery2(uint256 starID1, uint256 starID2, uint256 starID3, uint256 starID4, uint256 starID5, uint256 starID6, uint256 starID7) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](4));

        uint256[] memory tokenIDs = new uint256[](7); tokenIDs[0] = starID1; tokenIDs[1] = starID2; tokenIDs[2] = starID3; tokenIDs[3] = starID4; tokenIDs[4] = starID5; tokenIDs[5] = starID6; tokenIDs[6] = starID7;

        // We need to do this manually because all Star cards would be put into the same slot otherwise.
        // We can skip the sameTier check because Star cards only spawn at Master tier.

        CardSlot[] memory slots = new CardSlot[](7);

        if (tokenIDs.length != 7)         { ok = false; r[0] = "[7 cards are required]"; }
        if (!ownsAll(tokenIDs))           { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                          { return (ok, r, slots); } // Basic checks failed.

        bool allStarType = true;

        for (uint8 i = 0; i < 7; i += 1) {
          Attributes memory card = cardForTokenID(tokenIDs[i]);
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

    function discard2Pickup1(uint256 tokenID1, uint256 tokenID2) external {
        (bool ok, string[] memory r, CardSlot[] memory slots) = canDiscard2Pickup1(tokenID1, tokenID2);
        require(ok, string(abi.encode(r)));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = tokenID1; tokenIDs[1] = tokenID2;

        Attributes memory card0 = slots[0].card;
        Attributes memory card1 = slots[1].card;

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
          Attributes memory card = slots[i].card;

          if (card.edition >= LIMITED_EDITION) {
            uint16 editionsKey_ = editionsKey(card.series, card.puzzle);
            limitedEditions[editionsKey_] -= 1;

            if (card.edition == MASTER_COPY_EDITION) {
              masterCopiesClaimed[editionsKey_] = false;
            }
          }
        }

        replace(tokenIDs, starterCardForTier(tier, cond));
    }

    function canDiscard2Pickup1(uint256 tokenID1, uint256 tokenID2) public view returns (bool, string[] memory, CardSlot[] memory) {
        (bool ok, string[] memory r) = (true, new string[](4));

        uint256[] memory tokenIDs = new uint256[](2); tokenIDs[0] = tokenID1; tokenIDs[1] = tokenID2;

        // We need to do this manually because the cards might be put into the same slot.
        // We can skip the sameTier check because you're allowed to discard cards from mixed tiers.

        CardSlot[] memory slots = new CardSlot[](2);

        bool twoCards = tokenIDs.length == 2;

        if (!twoCards)             { ok = false; r[0] = "[2 cards are required]"; }
        if (!ownsAll(tokenIDs))    { ok = false; r[1] = "[user doesn't own all the cards]"; }
        if (!ok)                   { return (ok, r, slots); } // Basic checks failed.

        if (doubleSpent(tokenIDs)) { ok = false; r[2] = "[the same card was used twice]"; }

        slots[0] = CardSlot(cardForTokenID(tokenIDs[0]), true);
        slots[1] = CardSlot(cardForTokenID(tokenIDs[1]), true);

        return (ok, r, slots);
    }

    // utilities

    struct CardSlot { Attributes card; bool occupied; }

    function editionsKey(uint8 series, uint8 puzzle) private pure returns (uint16) {
      return (uint16(series) << 8) | puzzle;
    }

    function cardsInSlots(uint256[] memory tokenIDs) private view returns (CardSlot[] memory) {
        CardSlot[] memory slots = new CardSlot[](3);

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
          Attributes memory card = cardForTokenID(tokenIDs[i]);
          slots[CARD_SLOT_PER_TYPE[card.type_]] = CardSlot(card, true);
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

        Attributes memory activator = slots[0].card;
        Attributes memory inactive = slots[2].card;

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

    function replace(uint256[] memory tokenIDs, Attributes memory newCard) private {
        burnOneOfEach(tokenIDs, _msgSender());
        mintOne(tokenIDForCard(newCard), _msgSender());
    }

    // constants

    uint8 private constant MORTAL_TIER = 0;
    uint8 private constant IMMORTAL_TIER = 1;
    uint8 private constant ETHEREAL_TIER = 2;
    uint8 private constant VIRTUAL_TIER = 3;
    uint8 private constant CELESTIAL_TIER = 4;
    uint8 private constant GODLY_TIER = 5;
    uint8 private constant MASTER_TIER = 6;

    uint8 private constant PLAYER_TYPE = 0;
    uint8 private constant CRAB_TYPE = 1;
    uint8 private constant INACTIVE_TYPE = 2;
    uint8 private constant ACTIVE_TYPE = 3;
    uint8 private constant CLOAK_TYPE = 4;
    uint8 private constant TELESCOPE_TYPE = 5;
    uint8 private constant HELIX_TYPE = 6;
    uint8 private constant TORCH_TYPE = 7;
    uint8 private constant BEACON_TYPE = 8;
    uint8 private constant MAP_TYPE = 9;
    uint8 private constant TELEPORT_TYPE = 10;
    uint8 private constant GLASSES_TYPE = 11;
    uint8 private constant ECLIPSE_TYPE = 12;
    uint8 private constant DOOR_TYPE = 13;
    uint8 private constant HIDDEN_TYPE = 14;
    uint8 private constant STAR_TYPE = 15;
    uint8 private constant ARTWORK_TYPE = 16;

    uint8 private constant OPEN_VARIANT = 0; // Relative

    uint8 private constant DIRE_CONDITION = 0;
    uint8 private constant PRISTINE_CONDITION = 4;

    uint8 private constant STANDARD_EDITION = 0;
    uint8 private constant SIGNED_EDITION = 1;
    uint8 private constant LIMITED_EDITION = 2;
    uint8 private constant MASTER_COPY_EDITION = 3;

    uint8 private constant NUM_COLORS = 7;
    uint8 private constant MAX_LIMITED_EDITIONS = 10;
    uint8 private constant U8_MAX_VALUE = 255;

    uint8[] private NUM_PUZZLES_PER_SERIES = [2, 3];
    uint16[] private PUZZLE_OFFSET_PER_SERIES = [0, 2];
    uint8[] private NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 1, 0];
    uint8[] private NUM_VARIANTS_PER_TYPE = [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
    uint16[] private VARIANT_OFFSET_PER_TYPE = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];
    uint16[] private CARD_SLOT_PER_TYPE = [0, 0, 2, 2, 0, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2];

    uint256[] private TIER_PROBABILITIES = [90, 10];
    uint256[] private CONDITION_PROBABILITIES = [80, 20];
    uint256[] private STANDARD_TYPE_PROBABILITIES = [300, 100, 200, 100, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] private VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
    uint256[] private MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

    uint256 private PRICE_PER_CARD = 78830000000000000; // $0.10 in Polygon Wei.
    uint256 private NUM_RANDOM_CALLS = 0;

    // Be very careful not to invalidate existing cards when calling these methods.
    // The arrays must be append only and not reorder or remove puzzles/variants.
    function updateConstants(
        uint8[] memory numPuzzlesPerSeries,
        uint16[] memory puzzleOffsetPerSeries,
        uint8[] memory numVariantsPerType,
        uint16[] memory variantOffsetPerType,
        string memory metadataURI,
        uint256 pricePerCard
    ) external onlyOwner {
        NUM_PUZZLES_PER_SERIES = numPuzzlesPerSeries;
        PUZZLE_OFFSET_PER_SERIES = puzzleOffsetPerSeries;
        NUM_VARIANTS_PER_TYPE = numVariantsPerType;
        VARIANT_OFFSET_PER_TYPE = variantOffsetPerType;
        PRICE_PER_CARD = pricePerCard;

        _setURI(metadataURI);
    }
}
