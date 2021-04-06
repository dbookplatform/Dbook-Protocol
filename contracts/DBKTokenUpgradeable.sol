// SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <=0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";



/**
 * @title DBKToken ERC20 token
 * @dev This is the base token to allow for staking and trading 
 *      on returns and profits from the dbookplatform.
 *
 *  This Token Contract was inspired by the following open-source projects:
 *
 *  https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts-upgradeable/master/contracts/presets/ERC20PresetMinterPauserUpgradeable.sol
 *      
 */
contract DBKTokenUpgradeable is Initializable, ERC20CappedUpgradeable, OwnableUpgradeable, AccessControlUpgradeable{
  function initialize() public virtual initializer{
    __DBKToken_init();
  }

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  
  function __DBKToken_init() internal initializer {
    __Context_init_unchained();
    __AccessControl_init_unchained();
    __ERC20_init_unchained("Dbook", "DBK");
    __ERC20Capped_init_unchained(10_000 * 1e18);
    __DBKToken_init_unchained();
  }  

  function __DBKToken_init_unchained() internal initializer{
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

    _setupRole(MINTER_ROLE, _msgSender());
  }

  using SafeMathUpgradeable for uint256;
  
  


  /**
 * @dev Returns true if the given address has MINTER_ROLE.
 *
 * Requirements:
 *
 * - the caller must have the `MINTER_ROLE`.
 */
  function isMinter(address _address) public view returns(bool){
    return hasRole(MINTER_ROLE, _address);
  }

  function addMinter(address _address) public {
      require(hasRole(0x00, _msgSender()),"DBKToken: must have DEFAULT_ADMIN_ROLE");
      grantRole(MINTER_ROLE, _address);
  } 
    
  /**
   * @dev Creates `amount` new tokens for `to`.
   *
   * See {ERC20-_mint}.
   *
   * Requirements:
   *
   * - the caller must have the `MINTER_ROLE`.
   */
  function mint(address to, uint256 amount) public virtual returns(bool){
      require(hasRole(MINTER_ROLE, _msgSender()), "DBKToken: must have minter role to mint");
      _mint(to, amount);
      return true;
  }

  uint256[49] private __gap;

}
