// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    constructor(address _proxyRegistryAddress) ERC721Tradable("PuzzleCard", "CARD", _proxyRegistryAddress) {}

    function baseTokenURI() override public pure returns (string memory) {
        return "https://example.com/api";
    }
}
