// SPDX-License-Identifier: UNLICENSED

// This is an ERC1155-compliant smart contract that manages 'Puzzle Cards'.
//
// Puzzle Cards are a collection of semi-fungible and non-fungible tokens that
// can be minted and combined in various ways according to 'recipes'.
//
// This collection was created by Chris Patuzzo and is an accompaniment to his
// upcoming puzzle/platform video game 'Worship the Sun'. All proceeds go to
// supporting Chris's work and towards making the game as enjoyable as possible.
//
// All of the contract and website code is fully auditable and open on GitHub.
// Puzzle Card imagery can be freely shared on social media, OpenSea, etc.
//
// Many ERC1155 extensions are supported, e.g, ERC1155MetadataURI, ERC1155Supply.
// A JavaScript library is provided to make it easier to work with the contract.
//
// - Website: https://puzzlecards.github.io/
// - Library: https://puzzlecards.github.io/PuzzleCard.js
// - GitHub: https://github.com/tuzz/puzzle-cards
// - Twitter: https://twitter.com/chrispatuzzo
// - License: Copyright 2021, Chris Patuzzo, All Rights Reserved

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./vendor/ContextMixin.sol";
import "./vendor/NativeMetaTransaction.sol";
import "./vendor/ProxyRegistry.sol";

//import "hardhat/console.sol";

