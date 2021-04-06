// // SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <=0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

interface IDBKToken is IERC20Upgradeable {
    function mint(address to, uint256 amount) external returns (bool);
}


contract DBKCrowdsale is Initializable, PausableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMathUpgradeable for uint256;
	  using SafeERC20Upgradeable for IERC20Upgradeable;

    // Setting the admin role
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Cap on tokens to sell, since rate will be variable
    uint256 public cap;

    // Amount of tokens sold
    uint256 public tokensSold;

    //Stablecoin to convert to
    IERC20Upgradeable public stablecoin;

    //Stablecoin to convert to
    IDBKToken public DBK;

    //tokens per stablecoin
    uint256 public rate;

    //place to receive stable coin funds
    address public wallet;

    //total raised
    uint256 public amountRaised;

    event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event RateChange(uint256 rate);
    event CapChange(uint256 rate);
    event PaymentTokenChanged(address token);
    event adminAdded(address admin);
    event AdminRescueTokens(address token, address recipient, uint256 amount);

    function initialize (uint256 _rate, address payable _wallet, address _DBK, address _admin, uint256 _cap, address _stablecoin) public initializer {
        __Pausable_init();
        __AccessControl_init();

        require(_rate > 0, "DBKCrowdsale: rate is 0");
        require(_wallet != address(0), "DBKCrowdsale: wallet is the zero address");
        require(_DBK != address(0), "DBKCrowdsale: address is the zero address");
        require(_stablecoin != address(0), "DBKCrowdsale: address is the zero address");
        require(_admin != address(0), "DBKCrowdsale: address is the zero address");

        //set the cap for the crowdsale (maximum sold DBK)
        cap = _cap;

        //rate : number of tokens per stable coin
        //1:1 -> 1e6 = 1e18, therefore 1e12 tokens per stablecoin if 1:1        
        rate = _rate; //token/stablecoin

        //where funds are forwarded
       	wallet = _wallet;

       	//set DBK token
       	DBK = IDBKToken(_DBK);

       	//set payment token
       	stablecoin = IERC20Upgradeable(_stablecoin);

       	//setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _admin);
    }

    
    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer funds with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    receive () external payable {
        revert("DBKStableCoinCrowdsale: Doese not accept ETH");
    }


    /**
     * @return the token being sold.
     */
    function token() public view returns (IDBKToken) {
        return DBK;
    }

    // *
    //  * @dev low level token purchase ***DO NOT OVERRIDE***
    //  * This function has a non-reentrancy guard, so it shouldn't be called by
    //  * another `nonReentrant` function.
    //  * @param beneficiary Recipient of the token purchase
    //  * @param coinAmount Amount of stablecoin to convert to DBK
     
    function buyTokens(address beneficiary, uint256 coinAmount) public nonReentrant whenNotPaused {
        _preValidatePurchase(beneficiary, coinAmount);

        // calculate token amount to be created
        uint256 tokensForBeneficiary = _getTokenAmount(coinAmount);

        // update state
        amountRaised = amountRaised.add(coinAmount);

        _processPurchase(beneficiary, tokensForBeneficiary);
        emit TokensPurchased(_msgSender(), beneficiary, coinAmount, tokensForBeneficiary);

        //forward stablecoin
        _forwardFunds(coinAmount);
        
    }


    /**
     * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met.
     * Use `super` in contracts that inherit from Crowdsale to extend their validations.
     * Example from CappedCrowdsale.sol's _preValidatePurchase method:
     *     super._preValidatePurchase(beneficiary, weiAmount);
     *     require(weiRaised().add(weiAmount) <= cap);
     * @param beneficiary Address performing the token purchase
     * @param coinAmount Value in coin to spend in the purchase
     */
    function _preValidatePurchase(address beneficiary, uint256 coinAmount) internal virtual view {
        require(beneficiary != address(0), "DBKCrowdsale: beneficiary is the zero address");
        require(coinAmount != 0, "DBKCrowdsale: coinAmount is 0");
        require(stablecoin.allowance(_msgSender(),address(this)) >= coinAmount, "DBKStablecoin: Crowdsale must be approved for this stablecoin!");
        require(tokensSold.add(coinAmount.mul(rate)) <= cap, "DBKStableCoinCrowdsale: Cap has been reached!");
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
    }


//     /**
//      * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends
//      * its tokens.
//      * @param beneficiary Address performing the token purchase
//      * @param tokenAmount Number of tokens to be emitted
//      */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal virtual {
        // Potentially dangerous assumption about the type of the token.
        require(DBK.mint(beneficiary, tokenAmount), "DBKCrowdsale: minting failed");
    }

    /**
     * @dev Executed when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send
     * tokens.
     * @param beneficiary Address receiving the tokens
     * @param beneficiaryAmount Number of tokens to be purchased
     */
    function _processPurchase(address beneficiary, uint256 beneficiaryAmount) internal {
        _deliverTokens(beneficiary, beneficiaryAmount);
    }


    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param coinAmount Value in coin to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 coinAmount) internal view returns (uint256) {
    	//rate = tokens/stablecoin
      return coinAmount.mul(rate);
    }

    /**
     * @dev Transfers stablecoin from sender wallet to wallet address
     */
    function _forwardFunds(uint256 coinAmount) internal {
        stablecoin.transferFrom(_msgSender(), wallet, coinAmount);
    }


    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "DBKCrowdsale: must have admin role to use this function");  
        _;
    }

    //only admin function:
    //Pause/Unpase functionality
    function pause() public onlyAdmin{
    	_pause();
    }
    function _pause() internal override onlyAdmin{
    	super._pause();
    }
    function unpause() public onlyAdmin{
    	_unpause();
    }
    function _unpause() internal override onlyAdmin{
    	super._unpause();
    }


    function changePaymentToken(address _stablecoin) external whenPaused onlyAdmin {
    		stablecoin = IERC20Upgradeable(_stablecoin);
    		emit PaymentTokenChanged(address(stablecoin));
    }


    //Rate changing -- only when paused
    function changeRate(uint256 coinRate) external whenPaused onlyAdmin{
    		rate = coinRate;
    		emit RateChange(rate);
    }

    //Cap Raising -- only when paused
    function raiseCap(uint256 _cap) external whenPaused onlyAdmin{
    		cap = cap.add(_cap);
    		emit CapChange(cap);
    }


    function isAdmin(address _address) public view returns(bool){
    	return hasRole(ADMIN_ROLE,_address);
    }


    function addAdmin(address _address) public onlyAdmin {
        _setupRole(ADMIN_ROLE, _address);
        emit adminAdded(_address);
    }

    /**
     * @notice Allows the admin to withdraw tokens mistakenly sent into the contract.
     * @param _token The address of the token to rescue.
     * @param recipient The recipient that the tokens will be sent to.
     * @param amount How many tokens to rescue.
     */
    function adminRescueTokens(address _token, address recipient, uint256 amount) external onlyAdmin {
        require(_token != address(0x0), "zero address");
        require(recipient != address(0x0), "bad recipient");
        require(amount > 0, "zero amount");

        bool ok = IERC20Upgradeable(_token).transfer(recipient, amount);
        require(ok, "transfer");

        emit AdminRescueTokens(_token, recipient, amount);
    }

    uint256[49] private __gap;

}