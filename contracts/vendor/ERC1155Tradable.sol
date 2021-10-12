// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./ContentMixin.sol";
import "./NativeMetaTransaction.sol";

contract OwnableDelegateProxy { }

contract ProxyRegistry {
  mapping(address => OwnableDelegateProxy) public proxies;
}

contract ERC1155Tradable is ContextMixin, ERC1155, NativeMetaTransaction, Ownable {
  string public name;
  string public symbol;
  address private proxyRegistryAddress;

  mapping (uint256 => uint256) internal tokenSupply;

  constructor(string memory _name, string memory _symbol, address _proxyRegistryAddress) ERC1155("") {
      name = _name;
      symbol = _symbol;
      proxyRegistryAddress = _proxyRegistryAddress;
      _initializeEIP712(name);
  }

  function totalSupply(uint256 tokenID) external view returns (uint256) {
      return tokenSupply[tokenID];
  }

  function mintOne(uint256 tokenID, address _to) internal {
      tokenSupply[tokenID] += 1;
      _mint(_to, tokenID, 1, "");
  }

  function mintOneOfEach(uint256[] memory tokenIDs, address _to) internal {
      uint256[] memory quantities = new uint256[](tokenIDs.length);

      for (uint256 i = 0; i < tokenIDs.length; i += 1) {
          quantities[i] = 1;
          tokenSupply[tokenIDs[i]] += 1;
      }

      _mintBatch(_to, tokenIDs, quantities, "");
  }

  function burnOneOfEach(uint256[] memory tokenIDs, address _from) internal {
      uint256[] memory quantities = new uint256[](tokenIDs.length);

      for (uint256 i = 0; i < tokenIDs.length; i += 1) {
          quantities[i] = 1;
          tokenSupply[tokenIDs[i]] -= 1;
      }

      _burnBatch(_from, tokenIDs, quantities);
  }

  // Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
  function isApprovedForAll(address _owner, address _operator) override public view returns (bool isOperator) {
      ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);

      if (address(proxyRegistry.proxies(_owner)) == _operator) { return true; }

      return ERC1155.isApprovedForAll(_owner, _operator);
  }

  function exists(uint256 _id) external view returns (bool) {
      return tokenSupply[_id] != 0;
  }

  function _msgSender() internal override view returns (address sender) {
      return ContextMixin.msgSender();
  }
}
