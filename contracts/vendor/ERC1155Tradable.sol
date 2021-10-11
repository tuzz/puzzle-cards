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
  address proxyRegistryAddress;
  mapping (uint256 => uint256) internal tokenSupply;
  string public name;
  string public symbol;

  constructor(string memory _name, string memory _symbol, address _proxyRegistryAddress) ERC1155("") {
      name = _name;
      symbol = _symbol;
      proxyRegistryAddress = _proxyRegistryAddress;
      _initializeEIP712(name);
  }

  function totalSupply(uint256 _id) public view returns (uint256) {
      return tokenSupply[_id];
  }

  function mint(address _to, uint256 _id, uint256 _quantity, bytes memory _data) virtual internal {
      _mint(_to, _id, _quantity, _data);
      tokenSupply[_id] += _quantity;
  }

  function batchMint(address _to, uint256[] memory _ids, uint256[] memory _quantities, bytes memory _data) internal {
      for (uint256 i = 0; i < _ids.length; i++) {
        uint256 _id = _ids[i];
        uint256 quantity = _quantities[i];
        tokenSupply[_id] += quantity;
      }

      _mintBatch(_to, _ids, _quantities, _data);
  }

  function batchBurn(address _to, uint256[] memory _ids, uint256[] memory _quantities) internal {
      for (uint256 i = 0; i < _ids.length; i++) {
        uint256 _id = _ids[i];
        uint256 quantity = _quantities[i];
        tokenSupply[_id] -= quantity;
      }

      _burnBatch(_to, _ids, _quantities);
  }

  // Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
  function isApprovedForAll(address _owner, address _operator) override public view returns (bool isOperator) {
      ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);

      if (address(proxyRegistry.proxies(_owner)) == _operator) { return true; }

      return ERC1155.isApprovedForAll(_owner, _operator);
  }

  function _exists(uint256 _id) internal view returns (bool) {
      return tokenSupply[_id] != 0;
  }

  function exists(uint256 _id) external view returns (bool) {
      return _exists(_id);
  }

  function _msgSender() internal override view returns (address sender) {
      return ContextMixin.msgSender();
  }
}
