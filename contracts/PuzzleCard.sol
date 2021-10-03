// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    string[] private COLOR_NAMES = ["red", "green", "blue", "yellow", "pink", "white", "black"];
    uint256[] private COLOR_PROBABILITIES = [16, 16, 16, 16, 16, 16, 4];

    string[] private VARIANT_NAMES = ["sun", "moon"];
    uint256[] private VARIANT_PROBABILITIES = [667, 333];

    string private currentBaseTokenURI;
    mapping(uint256 => Attributes) cardAttributes;

    struct Attributes {
        uint8 color;
        uint8 variant;
    }

    constructor(address proxyAddress) ERC721Tradable("PuzzleCard", "WSUN", proxyAddress) {
        setBaseTokenURI("https://4cc8-2a02-6b6c-60-0-cdb2-1b9f-aa0f-454f.ngrok.io/api/");
    }

    function tokenURI(uint256 tokenID) override public view returns (string memory) {
        return string(abi.encodePacked(baseTokenURI(), slug(tokenID), ".json"));
    }

    function baseTokenURI() override public view returns (string memory) {
        return currentBaseTokenURI;
    }

    function setBaseTokenURI(string memory newURI) public onlyOwner {
        currentBaseTokenURI = newURI;
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

    function mintOne(address to) public onlyOwner {
        uint256 tokenID = getNextTokenId();

        cardAttributes[tokenID] = Attributes(
            pickRandom(0, COLOR_PROBABILITIES),
            pickRandom(1, VARIANT_PROBABILITIES)
        );

        mintTo(to);
    }

    function mintMany(address to, uint256 numberToMint) public onlyOwner {
        for (uint i = 0; i < numberToMint; i += 1) { mintOne(to); }
    }

    // private

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
