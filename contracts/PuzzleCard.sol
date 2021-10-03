// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    constructor(address _proxyRegistryAddress) ERC721Tradable("PuzzleCard", "CARD", _proxyRegistryAddress) {}

    function baseTokenURI() override public pure returns (string memory) {
        return "https://cd6c-2a02-6b6c-60-0-cdb2-1b9f-aa0f-454f.ngrok.io/api/";
    }
}
