// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./vendor/ERC721Tradable.sol";

contract PuzzleCard is ERC721Tradable {
    string private currentBaseTokenURI;

    constructor(address proxyAddress) ERC721Tradable("PuzzleCard", "CARD", proxyAddress) {
        setBaseTokenURI("https://cd6c-2a02-6b6c-60-0-cdb2-1b9f-aa0f-454f.ngrok.io/api/");
    }

    function baseTokenURI() override public view returns (string memory) {
        return currentBaseTokenURI;
    }

    function setBaseTokenURI(string memory newURI) public onlyOwner {
        currentBaseTokenURI = newURI;
    }

    function tokenURI(uint256 tokenID) override public view returns (string memory) {
        return string(abi.encodePacked(baseTokenURI(), "foo"));
    }
}
