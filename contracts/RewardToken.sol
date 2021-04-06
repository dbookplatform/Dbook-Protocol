// SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <=0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";


contract RewardToken is Initializable, ERC20Upgradeable{
	function initialize() public virtual initializer{
    	__ERC20_init_unchained("ReWarD", "RWD");
    	_mint(_msgSender(), 1_000_000 * 1e18);
  }
}