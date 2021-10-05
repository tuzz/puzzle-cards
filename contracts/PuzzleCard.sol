// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    string[] private TIER_NAMES = ["mortal", "immortal", "ethereal", "virtual", "celestial", "godly", "master"];
    string[] private TYPE_NAMES = ["player", "crab", "inactive", "active", "cloak", "telescope", "helix", "torch", "beacon", "map", "teleport", "glasses", "eclipse", "door", "hidden", "artwork", "star"];
    string[] private COLOR_NAMES = ["none", "yellow", "black", "green", "white", "blue", "red", "pink"];
    string[] private VARIANT_NAMES = ["none", "sun", "moon", "open", "closed"];
    string[] private CONDITION_NAMES = ["dire", "poor", "reasonable", "excellent", "pristine"];

    uint8 constant NUM_COLORS = 7;
    uint8 constant NUM_CONDITIONS = 5;
    uint8[] private NUM_COLOR_SLOTS_PER_TYPE = [0, 0, 1, 1, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 0, 1];
    uint8[] private NUM_VARIANTS_PER_TYPE = [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];
    uint8[] private VARIANT_OFFSET_PER_TYPE = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];

    uint256[] private TIER_PROBABILITIES = [90, 10];
    uint256[] private TYPE_PROBABILITIES = [200, 200, 200, 100, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] private CONDITION_PROBABILITIES = [80, 20];

    uint256 private currentPriceToMint;
    string private currentBaseTokenURI;

    mapping(uint256 => Attributes) cardAttributes;

    struct Attributes {
        uint8 tier;
        uint8 type_;
        uint8 color1;
        uint8 color2;
        uint8 variant;
        uint8 condition;
    }

    constructor(address proxyAddress) ERC721Tradable("PuzzleCard", "WSUN", proxyAddress) {
        setPriceToMint(uint256(0.1 * 0.7883 * 1000000000000000000)); // $0.10 in Polygon Wei.
        setBaseTokenURI("https://4cc8-2a02-6b6c-60-0-cdb2-1b9f-aa0f-454f.ngrok.io/api/");
    }

    // public methods

    function mint(uint256 numberToMint, address to) public payable {
        uint256 price = priceToMint(numberToMint);

        require(msg.value >= price, "please provide payment to mint the puzzle cards");
        require(numberToMint >= 1, "please mint at least one puzzle card");
        require(numberToMint <= 100, "please mint at most one hundred puzzle cards");

        payable(owner()).transfer(price);

        for (uint i = 0; i < numberToMint; i += 1) {
            mintRandomCard(to);
        }
    }

    function combine(uint256[] memory tokenIDs) public {
      require(tokenIDs.length >= 2, "please combine at least two puzzle cards");
      require(tokenIDs.length <= 4, "please combine at most four puzzle cards");

      for (uint i = 0; i < tokenIDs.length; i += 1) {
        require(ownerOf(tokenIDs[i]) == msg.sender, "please ensure you own all the puzzle cards");
        _burn(tokenIDs[i]);
      }

      mintRandomCard(msg.sender);
    }

    function priceToMint(uint256 numberOfCards) public view returns (uint256) {
        return currentPriceToMint * numberOfCards;
    }

    function baseTokenURI() override public view returns (string memory) {
        return currentBaseTokenURI;
    }

    function tokenURI(uint256 tokenID) override public view returns (string memory) {
        return string(abi.encodePacked(baseTokenURI(), slug(tokenID), ".json"));
    }

    function slug(uint256 tokenID) public view returns (string memory) {
        return string(abi.encodePacked(
          tierName(tokenID), "-",
          typeName(tokenID), "-",
          color1Name(tokenID), "-",
          color2Name(tokenID), "-",
          variantName(tokenID), "-",
          conditionName(tokenID)
        ));
    }

    function tierName(uint256 tokenID) public view returns (string memory) {
        return TIER_NAMES[cardAttributes[tokenID].tier];
    }

    function typeName(uint256 tokenID) public view returns (string memory) {
        return TYPE_NAMES[cardAttributes[tokenID].type_];
    }

    function color1Name(uint256 tokenID) public view returns (string memory) {
        return COLOR_NAMES[cardAttributes[tokenID].color1];
    }

    function color2Name(uint256 tokenID) public view returns (string memory) {
        return COLOR_NAMES[cardAttributes[tokenID].color2];
    }

    function variantName(uint256 tokenID) public view returns (string memory) {
        return VARIANT_NAMES[cardAttributes[tokenID].variant];
    }

    function conditionName(uint256 tokenID) public view returns (string memory) {
        return CONDITION_NAMES[cardAttributes[tokenID].condition];
    }

    // onlyOwner methods

    function gift(uint256 numberToGift, address to) public onlyOwner {
        for (uint i = 0; i < numberToGift; i += 1) {
            mintRandomCard(to);
        }
    }

    function setPriceToMint(uint256 newPrice) public onlyOwner {
        currentPriceToMint = newPrice;
    }

    function setBaseTokenURI(string memory newURI) public onlyOwner {
        currentBaseTokenURI = newURI;
    }

    // internal methods

    function mintRandomCard(address to) internal {
        uint8 tier = pickRandom(0, TIER_PROBABILITIES);
        uint8 type_ = pickRandom(1, TYPE_PROBABILITIES);

        uint8 numSlots = NUM_COLOR_SLOTS_PER_TYPE[type_];
        uint8 color1 = numSlots < 1 ? 0 : 1 + uint8(randomNumber(3) % NUM_COLORS);
        uint8 color2 = numSlots < 2 ? 0 : 1 + uint8(randomNumber(4) % NUM_COLORS);

        uint8 numVariants = NUM_VARIANTS_PER_TYPE[type_];
        uint8 indexOffset = VARIANT_OFFSET_PER_TYPE[type_];
        uint8 variant = numVariants < 1 ? 0 : indexOffset + uint8(randomNumber(5) % numVariants);

        uint8 pristine = NUM_CONDITIONS - 1;
        uint8 condition = pristine - pickRandom(2, CONDITION_PROBABILITIES);

        cardAttributes[getNextTokenId()] = Attributes(
          tier, type_, color1, color2, variant, condition
        );

        mintTo(to);
    }

    function pickRandom(uint256 callCount, uint256[] memory probabilities) internal view returns (uint8) {
        uint256 cumulative = 0;
        for (uint8 i = 0; i < probabilities.length; i += 1) {
            cumulative += probabilities[i];
        }

        uint256 random = randomNumber(callCount) % cumulative;

        uint256 total = 0;
        for (uint8 i = 0; i < probabilities.length; i += 1) {
          total += probabilities[i];
          if (random < total) { return i; }
        }

        return 255; // Unreachable.
    }

    function randomNumber(uint256 callCount) internal view returns (uint256) {
        return uint256(keccak256(abi.encode(
            block.timestamp,
            block.difficulty,
            proxyRegistryAddress,
            currentBaseTokenURI,
            getNextTokenId(),
            callCount
        )));
    }
}
