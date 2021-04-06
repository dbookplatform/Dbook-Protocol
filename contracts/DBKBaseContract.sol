// SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

//interface for checking loss with api consumer
interface IDBKAPI {
    function checkUpdateTime() external view returns(uint256);
    function checkLoss() external view returns(bool);    
}

//interact with an oracle in order to unlock funds at a % set by the controller role
contract DBKBaseContract is Initializable, ReentrancyGuardUpgradeable, AccessControlUpgradeable {		
    using SafeMathUpgradeable for uint256;

    // Setting the admin role
    bytes32 public CONTROLLER_ROLE;
    bytes32 public BASE_ADMIN_ROLE;

    // State Variables
    uint256 public percentageCap;
    uint256 public percentageDivisor;
    uint256 public withdrawLength;
    uint256 public lastWithdraw;

    //events
    event PercentageCapChanged(uint256 percent);
    event WithdrawLengthChanged(uint256 length_in_days);
    event baseAdminAdded(address newAdmin);
    event controllerAdded(address newController);
    event DBKAPIUpdated(address DBKAPI);

    //DBK API
    IDBKAPI public DBKAPI;

	function initialize () public initializer {
        __Context_init();
        __AccessControl_init();
            
        CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");
        BASE_ADMIN_ROLE = keccak256("BASE_ADMIN_ROLE");
        
        lastWithdraw = 0;
        percentageCap = 500; // 50%
        percentageDivisor = 1000;// 100%
        withdrawLength = 7 days;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(CONTROLLER_ROLE, _msgSender());
        _setupRole(BASE_ADMIN_ROLE, _msgSender());
    }

    /* 
    * This function naively assumes that the caller utilizes the correct decimal format
    */
    function withdrawFunds(address _tokenToWithdraw, uint256 _amount) public onlyBaseAdmin{
        IERC20Upgradeable token = IERC20Upgradeable(_tokenToWithdraw);

        require(block.timestamp >= lastWithdraw.add(withdrawLength), "DBKBaseContract: Time has not advanced enough since the last withdraw!");
        require(checkLoss(), "DBKBaseContract: No Loss for the operation found!");
        require(token.balanceOf(address(this)) > 100000, "DBKBaseContract: Insufficient balance for this token!");
        require(_amount <= (token.balanceOf(address(this)).mul(percentageCap)).div(percentageDivisor), "DBKBaseContract: Attempting to withdraw more than the percentage allowed");

        //transfer the given token to the admin that requested
        token.transfer(_msgSender(), _amount);

        lastWithdraw = block.timestamp;
    }


    function checkLoss() internal view returns(bool) {
        // require that the updated timestamp has occured within the last 48 hours to prevent
        // withdrawal week to week without checking
        if(block.timestamp >= DBKAPI.checkUpdateTime() + 1 days){
            return false;
        }

        return (DBKAPI.checkLoss());
    }

    // format 5 => .5% , 50 => 5%, 500 => 50%, 1000 => 100%
    function changePercentageCap(uint256 _percentageCap) public onlyController {
        require(percentageCap <= percentageDivisor, "DBKBaseContract: Percentage given is too large!");
        percentageCap = _percentageCap;

        emit PercentageCapChanged(_percentageCap);
    }

    // changes the required length of time between withdraws
    function changeWithdrawLength(uint256 _days) public onlyController{
        withdrawLength = _days.mul(1 days);

        emit WithdrawLengthChanged(_days);
    }

    function setDBKAPIConsumer(address _DBKAPI) external onlyBaseAdmin {
        DBKAPI = IDBKAPI(_DBKAPI);

        emit DBKAPIUpdated(_DBKAPI);
    }

    function addController(address _address) public onlyDefaultAdmin {
        _setupRole(CONTROLLER_ROLE, _address);
        emit controllerAdded(_address);
    }


    function addBaseAdmin(address _address) public onlyDefaultAdmin {
        _setupRole(BASE_ADMIN_ROLE, _address);
        emit baseAdminAdded(_address);
    }


    modifier onlyBaseAdmin() {
        require(hasRole(BASE_ADMIN_ROLE, _msgSender()), "DBKBaseContract: must have role to use this function");  
        _;
    }

    modifier onlyController() {
        require(hasRole(CONTROLLER_ROLE, _msgSender()), "DBKBaseContract: must have role to use this function");  
        _;
    }

    modifier onlyDefaultAdmin() {
       require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "DBKBaseContract: must have role to use this function");  
        _;
    }


    uint256[49] private __gap;


}