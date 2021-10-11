// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./PuzzleCard.sol";

library Conversion {
    function tokenID(PuzzleCard.Instance memory card) internal pure returns (uint256) {
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

    function card(uint256 tokenID) internal pure returns (PuzzleCard.Instance memory) {
        uint8 series    = uint8(tokenID >> 64);
        uint8 puzzle    = uint8(tokenID >> 56);
        uint8 tier      = uint8(tokenID >> 48);
        uint8 type_     = uint8(tokenID >> 40);
        uint8 color1    = uint8(tokenID >> 32);
        uint8 color2    = uint8(tokenID >> 24);
        uint8 variant   = uint8(tokenID >> 16);
        uint8 condition = uint8(tokenID >> 8);
        uint8 edition   = uint8(tokenID);

        return PuzzleCard.Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }
}
