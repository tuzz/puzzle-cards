// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../contracts/PuzzleCard.sol";

contract TestUtils is PuzzleCard {
    constructor(address proxyAddress) PuzzleCard(proxyAddress) {
        setBaseTokenURI("https://example.com/api/");
    }

    function mintExact(uint8 series, uint8 puzzle, uint8 tier, uint8 type_, uint8 color1, uint8 color2, uint8 variant, uint8 condition, address to) public onlyOwner {
        cards[getNextTokenId()] = Attributes(
          series, puzzle, tier, type_, color1, color2, variant, condition
        );

        mintTo(to);
    }
}
