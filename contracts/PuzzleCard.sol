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

        DOES_NOT_OWN_ERROR[0] = "[user doesn't own all the cards]";
        DOUBLE_SPEND_ERROR[0] = "[the same card was used twice]";
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

    function randomCard(uint8 tier, uint8 condition, uint256[] memory typeProbabilities) private returns (Attributes memory) {
        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 type_ = pickRandom(typeProbabilities);
        (uint8 color1, uint8 color2) = randomColors(tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 edition = STANDARD_EDITION;

        return Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }

    // conversions

    function tokenIDForCard(Attributes memory card) internal pure returns (uint256) {
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

    function cardForTokenID(uint256 tokenID) private pure returns (Attributes memory) {
        uint8 series    = uint8(tokenID >> 64);
        uint8 puzzle    = uint8(tokenID >> 56);
        uint8 tier      = uint8(tokenID >> 48);
        uint8 type_     = uint8(tokenID >> 40);
        uint8 color1    = uint8(tokenID >> 32);
        uint8 color2    = uint8(tokenID >> 24);
        uint8 variant   = uint8(tokenID >> 16);
        uint8 condition = uint8(tokenID >> 8);
        uint8 edition   = uint8(tokenID);

        return Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }

    function cardsForTokenIDs(uint256[] memory tokenIDs) private pure returns (Attributes[] memory) {
        Attributes[] memory cards = new Attributes[](tokenIDs.length);

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
          cards[i] = cardForTokenID(tokenIDs[i]);
        }

        return cards;
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

    function randomlyDegrade(Attributes[] memory cards) private returns (uint8) {
        uint8 worstCondition = U8_MAX_VALUE;

        for (uint8 i = 0; i < cards.length; i += 1) {
            if (cards[i].condition < worstCondition) {
                worstCondition = cards[i].condition;
            }
        }

        if (worstCondition == DIRE_CONDITION || cards[0].tier == IMMORTAL_TIER || cards[0].tier == GODLY_TIER) {
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

    function activateSunOrMoon(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canActivateSunOrMoon(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = cards[0].tier;
        uint8 type_ = ACTIVE_TYPE;
        uint8 color1 = cards[1].color1;
        uint8 color2 = cards[1].color2;
        uint8 variant = cards[1].variant;
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canActivateSunOrMoon(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](8));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        if (cards[0].tier != cards[1].tier)    { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ > CLOAK_TYPE)       { ok = false; r[1] = "[a player, crab or cloak card is required]"; }
        if (cards[1].type_ != INACTIVE_TYPE)   { ok = false; r[2] = "[an inactive sun or moon card is required]"; }

        ok = ok && cloakCanActivateSunOrMoon(cards, r);

        return (ok, r);
    }

    function lookThroughTelescope(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canLookThroughTelescope(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 type_ = HELIX_TYPE + uint8(randomNumber() % 3);
        (uint8 color1, uint8 color2) = randomColors(cards[0].tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, cards[0].tier, type_, color1, color2, variant, condition, edition));
    }

    function canLookThroughTelescope(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](7));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;
        bool sameVariant = cards[1].variant == cards[2].variant;
        bool sameColor = cards[1].color1 == cards[2].color1;

        if (!sameTier)                        { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)    { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != ACTIVE_TYPE)    { ok = false; r[2] = "[an active sun or moon card is required]"; }
        if (cards[2].type_ != TELESCOPE_TYPE) { ok = false; r[3] = "[a telescope card is required]"; }
        if (!sameVariant || !sameColor)       { ok = false; r[4] = "[the sun or moon card does not match the telescope]"; }

        return (ok, r);
    }

    function lookThroughGlasses(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canLookThroughGlasses(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        replace(tokenIDs, starterCardForTier(cards[0].tier, randomlyDegrade(cards)));
    }

    function canLookThroughGlasses(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](6));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;

        if (!sameTier)                      { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)  { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != GLASSES_TYPE) { ok = false; r[2] = "[a glasses card is required]"; }
        if (cards[2].type_ != HIDDEN_TYPE)  { ok = false; r[3] = "[a hidden card is required]"; }

        return (ok, r);
    }

    function changeLensColor(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canChangeLensColor(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = cards[2].tier;
        uint8 type_ = cards[2].type_;
        uint8 color1 = cards[2].color2;
        uint8 color2 = cards[2].color1;
        uint8 variant = randomVariant(cards[2].type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        if (cards[1].color1 != color1 && cards[1].color1 != color2) {
            if (randomNumber() % 2 == 0) {
              color1 = cards[1].color1;
            } else {
              color2 = cards[1].color1;
            }
        }

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canChangeLensColor(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](8));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;
        bool lensType = cards[2].type_ == TORCH_TYPE || cards[2].type_ == GLASSES_TYPE;

        if (!sameTier)                       { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ > CLOAK_TYPE)     { ok = false; r[1] = "[a player, crab or cloak card is required]"; }
        if (cards[1].type_ != INACTIVE_TYPE) { ok = false; r[2] = "[an inactive sun or moon card is required]"; }
        if (!lensType)                       { ok = false; r[3] = "[a torch or glasses card is required]"; }

        ok = ok && cloakCanActivateSunOrMoon(cards, r);

        return (ok, r);
    }

    function shineTorchOnBasePair(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canShineTorchOnBasePair(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = cards[1].tier;
        uint8 type_ = MAP_TYPE + uint8(randomNumber() % 2);
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canShineTorchOnBasePair(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](7));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;
        bool colorsMatch = cards[1].color1 == cards[2].color1 && cards[1].color2 == cards[2].color2;

        if (!sameTier)                     { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE) { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != HELIX_TYPE)  { ok = false; r[2] = "[an helix card is required]"; }
        if (cards[2].type_ != TORCH_TYPE)  { ok = false; r[3] = "[a torch card is required]"; }
        if (!colorsMatch)                  { ok = false; r[4] = "[the torch colors don't match the base pair]"; }

        return (ok, r);
    }

    function teleportToNextArea(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canTeleportToNextArea(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        replace(tokenIDs, starterCardForTier(cards[0].tier + 1, randomlyDegrade(cards)));
    }

    function canTeleportToNextArea(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](6));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;

        if (!sameTier)                        { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)    { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != MAP_TYPE)       { ok = false; r[3] = "[a map card is required]"; }
        if (cards[2].type_ != TELEPORT_TYPE)  { ok = false; r[2] = "[a teleport card is required]"; }

        return (ok, r);
    }

    function goThroughStarDoor(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canGoThroughStarDoor(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        replace(tokenIDs, starterCardForTier(cards[0].tier + 1, randomlyDegrade(cards)));
    }

    function canGoThroughStarDoor(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](7));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        if (cards[0].tier != cards[1].tier)   { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)    { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != DOOR_TYPE)      { ok = false; r[2] = "[a door card is required]"; }
        if (cards[1].variant != OPEN_VARIANT) { ok = false; r[4] = "[the door hasn't been opened]"; }

        return (ok, r);
    }

    function jumpIntoBeacon(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canJumpIntoBeacon(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = cards[0].tier;
        uint8 type_ = cards[2].type_;
        uint8 color1 = cards[1].color1;
        uint8 color2 = cards[1].color1;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoBeacon(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](4));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;
        bool lensType = cards[2].type_ == TORCH_TYPE || cards[2].type_ == GLASSES_TYPE;

        if (!sameTier)                        { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)    { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != BEACON_TYPE)    { ok = false; r[2] = "[a beacon card is required]"; }
        if (!lensType)                        { ok = false; r[3] = "[a torch or glasses card is required]"; }

        return (ok, r);
    }

    function jumpIntoEclipse(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canJumpIntoEclipse(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = cards[0].tier;
        uint8 type_ = DOOR_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = OPEN_VARIANT;
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canJumpIntoEclipse(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](5));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool sameTier = cards[0].tier == cards[1].tier && cards[0].tier == cards[2].tier;

        if (!sameTier)                        { ok = false; r[0] = "[the tiers of the cards don't match]"; }
        if (cards[0].type_ != PLAYER_TYPE)    { ok = false; r[1] = "[a player card is required]"; }
        if (cards[1].type_ != ECLIPSE_TYPE)   { ok = false; r[2] = "[an eclipse card is required]"; }
        if (cards[2].type_ != DOOR_TYPE)      { ok = false; r[3] = "[a door card is required]"; }
        if (cards[2].variant == OPEN_VARIANT) { ok = false; r[4] = "[the door has already been opened]"; }

        return (ok, r);
    }

    function puzzleMastery1(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canPuzzleMastery1(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        uint8 series = cards[0].series;
        uint8 puzzle = cards[0].puzzle;
        uint8 tier = MASTER_TIER;
        uint8 type_ = STAR_TYPE;
        uint8 color1 = 1 + uint8(randomNumber() % NUM_COLORS);
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = STANDARD_EDITION;

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery1(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }
        if (doubleSpend(tokenIDs)) { return (false, DOUBLE_SPEND_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](6));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool artworkType = cards[0].type_ == ARTWORK_TYPE && cards[1].type_ == ARTWORK_TYPE;
        bool samePuzzle = cards[0].series == cards[1].series && cards[0].puzzle == cards[1].puzzle;
        bool standardEdition = cards[0].edition == STANDARD_EDITION && cards[1].edition == STANDARD_EDITION;

        if (!artworkType)     { ok = false; r[0] = "[two artwork cards are required]"; }
        if (!samePuzzle)      { ok = false; r[1] = "[the puzzles don't match]"; }
        if (!standardEdition) { ok = false; r[2] = "[the artwork is already signed]"; }

        return (ok, r);
    }

    function puzzleMastery2(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canPuzzleMastery2(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);
        Attributes memory star = cards[randomNumber() % 7];

        uint8 series = star.series;
        uint8 puzzle = star.puzzle;
        uint8 tier = star.tier;
        uint8 type_ = ARTWORK_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(cards);
        uint8 edition = SIGNED_EDITION;

        if (allPristine(cards)) {
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

    function canPuzzleMastery2(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }

        (bool ok, string[] memory r) = (true, new string[](2));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        bool[8] memory colorsUsed = [false, false, false, false, false, false, false, false];

        for (uint8 i = 0; i < 7; i += 1) {
            if (cards[i].type_ != STAR_TYPE) { ok = false; r[0] = "[7 star cards are required]"; }
            if (colorsUsed[cards[i].color1]) { ok = false; r[1] = "[a color was repeated]"; }

            colorsUsed[cards[i].color1] = true;
        }

        return (ok, r);
    }

    function discard2Pickup1(uint256[] memory tokenIDs) external {
        (bool ok, string[] memory r) = canDiscard2Pickup1(tokenIDs); require(ok, string(abi.encode(r)));

        Attributes[] memory cards = cardsForTokenIDs(tokenIDs);

        (uint8 highestTier, uint8 lowestTier) = high_low(cards[0].tier, cards[1].tier);
        (uint8 highestCond, uint8 lowestCond) = high_low(cards[0].condition, cards[1].condition);

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
          if (cards[i].edition >= LIMITED_EDITION) {
            uint16 editionsKey_ = editionsKey(cards[i].series, cards[i].puzzle);
            limitedEditions[editionsKey_] -= 1;

            if (cards[i].edition == MASTER_COPY_EDITION) {
              masterCopiesClaimed[editionsKey_] = false;
            }
          }
        }

        replace(tokenIDs, starterCardForTier(tier, cond));
    }

    function canDiscard2Pickup1(uint256[] memory tokenIDs) public view returns (bool, string[] memory) {
        if (!ownsAll(tokenIDs)) { return (false, DOES_NOT_OWN_ERROR); }
        if (doubleSpend(tokenIDs)) { return (false, DOUBLE_SPEND_ERROR); }

        return (true, new string[](0));
    }

    // utilities

    function editionsKey(uint8 series, uint8 puzzle) private pure returns (uint16) {
      return (uint16(series) << 8) | puzzle;
    }

    function ownsAll(uint256[] memory tokenIDs) private view returns (bool) {
        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            if (balanceOf(_msgSender(), tokenIDs[i]) == 0) { return false; }
        }

        return true;
    }

    function doubleSpend(uint256[] memory tokenIDs) private view returns (bool) {
        return tokenIDs[0] == tokenIDs[1] && balanceOf(_msgSender(), tokenIDs[0]) < 2;
    }

    function cloakCanActivateSunOrMoon(Attributes[] memory cards, string[] memory r) private pure returns (bool) {
        bool ok = true;

        Attributes memory activator = cards[0];
        Attributes memory inactive = cards[1];

        bool cloakUsed = activator.type_ == CLOAK_TYPE;
        bool colorsMatch = activator.color1 == inactive.color1;
        bool inaccessible = activator.tier == ETHEREAL_TIER || activator.tier == GODLY_TIER;

        if (cloakUsed && !colorsMatch)  { ok = false; r[4] = "[the color of the cloak does not match]"; }
        if (!cloakUsed && inaccessible) { ok = false; r[5] = "[only works with a cloak card at this tier]"; }

        return ok;
    }

    function allPristine(Attributes[] memory cards) private pure returns (bool) {
        bool all = true;

        for (uint8 i = 0; i < cards.length; i += 1) {
            all = all && cards[i].condition == PRISTINE_CONDITION;
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
    uint8 private constant CLOAK_TYPE = 2;
    uint8 private constant INACTIVE_TYPE = 3;
    uint8 private constant ACTIVE_TYPE = 4;
    uint8 private constant TELESCOPE_TYPE = 5;
    uint8 private constant HELIX_TYPE = 6;
    uint8 private constant BEACON_TYPE = 7;
    uint8 private constant TORCH_TYPE = 8;
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
    uint8[] private NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 1, 2, 0, 0, 2, 0, 0, 0, 1, 0];
    uint8[] private NUM_VARIANTS_PER_TYPE = [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
    uint16[] private VARIANT_OFFSET_PER_TYPE = [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];

    uint256[] private TIER_PROBABILITIES = [90, 10];
    uint256[] private CONDITION_PROBABILITIES = [80, 20];
    uint256[] private STANDARD_TYPE_PROBABILITIES = [300, 100, 100, 200, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] private VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
    uint256[] private MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

    uint256 private PRICE_PER_CARD = 78830000000000000; // $0.10 in Polygon Wei.
    uint256 private NUM_RANDOM_CALLS = 0;

    string[] private DOES_NOT_OWN_ERROR = new string[](1);
    string[] private DOUBLE_SPEND_ERROR = new string[](1);

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
