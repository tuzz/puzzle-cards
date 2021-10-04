// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    string[] private COLOR_NAMES = ["red", "green", "blue", "yellow", "pink", "white", "black"];
    uint256[] private COLOR_PROBABILITIES = [16, 16, 16, 16, 16, 16, 4];

    string[] private VARIANT_NAMES = ["sun", "moon"];
    uint256[] private VARIANT_PROBABILITIES = [667, 333];

    uint256 private currentPriceToMint;
    string private currentBaseTokenURI;

    mapping(uint256 => Attributes) cardAttributes;

    struct Attributes {
        uint8 color;
        uint8 variant;
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
        return string(abi.encodePacked(colorName(tokenID), "-", variantName(tokenID)));
    }

    function colorName(uint256 tokenID) public view returns (string memory) {
        return COLOR_NAMES[cardAttributes[tokenID].color];
    }

    function variantName(uint256 tokenID) public view returns (string memory) {
        return VARIANT_NAMES[cardAttributes[tokenID].variant];
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
        uint256 tokenID = getNextTokenId();

        cardAttributes[tokenID] = Attributes(
            pickRandom(0, COLOR_PROBABILITIES),
            pickRandom(1, VARIANT_PROBABILITIES)
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
