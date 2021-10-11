// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../PuzzleCard.sol";

library Conversion {
    function tokenID(PuzzleCard.Instance memory card_) internal pure returns (uint256) {
        return (
            uint256(card_.series)    << 64 |
            uint256(card_.puzzle)    << 56 |
            uint256(card_.tier)      << 48 |
            uint256(card_.type_)     << 40 |
            uint256(card_.color1)    << 32 |
            uint256(card_.color2)    << 24 |
            uint256(card_.variant)   << 16 |
            uint256(card_.condition) << 8  |
            uint256(card_.edition)
        );
    }

    function card(uint256 tokenID_) internal pure returns (PuzzleCard.Instance memory) {
        uint8 series    = uint8(tokenID_ >> 64);
        uint8 puzzle    = uint8(tokenID_ >> 56);
        uint8 tier      = uint8(tokenID_ >> 48);
        uint8 type_     = uint8(tokenID_ >> 40);
        uint8 color1    = uint8(tokenID_ >> 32);
        uint8 color2    = uint8(tokenID_ >> 24);
        uint8 variant   = uint8(tokenID_ >> 16);
        uint8 condition = uint8(tokenID_ >> 8);
        uint8 edition   = uint8(tokenID_);

        return PuzzleCard.Instance(series, puzzle, tier, type_, color1, color2, variant, condition, edition);
    }
}
