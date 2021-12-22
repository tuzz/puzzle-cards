// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../contracts/PuzzleCard.sol";

contract TestUtils is PuzzleCard {
    constructor(address proxyAddress) PuzzleCard(proxyAddress) {
        MINTING_CARDS_ENABLED = true;
    }

    function mintExact(uint256 tokenID, address to) public onlyOwner {
        _mint(to, tokenID, 1, "");
        totalSupply[tokenID] += 1;
    }
}