contract PuzzleCard is ERC1155, Ownable, ContextMixin, NativeMetaTransaction {
    string public name = "Worship the Sun: Puzzle Card";
    string public symbol = "WSUN";

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

    mapping(uint256 => uint256) public totalSupply;
    mapping(address => uint8) public maxTierUnlocked;
    mapping(uint256 => uint256) public limitedEditions;
    mapping(uint16 => uint8) public masterCopyClaimedAt;
    uint256 public basePriceInWei = 5263157894736843; // $0.01

    constructor(address proxyRegistryAddress) ERC1155("") {
        PROXY_REGISTRY_ADDRESS = proxyRegistryAddress;

        _setURI("https://puzzlecards.github.io/metadata/{id}.json");
        _initializeEIP712(name);
    }

    function exists(uint256 tokenID) external view returns (bool) {
      return totalSupply[tokenID] != 0;
    }

    function _msgSender() internal override view returns (address sender) {
        return ContextMixin.msgSender();
    }

    function isApprovedForAll(address owner, address operator) override public view returns (bool) {
        ProxyRegistry registry = ProxyRegistry(PROXY_REGISTRY_ADDRESS);
        return address(registry.proxies(owner)) == operator || ERC1155.isApprovedForAll(owner, operator);
    }

    // minting

    function mint(uint256 numberToMint, uint8 tier, address to) external payable {
        if (msg.sender != owner()) {
          require(tier <= maxTierUnlocked[msg.sender]);
          payable(owner()).transfer(basePriceInWei * numberToMint * MINT_PRICE_MULTIPLERS[tier]);
        }

        if (to == address(0)) { to = msg.sender; }
        mintStarterCards(numberToMint, tier, to);
    }

    function unlockMintingAtAllTiers(address address_) external payable {
        if (address_ == address(0)) { address_ = msg.sender; }
        require(maxTierUnlocked[address_] < MASTER_TIER);

        if (msg.sender != owner()) {
          payable(owner()).transfer(basePriceInWei * UNLOCK_PRICE_MULTIPLIER);
        }

        maxTierUnlocked[address_] = MASTER_TIER;
    }

    function mintStarterCards(uint256 numberToMint, uint8 tier, address to) private {
        uint256[] memory tokenIDs = new uint256[](numberToMint);
        uint256[] memory oneOfEach = new uint256[](numberToMint);

        for (uint256 i = 0; i < numberToMint; i += 1) {
            uint8 condition = PRISTINE_CONDITION - uint8(randomNumber() % 2);
            uint256 newCardID = tokenIDForCard(starterCardForTier(tier, condition));

            tokenIDs[i] = newCardID;
            oneOfEach[i] = 1;
            totalSupply[newCardID] += 1;
        }

        _mintBatch(to, tokenIDs, oneOfEach, "");
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

        return Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION);
    }

    // actions

    function activateSunOrMoon(uint256[] memory tokenIDs) external {
        (bool ok,) = canActivateSunOrMoon(tokenIDs); require(ok);

        uint256 inactiveID = tokenIDs[1];

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(inactiveID);
        uint8 type_ = ACTIVE_TYPE;
        uint8 color1 = color1ForTokenID(inactiveID);
        uint8 color2 = 0;
        uint8 variant = variantForTokenID(inactiveID);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canActivateSunOrMoon(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 2, [ACTIVATOR_TYPE, INACTIVE_TYPE, 0, 0, 0, 0, 0], errors);
        ok = ok && cloakCanActivateSunOrMoon(tokenIDs, errors);

        return (ok, errors);
    }

    function lookThroughTelescope(uint256[] memory tokenIDs) external {
        (bool ok,) = canLookThroughTelescope(tokenIDs); require(ok);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(tokenIDs[0]);
        uint8 type_ = HELIX_TYPE + uint8(randomNumber() % 3);
        (uint8 color1, uint8 color2) = randomColors(tier, type_);
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canLookThroughTelescope(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, ACTIVE_TYPE, TELESCOPE_TYPE, 0, 0, 0, 0], errors);
        if (!ok) { return (false, errors); }

        uint256 activeID = tokenIDs[1];
        uint256 telescopeID = tokenIDs[2];

        bool matches = variantForTokenID(activeID) == variantForTokenID(telescopeID)
                    && color1ForTokenID(activeID) == color1ForTokenID(telescopeID);

        if (!matches) { ok = false; errors[TELESCOPE_DOESNT_MATCH] = true; }

        return (ok, errors);
    }

    function lookThroughGlasses(uint256[] memory tokenIDs) external {
        (bool ok,) = canLookThroughGlasses(tokenIDs); require(ok);

        uint256 glassesID = tokenIDs[1];

        uint8 tier = tierForTokenID(glassesID);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, randomCard(tier, condition, POST_VIRTUAL_TYPE_PROBABILITIES));

        if (color1ForTokenID(glassesID) != color2ForTokenID(glassesID)) {
          condition = randomlyDegrade(tokenIDs, tier);
          mintCard(randomCard(tier, condition, POST_VIRTUAL_TYPE_PROBABILITIES));
        }
    }

    function canLookThroughGlasses(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, GLASSES_TYPE, HIDDEN_TYPE, 0, 0, 0, 0], errors);
        return (ok, errors);
    }

    function changeLensColor(uint256[] memory tokenIDs) external {
        (bool ok,) = canChangeLensColor(tokenIDs); require(ok);

        uint256 lensID = tokenIDs[2];
        uint8 activatedColor = color1ForTokenID(tokenIDs[1]);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(lensID);
        uint8 type_ = typeForTokenID(lensID);
        uint8 color1 = color2ForTokenID(lensID);
        uint8 color2 = color1ForTokenID(lensID);
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        if (activatedColor != color1 && activatedColor != color2) {
            if (randomNumber() % 2 == 0) {
              color1 = activatedColor;
            } else {
              color2 = activatedColor;
            }
        }

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canChangeLensColor(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [ACTIVATOR_TYPE, INACTIVE_TYPE, LENS_TYPE, 0, 0, 0, 0], errors);
        ok = ok && cloakCanActivateSunOrMoon(tokenIDs, errors);

        return (ok, errors);
    }

    function shineTorchOnBasePair(uint256[] memory tokenIDs) external {
        (bool ok,) = canShineTorchOnBasePair(tokenIDs); require(ok);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(tokenIDs[0]);
        uint8 type_ = MAP_TYPE + uint8(randomNumber() % 2);
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canShineTorchOnBasePair(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, HELIX_TYPE, TORCH_TYPE, 0, 0, 0, 0], errors);

        uint256 helixID = tokenIDs[1];
        uint256 torchID = tokenIDs[2];

        bool colorsMatch = color1ForTokenID(helixID) == color1ForTokenID(torchID)
                        && color2ForTokenID(helixID) == color2ForTokenID(torchID);

        if (!colorsMatch) { ok = false; errors[TORCH_DOESNT_MATCH] = true; }

        return (ok, errors);
    }

    function teleportToNextArea(uint256[] memory tokenIDs) external {
        (bool ok,) = canTeleportToNextArea(tokenIDs); require(ok);

        uint8 tier = tierForTokenID(tokenIDs[0]);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        unlockMintingAtTier(tier + 1);
        replace(tokenIDs, starterCardForTier(tier + 1, condition));
    }

    function canTeleportToNextArea(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, MAP_TYPE, TELEPORT_TYPE, 0, 0, 0, 0], errors);
        return (ok, errors);
    }

    function goThroughStarDoor(uint256[] memory tokenIDs) external {
        (bool ok,) = canGoThroughStarDoor(tokenIDs); require(ok);

        uint8 tier = tierForTokenID(tokenIDs[0]);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        unlockMintingAtTier(tier + 1);
        replace(tokenIDs, starterCardForTier(tier + 1, condition));
    }

    function canGoThroughStarDoor(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 2, [PLAYER_TYPE, DOOR_TYPE, 0, 0, 0, 0, 0], errors);

        if (ok && variantForTokenID(tokenIDs[1]) != OPEN_VARIANT) { ok = false; errors[DOOR_IS_CLOSED] = true; }

        return (ok, errors);
    }

    function jumpIntoBeacon(uint256[] memory tokenIDs) external {
        (bool ok,) = canJumpIntoBeacon(tokenIDs); require(ok);

        uint8 beaconColor = color1ForTokenID(tokenIDs[1]);
        uint256 lensID = tokenIDs[2];

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(lensID);
        uint8 type_ = typeForTokenID(lensID);
        uint8 color1 = beaconColor;
        uint8 color2 = beaconColor;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canJumpIntoBeacon(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, BEACON_TYPE, LENS_TYPE, 0, 0, 0, 0], errors);
        return (ok, errors);
    }

    function jumpIntoEclipse(uint256[] memory tokenIDs) external {
        (bool ok,) = canJumpIntoEclipse(tokenIDs); require(ok);

        (uint8 series, uint8 puzzle) = randomPuzzle();
        uint8 tier = tierForTokenID(tokenIDs[0]);
        uint8 type_ = DOOR_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = OPEN_VARIANT;
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canJumpIntoEclipse(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 3, [PLAYER_TYPE, ECLIPSE_TYPE, DOOR_TYPE, 0, 0, 0, 0], errors);

        if (ok && variantForTokenID(tokenIDs[2]) == OPEN_VARIANT) { ok = false; errors[DOOR_IS_OPEN] = true; }

        return (ok, errors);
    }

    function puzzleMastery1(uint256[] memory tokenIDs) external {
        (bool ok,) = canPuzzleMastery1(tokenIDs); require(ok);

        uint256 artworkID1 = tokenIDs[0];

        uint8 series = seriesForTokenID(artworkID1);
        uint8 puzzle = puzzleForTokenID(artworkID1);
        uint8 tier = MASTER_TIER;
        uint8 type_ = STAR_TYPE;
        uint8 color1 = 1 + uint8(randomNumber() % NUM_COLORS);
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, STANDARD_EDITION));
    }

    function canPuzzleMastery1(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 2, [ARTWORK_TYPE, ARTWORK_TYPE, 0, 0, 0, 0, 0], errors);
        if (!ok) { return (false, errors); }

        uint256 artworkID1 = tokenIDs[0];
        uint256 artworkID2 = tokenIDs[1];

        bool samePuzzle = seriesForTokenID(artworkID1) == seriesForTokenID(artworkID2)
                       && puzzleForTokenID(artworkID1) == puzzleForTokenID(artworkID2);

        bool standardEdition = editionForTokenID(artworkID1) == STANDARD_EDITION
                            && editionForTokenID(artworkID2) == STANDARD_EDITION;

        if (!samePuzzle)           { ok = false; errors[PUZZLES_DONT_MATCH] = true; }
        if (!standardEdition)      { ok = false; errors[ART_ALREADY_SIGNED] = true; }
        if (doubleSpent(tokenIDs)) { ok = false; errors[SAME_CARD_USED_TWICE] = true; }

        return (ok, errors);
    }

    function puzzleMastery2(uint256[] memory tokenIDs) external {
        (bool ok,) = canPuzzleMastery2(tokenIDs); require(ok);

        uint256 starID = tokenIDs[randomNumber() % 7];

        uint8 series = seriesForTokenID(starID);
        uint8 puzzle = puzzleForTokenID(starID);
        uint8 tier = MASTER_TIER;
        uint8 type_ = ARTWORK_TYPE;
        uint8 color1 = 0;
        uint8 color2 = 0;
        uint8 variant = randomVariant(type_);
        uint8 condition = randomlyDegrade(tokenIDs, tier);
        uint8 edition = SIGNED_EDITION;

        bool allPristine = true;

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            allPristine = allPristine && conditionForTokenID(tokenIDs[i]) == PRISTINE_CONDITION;
        }

        if (allPristine) {
            condition = PRISTINE_CONDITION;

            uint16 editionsKey_ = editionsKey(series, puzzle);
            uint256 numOthers = limitedEditions[editionsKey_];

            if (numOthers < MAX_LIMITED_EDITIONS) {
                edition = LIMITED_EDITION;
                limitedEditions[editionsKey_] += 1;

                if (masterCopyClaimedAt[editionsKey_] == 0) {
                  uint256 shortenedOdds = MAX_LIMITED_EDITIONS - numOthers;

                  if (randomNumber() % shortenedOdds == 0) {
                    edition = MASTER_COPY_EDITION;
                    masterCopyClaimedAt[editionsKey_] = uint8(numOthers + 1);
                  }
                }
            }
        }

        replace(tokenIDs, Attributes(series, puzzle, tier, type_, color1, color2, variant, condition, edition));
    }

    function canPuzzleMastery2(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 7, [STAR_TYPE, STAR_TYPE, STAR_TYPE, STAR_TYPE, STAR_TYPE, STAR_TYPE, STAR_TYPE], errors);

        bool[8] memory colorsUsed = [false, false, false, false, false, false, false, false];

        for (uint8 i = 0; i < 7; i += 1) {
            uint8 color = color1ForTokenID(tokenIDs[i]);

            if (colorsUsed[color]) { ok = false; errors[STAR_COLOR_REPEATED] = true; }
            colorsUsed[color] = true;
        }

        return (ok, errors);
    }

    function discard2Pickup1(uint256[] memory tokenIDs) external {
        (bool ok,) = canDiscard2Pickup1(tokenIDs); require(ok);

        uint256 tokenID1 = tokenIDs[0];
        uint256 tokenID2 = tokenIDs[1];

        removeLimitedOrMasterEdition(tokenID1);
        removeLimitedOrMasterEdition(tokenID2);

        uint8 tier = tierForTokenID(tokenID1);
        uint8 condition = randomlyDegrade(tokenIDs, tier);

        replace(tokenIDs, starterCardForTier(tier, condition));
    }

    function canDiscard2Pickup1(uint256[] memory tokenIDs) public view returns (bool ok, bool[34] memory errors) {
        ok = basicChecksPassed(tokenIDs, 2, [ANY_TYPE, ANY_TYPE, 0, 0, 0, 0, 0], errors);

        if (ok && doubleSpent(tokenIDs)) { ok = false; errors[SAME_CARD_USED_TWICE] = true; }

        return (ok, errors);
    }

    // utilities

    function basicChecksPassed(uint256[] memory tokenIDs, uint8 numCards, uint8[7] memory types, bool[34] memory errors) private view returns (bool ok) {
        ok = true;

        uint256 length = tokenIDs.length;

        if (numCards != length) { ok = false; errors[NUM_CARDS_REQUIRED + length] = true; }

        if (!ownsAll(tokenIDs))           { ok = false; errors[DOESNT_OWN_CARDS] = true; }
        if (!ok)                          { return false; }

        uint8 tier = tierForTokenID(tokenIDs[0]);

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            bool tierOk = tier == tierForTokenID(tokenIDs[i]);

            uint8 type_ = typeForTokenID(tokenIDs[i]);
            uint8 expected = types[i];

            bool typeOk = expected == type_
                       || expected == ANY_TYPE
                       || expected == LENS_TYPE && (type_ == TORCH_TYPE || type_ == GLASSES_TYPE)
                       || expected == ACTIVATOR_TYPE && type_ <= CLOAK_TYPE;

            if (!tierOk) { ok = false; errors[TIERS_DONT_MATCH] = true; }
            if (!typeOk) { ok = false; errors[expected] = true; }
        }

        return ok;
    }

    function ownsAll(uint256[] memory tokenIDs) private view returns (bool) {
        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            if (balanceOf(msg.sender, tokenIDs[i]) == 0) { return false; }
        }

        return true;
    }

    function doubleSpent(uint256[] memory tokenIDs) private view returns (bool) {
        return tokenIDs[0] == tokenIDs[1] && balanceOf(msg.sender, tokenIDs[0]) < 2;
    }

    function cloakCanActivateSunOrMoon(uint256[] memory tokenIDs, bool[34] memory errors) private pure returns (bool ok) {
        ok = true;

        uint256 activatorID = tokenIDs[0];
        uint256 inactiveID = tokenIDs[1];

        bool cloakUsed = typeForTokenID(activatorID) == CLOAK_TYPE;
        bool colorsMatch = color1ForTokenID(activatorID) == color1ForTokenID(inactiveID);

        uint8 tier = tierForTokenID(inactiveID);
        bool inaccessible = tier == ETHEREAL_TIER || tier == GODLY_TIER;

        if (cloakUsed && !colorsMatch)  { ok = false; errors[CLOAK_DOESNT_MATCH] = true; }
        if (!cloakUsed && inaccessible) { ok = false; errors[CLOAK_REQUIRED_AT_TIER] = true; }

        return ok;
    }

    function removeLimitedOrMasterEdition(uint256 tokenID) private {
        uint8 edition = editionForTokenID(tokenID);

        if (edition >= LIMITED_EDITION) {
            uint16 editionsKey_ = editionsKey(seriesForTokenID(tokenID), puzzleForTokenID(tokenID));
            limitedEditions[editionsKey_] -= 1;

            if (edition == MASTER_COPY_EDITION) {
                masterCopyClaimedAt[editionsKey_] = 0;
            }
        }
    }

    function replace(uint256[] memory tokenIDs, Attributes memory newCard) private {
        uint256[] memory oneOfEach = new uint256[](tokenIDs.length);
        for (uint8 i = 0; i < tokenIDs.length; i += 1) { oneOfEach[i] = 1; totalSupply[tokenIDs[i]] -= 1; }
        _burnBatch(msg.sender, tokenIDs, oneOfEach);

        mintCard(newCard);
    }

    function mintCard(Attributes memory newCard) private {
        uint256 newCardID = tokenIDForCard(newCard);
        _mint(msg.sender, newCardID, 1, "");
        totalSupply[newCardID] += 1;
    }

    function unlockMintingAtTier(uint8 tier) private {
        if (tier > maxTierUnlocked[msg.sender]) {
            maxTierUnlocked[msg.sender] = tier;
        }
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
          (type_ == HELIX_TYPE && (tier == CELESTIAL_TIER || tier == GODLY_TIER)) ? color1 :
          1 + uint8(randomNumber() % NUM_COLORS);

        return (color1, color2);
    }

    function randomVariant(uint8 type_) private returns (uint8) {
        uint8 numVariants = NUM_VARIANTS_PER_TYPE[type_];
        uint8 variant = numVariants < 1 ? 0 : uint8(randomNumber() % numVariants);

        return variant;
    }

    function randomlyDegrade(uint256[] memory tokenIDs, uint8 tier) private returns (uint8) {
        uint8 worstCondition = PRISTINE_CONDITION;

        for (uint8 i = 0; i < tokenIDs.length; i += 1) {
            uint8 condition = conditionForTokenID(tokenIDs[i]);
            if (condition < worstCondition) { worstCondition = condition; }
        }

        return worstCondition == DIRE_CONDITION || tier == IMMORTAL_TIER || tier == GODLY_TIER
             ? worstCondition
             : worstCondition - uint8(randomNumber() % 2);
    }

    function pickRandom(uint256[] memory probabilities) private returns (uint8 index) {
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
    }

    function randomNumber() private returns (uint256) {
        return uint256(keccak256(abi.encode(block.timestamp, block.difficulty, NUM_RANDOM_CALLS++)));
    }

    // conversions

    function tokenIDForCard(Attributes memory card) private pure returns (uint256) {
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

    function seriesForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 64); }
    function puzzleForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 56); }
    function tierForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 48); }
    function typeForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 40); }
    function color1ForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 32); }
    function color2ForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 24); }
    function variantForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 16); }
    function conditionForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID >> 8); }
    function editionForTokenID(uint256 tokenID) private pure returns (uint8) { return uint8(tokenID); }

    function editionsKey(uint8 series, uint8 puzzle) private pure returns (uint16) {
        return (uint16(series) << 8) | puzzle;
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

    uint8 private constant ACTIVATOR_TYPE = 17;
    uint8 private constant LENS_TYPE = 18;
    uint8 private constant ANY_TYPE = 19;

    uint8 private constant NUM_CARDS_REQUIRED = 17;

    // TWO_CARDS_REQUIRED = NUM_CARDS_REQUIRED + 2 = 19
    // THREE_CARDS_REQUIRED = NUM_CARDS_REQUIRED + 3 = 20
    uint8 private constant TIERS_DONT_MATCH = 21;
    uint8 private constant DOESNT_OWN_CARDS = 22;
    uint8 private constant CLOAK_REQUIRED_AT_TIER = 23;
    // SEVEN_CARDS_REQUIRED = NUM_CARDS_REQUIRED + 7 = 24
    uint8 private constant CLOAK_DOESNT_MATCH = 25;
    uint8 private constant TELESCOPE_DOESNT_MATCH = 26;
    uint8 private constant TORCH_DOESNT_MATCH = 27;
    uint8 private constant PUZZLES_DONT_MATCH = 28;
    uint8 private constant DOOR_IS_OPEN = 29;
    uint8 private constant DOOR_IS_CLOSED = 30;
    uint8 private constant ART_ALREADY_SIGNED = 31;
    uint8 private constant SAME_CARD_USED_TWICE = 32;
    uint8 private constant STAR_COLOR_REPEATED = 33;

    uint8 private constant OPEN_VARIANT = 0; // Relative

    uint8 private constant DIRE_CONDITION = 0;
    uint8 private constant PRISTINE_CONDITION = 4;

    uint8 private constant STANDARD_EDITION = 0;
    uint8 private constant SIGNED_EDITION = 1;
    uint8 private constant LIMITED_EDITION = 2;
    uint8 private constant MASTER_COPY_EDITION = 3;

    uint8 private constant NUM_COLORS = 7;
    uint8 private constant MAX_LIMITED_EDITIONS = 151;

    uint8[] private NUM_PUZZLES_PER_SERIES = [2, 3];
    uint16[] private PUZZLE_OFFSET_PER_SERIES = [0, 2];
    uint8[] private NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 1, 2, 0, 0, 2, 0, 0, 0, 1, 0];
    uint8[] private NUM_VARIANTS_PER_TYPE = [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2];
    uint16[] private VARIANT_OFFSET_PER_TYPE = [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5];

    uint256[7] private MINT_PRICE_MULTIPLERS = [1, 2, 5, 10, 20, 50, 100];
    uint256 private UNLOCK_PRICE_MULTIPLIER = 10000;

    uint256[] private STANDARD_TYPE_PROBABILITIES = [300, 100, 100, 200, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] private VIRTUAL_TYPE_PROBABILITIES = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
    uint256[] private POST_VIRTUAL_TYPE_PROBABILITIES = [0, 1, 100, 200, 100, 100, 20, 20, 20, 10, 10, 0, 4, 6];
    uint256[] private MASTER_TYPE_PROBABILITIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

    address private PROXY_REGISTRY_ADDRESS;
    uint256 private NUM_RANDOM_CALLS = 0;

    // Be very careful not to invalidate existing cards when calling this method.
    // The arrays must be append only and not reorder or remove puzzles/variants.
    function updateConstants(
        uint8[] memory numPuzzlesPerSeries,
        uint16[] memory puzzleOffsetPerSeries,
        uint8[] memory numVariantsPerType,
        uint16[] memory variantOffsetPerType,
        uint256[7] memory mintPriceMultipliers,
        uint256 unlockPriceMultiplier,
        address proxyRegistryAddress,
        string memory metadataURI
    ) external onlyOwner {
        NUM_PUZZLES_PER_SERIES = numPuzzlesPerSeries;
        PUZZLE_OFFSET_PER_SERIES = puzzleOffsetPerSeries;
        NUM_VARIANTS_PER_TYPE = numVariantsPerType;
        VARIANT_OFFSET_PER_TYPE = variantOffsetPerType;
        MINT_PRICE_MULTIPLERS = mintPriceMultipliers;
        UNLOCK_PRICE_MULTIPLIER = unlockPriceMultiplier;
        PROXY_REGISTRY_ADDRESS = proxyRegistryAddress;
        _setURI(metadataURI);
    }

    function setBasePrice(uint256 _basePriceInWei) external onlyOwner {
        basePriceInWei = _basePriceInWei;
    }
}
