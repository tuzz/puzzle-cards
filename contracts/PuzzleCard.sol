// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    string[] public seriesNames = ["None", "Teamwork"];
    string[] public puzzleNames = ["Trial of Skill", "Trial of Reign", "1", "2", "3"];
    string[] public tierNames = ["Mortal", "Immortal", "Ethereal", "Virtual", "Celestial", "Godly", "Master"];
    string[] public typeNames = ["Player", "Crab", "Inactive", "Active", "Cloak", "Telescope", "Helix", "Torch", "Beacon", "Map", "Teleport", "Glasses", "Eclipse", "Door", "Hidden", "Artwork", "Star"];
    string[] public colorNames = ["None", "Yellow", "Black", "Green", "White", "Blue", "Red", "Pink"];
    string[] public variantNames = ["None", "Sun", "Moon", "Open", "Closed"];
    string[] public conditionNames = ["Dire", "Poor", "Reasonable", "Excellent", "Pristine"];

    uint8 public numSeries = 2;
    uint8 public numColors = 7;
    uint8 public numConditions = 5;

    uint8[] public numPuzzlesPerSeries = [2, 3];
    uint16[] public puzzleOffsetPerSeries = [0, 2];
    uint8[] public numColorSlotsPerType = [0, 0, 1, 1, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 0, 1];
    uint8[] public numVariantsPerType = [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];
    uint8[] public variantOffsetPerType = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];

    uint256[] public tierProbabilities = [90, 10];
    uint256[] public typeProbabilities = [200, 200, 200, 100, 100, 100, 20, 20, 20, 10, 10, 10, 4, 6];
    uint256[] public conditionProbabilities = [80, 20];

    uint256 public currentPriceToMint;
    string public currentBaseTokenURI;

    mapping(uint256 => Attributes) public cardAttributes;

    struct Attributes {
        uint8 series;
        uint8 puzzle;
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
          dasherize(lowercase(seriesName(tokenID))), "-",
          dasherize(lowercase(puzzleName(tokenID))), "-",
          dasherize(lowercase(tierName(tokenID))), "-",
          dasherize(lowercase(typeName(tokenID))), "-",
          dasherize(lowercase(color1Name(tokenID))), "-",
          dasherize(lowercase(color2Name(tokenID))), "-",
          dasherize(lowercase(variantName(tokenID))), "-",
          dasherize(lowercase(conditionName(tokenID)))
        ));
    }

    function seriesName(uint256 tokenID) public view returns (string memory) {
        return seriesNames[cardAttributes[tokenID].series];
    }

    function puzzleName(uint256 tokenID) public view returns (string memory) {
        Attributes memory attr = cardAttributes[tokenID];
        return puzzleNames[puzzleOffsetPerSeries[attr.series] + attr.puzzle];
    }

    function tierName(uint256 tokenID) public view returns (string memory) {
        return tierNames[cardAttributes[tokenID].tier];
    }

    function typeName(uint256 tokenID) public view returns (string memory) {
        return typeNames[cardAttributes[tokenID].type_];
    }

    function color1Name(uint256 tokenID) public view returns (string memory) {
        return colorNames[cardAttributes[tokenID].color1];
    }

    function color2Name(uint256 tokenID) public view returns (string memory) {
        return colorNames[cardAttributes[tokenID].color2];
    }

    function variantName(uint256 tokenID) public view returns (string memory) {
        Attributes memory attr = cardAttributes[tokenID];
        return variantNames[variantOffsetPerType[attr.type_] + attr.variant];
    }

    function conditionName(uint256 tokenID) public view returns (string memory) {
        return conditionNames[cardAttributes[tokenID].condition];
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
        uint8 series = uint8(randomNumber(0) % numSeries);

        uint8 numPuzzles = numPuzzlesPerSeries[series];
        uint8 puzzle = uint8(randomNumber(1) % numPuzzles);

        uint8 tier = pickRandom(2, tierProbabilities);
        uint8 type_ = pickRandom(3, typeProbabilities);

        uint8 numSlots = numColorSlotsPerType[type_];
        uint8 color1 = numSlots < 1 ? 0 : 1 + uint8(randomNumber(4) % numColors);
        uint8 color2 = numSlots < 2 ? 0 : 1 + uint8(randomNumber(5) % numColors);

        uint8 numVariants = numVariantsPerType[type_];
        uint8 variant = numVariants < 1 ? 0 : uint8(randomNumber(6) % numVariants);

        uint8 pristine = numConditions - 1;
        uint8 condition = pristine - pickRandom(7, conditionProbabilities);

        cardAttributes[getNextTokenId()] = Attributes(
          series, puzzle, tier, type_, color1, color2, variant, condition
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

    function dasherize(string memory string_) internal pure returns (string memory) {
        bytes memory bytes_ = bytes(string_);

        for (uint256 i = 0; i < bytes_.length; i += 1) {
            if (bytes_[i] == ASCII_SPACE) {
                bytes_[i] = ASCII_DASH;
            }
        }

        return string(bytes_);
    }

    function lowercase(string memory string_) internal pure returns (string memory) {
        bytes memory bytes_ = bytes(string_);

        for (uint256 i = 0; i < bytes_.length; i += 1) {
            bytes1 b = bytes_[i];

            if (b >= ASCII_CAPITAL_A && b <= ASCII_CAPITAL_Z) {
                bytes_[i] = bytes1(uint8(bytes_[i]) + ASCII_TO_LOWERCASE);
            }
        }

        return string(bytes_);
    }

    bytes1 constant ASCII_SPACE = 0x20;
    bytes1 constant ASCII_DASH = 0x2D;
    bytes1 constant ASCII_CAPITAL_A = 0x41;
    bytes1 constant ASCII_CAPITAL_Z = 0x5A;
    uint8 constant ASCII_TO_LOWERCASE = 32;
}
