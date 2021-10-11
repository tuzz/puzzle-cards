// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../contracts/PuzzleCard.sol";
import "../contracts/mixins/Conversion.sol";

contract TestUtils is PuzzleCard {
    using Conversion for Instance;

    constructor(address proxyAddress) PuzzleCard(proxyAddress) {
        setMetadataURI("https://example.com/api/{}.json");
    }

    function mintExact(uint8 series, uint8 puzzle, uint8 tier, uint8 type_, uint8 color1, uint8 color2, uint8 variant, uint8 condition, uint8 edition, address to) public onlyOwner {
        mintOne(Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition).tokenID(), to);
    }
}
