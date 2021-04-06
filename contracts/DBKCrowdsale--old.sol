// // SPDX-License-Identifier: ISC

// pragma solidity >=0.6.0 <=0.8.0;

// import "hardhat/console.sol";

// import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

// interface IDBKToken {
// 	function mint(address to, uint256 amount) external returns (bool);
// }

// contract CrowdsaleUpgradeable is Initializable, ContextUpgradeable, ReentrancyGuardUpgradeable{
// 	using SafeMathUpgradeable for uint256;
//     using SafeERC20Upgradeable for IERC20Upgradeable;

//     // The token being sold
//     IERC20Upgradeable private _token;

//     // Address where funds are collected
//     address payable private _wallet;

//     // How many token units a buyer gets per wei.
//     // The rate is the conversion between wei and the smallest and indivisible token unit.
//     // So, if you are using a rate of 1 with a ERC20Detailed token with 3 decimals called TOK
//     // 1 wei will give you 1 unit, or 0.001 TOK.
//     uint256 internal _rate;

//     // Amount of wei raised
//     uint256 internal _weiRaised;

//     /**
//      * Event for token purchase logging
//      * @param purchaser who paid for the tokens
//      * @param beneficiary who got the tokens
//      * @param value weis paid for purchase
//      * @param amount amount of tokens purchased
//      */
//     event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
//     event AdminRescueTokens(address token, address recipient, uint256 amount);


//     function __Crowdsale__init(uint256 rate, address payable wallet, IERC20Upgradeable token) internal initializer{
//     	__Context_init_unchained();
//   		__ReentrancyGuard_init_unchained();
//   		__Crowdsale__init_unchained(rate, wallet, token) ;
//     }

//     function __Crowdsale__init_unchained(uint256 rate, address payable wallet, IERC20Upgradeable token) internal initializer{
// 	    _rate = rate;
// 	    _wallet = wallet;
// 	    _token = token;
//     }
    	
//     /**
//      * @dev fallback function ***DO NOT OVERRIDE***
//      * Note that other contracts will transfer funds with a base gas stipend
//      * of 2300, which is not enough to call buyTokens. Consider calling
//      * buyTokens directly when purchasing tokens from a contract.
//      */
//     receive () external payable {
//         buyTokens(_msgSender());
//     }

//     /**
//      * @return the token being sold.
//      */
//     function token() public view returns (IERC20Upgradeable) {
//         return _token;
//     }

//     /**
//      * @return the address where funds are collected.
//      */
//     function wallet() public view returns (address payable) {
//         return _wallet;
//     }

//     /**
//      * @return the number of token units a buyer gets per wei.
//      */
//     function rate() public view returns (uint256) {
//         return _rate;
//     }

//     /**
//      * @return the amount of wei raised.
//      */
//     function weiRaised() public view returns (uint256) {
//         return _weiRaised;
//     }

//     /**
//      * @dev low level token purchase ***DO NOT OVERRIDE***
//      * This function has a non-reentrancy guard, so it shouldn't be called by
//      * another `nonReentrant` function.
//      * @param beneficiary Recipient of the token purchase
//      */
//     function buyTokens(address beneficiary) public nonReentrant payable {
//         uint256 weiAmount = msg.value;
//         _preValidatePurchase(beneficiary, weiAmount);

//         // calculate token amount to be created
//         uint256 tokens = _getTokenAmount(weiAmount);

//         // update state
//         _weiRaised = _weiRaised.add(weiAmount);

//         _processPurchase(beneficiary, tokens);
//         emit TokensPurchased(_msgSender(), beneficiary, weiAmount, tokens);

//         _updatePurchasingState(beneficiary, weiAmount);

//         _forwardFunds();
//         _postValidatePurchase(beneficiary, weiAmount);
//     }

//     function _hasBeenInitialized() internal view returns (bool) {
//         return ((_rate > 0) && (_wallet != address(0)) && (address(_token) != address(0)));
//     }

//     /**
//      * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met.
//      * Use `super` in contracts that inherit from Crowdsale to extend their validations.
//      * Example from CappedCrowdsale.sol's _preValidatePurchase method:
//      *     super._preValidatePurchase(beneficiary, weiAmount);
//      *     require(weiRaised().add(weiAmount) <= cap);
//      * @param beneficiary Address performing the token purchase
//      * @param weiAmount Value in wei involved in the purchase
//      */
//     function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal virtual view {
//         require(beneficiary != address(0), "Crowdsale: beneficiary is the zero address");
//         require(weiAmount != 0, "Crowdsale: weiAmount is 0");
//         this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
//     }

//     /**
//      * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid
//      * conditions are not met.
//      * @param beneficiary Address performing the token purchase
//      * @param weiAmount Value in wei involved in the purchase
//      */
//     function _postValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
//         // solhint-disable-previous-line no-empty-blocks
//     }

//     /**
//      * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends
//      * its tokens.
//      * @param beneficiary Address performing the token purchase
//      * @param tokenAmount Number of tokens to be emitted
//      */
//     function _deliverTokens(address beneficiary, uint256 tokenAmount) internal virtual {
//         _token.safeTransfer(beneficiary, tokenAmount);
//     }

//     *
//      * @dev Executed when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send
//      * tokens.
//      * @param beneficiary Address receiving the tokens
//      * @param tokenAmount Number of tokens to be purchased
     
//     function _processPurchase(address beneficiary, uint256 tokenAmount) internal {
//         _deliverTokens(beneficiary, tokenAmount);
//     }

//     /**
//      * @dev Override for extensions that require an internal state to check for validity (current user contributions,
//      * etc.)
//      * @param beneficiary Address receiving the tokens
//      * @param weiAmount Value in wei involved in the purchase
//      */
//     function _updatePurchasingState(address beneficiary, uint256 weiAmount) internal {
//         // solhint-disable-previous-line no-empty-blocks
//     }

//     /**
//      * @dev Override to extend the way in which ether is converted to tokens.
//      * @param weiAmount Value in wei to be converted into tokens
//      * @return Number of tokens that can be purchased with the specified _weiAmount
//      */
//     function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
//         return weiAmount.mul(_rate);
//     }

//     /**
//      * @dev Determines how ETH is stored/forwarded on purchases.
//      */
//     function _forwardFunds() internal {
//         _wallet.transfer(msg.value);
//     }

//     uint256[49] private __gap;

// }

// /**
//  * @title DBKCrowdsale
//  * @dev Extension of Crowdsale contract whose tokens are minted in each purchase.
//  * Token MINTER_ROLE should be given to this contract by the Default_Admin_Role.
//  * This Crowdsale is additionally pauseable at anytime by the ADMIN_ROLE, and possess
//  * the capability to raise the cap in real time
//  */
// contract DBKCrowdsale is Initializable, CrowdsaleUpgradeable, PausableUpgradeable, AccessControlUpgradeable {
// 			/**
//      * @param rate Number of token units a buyer gets per wei
//      * @dev The rate is the conversion between wei and the smallest and indivisible
//      * token unit. So, if you are using a rate of 1 with a ERC20Detailed token
//      * with 3 decimals called TOK, 1 wei will give you 1 unit, or 0.001 TOK.
//      * @param wallet Address where collected funds will be forwarded to
//      * @param token Address of the token being sold
//      */
//     function initialize (uint256 rate, address payable wallet, IERC20Upgradeable token, address _admin, uint256 cap, IUniswapV2Router02 router, IERC20Upgradeable stablecoin) public initializer {
// 		require(rate > 0, "DBKCrowdsale: rate is 0");
//         require(wallet != address(0), "DBKCrowdsale: wallet is the zero address");
//         require(address(token) != address(0), "DBKCrowdsale: token is the zero address");

//     		__DBKCrowdsale_init(rate, wallet, token, _admin, cap, router ,stablecoin);
//     }

//     // Setting the admin role
//     bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
//     //set the decimals constant
//     uint256 private constant DECIMALS = 1e18;

//     // Cap on tokens to sell, since rate will be variable
//     uint256 private _cap;

//     // Amount of tokens sold
//     uint256 private _tokensSold;

//     // Uniswap interface
//     IUniswapV2Router02 private _router;

//     //Stablecoin to convert to
//     IERC20Upgradeable private _stablecoin;
		
//     function __DBKCrowdsale_init(uint256 rate, address payable wallet, IERC20Upgradeable token, address _admin, uint256 cap ,IUniswapV2Router02 router, IERC20Upgradeable stablecoin) internal initializer {
//     	__Crowdsale__init(rate, wallet, token);
// 	    __Pausable_init();
//   		__AccessControl_init();

//   		__DBKCrowdsale_init_unchained(_admin,cap,router,stablecoin);
//   	}  

// 	  function __DBKCrowdsale_init_unchained(address _admin, uint256 cap, IUniswapV2Router02 router,IERC20Upgradeable stablecoin) internal initializer{
// 	  	_cap = cap.mul(DECIMALS);
// 	  	_router = router;
// 	  	_stablecoin = stablecoin;

// 	    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
// 	    _setupRole(ADMIN_ROLE, _admin);
// 	  }

// 	  using SafeMathUpgradeable for uint256;
//     using SafeERC20Upgradeable for IERC20Upgradeable;

//     modifier onlyAdmin() {
//     	require(hasRole(ADMIN_ROLE, _msgSender()), "DBKCrowdsale: must have admin role to use this function");	
//     	_;
//     }

//     //implicitly mints newly bought tokens -- therefore implicity following the cap for total supply set internally in DBKToken
//     function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
//         // Potentially dangerous assumption about the type of the token.
//         require(
//             IDBKToken(address(token())).mint(beneficiary, tokenAmount),
//                 "DBKCrowdsale: minting failed"
//         );

//         _tokensSold = _tokensSold.add(tokenAmount);
//     }

//     //extend prevalidate in order to properly check cap and pausing
//     function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override view whenNotPaused{
//     	super._preValidatePurchase(_beneficiary, _weiAmount);
//     	require(tokensSold().add(_weiAmount.mul(_rate)) <= _cap);
//     }

//     //Pause/Unpase functionality
//     function pause() public onlyAdmin{
//     	_pause();
//     }
//     function _pause() internal override onlyAdmin{
//     	super._pause();
//     }
//     function unpause() public onlyAdmin{
//     	_unpause();
//     }
//     function _unpause() internal override onlyAdmin{
//     	super._unpause();
//     }

//     //Rate changing -- only when paused
//     function changeRate(uint256 _weiRate) external whenPaused onlyAdmin{
//     	_rate = _weiRate;
//     }

//     //Cap Raising -- only when paused
//     function raiseCap(uint256 cap) external whenPaused onlyAdmin{
//     	_cap = _cap.add(cap.mul(DECIMALS));
//     }

//     //utility view functions
//     function cap() public view returns(uint256){
//     	return _cap;
//     }

//     function tokensSold() public view returns(uint256){
//     	return _tokensSold;
//     }

//     function isAdmin(address _address) public view returns(bool){
//     	return hasRole(ADMIN_ROLE,_address);
//     }

//     /**
//      * @notice Allows the admin to withdraw tokens mistakenly sent into the contract.
//      * @param token The address of the token to rescue.
//      * @param recipient The recipient that the tokens will be sent to.
//      * @param amount How many tokens to rescue.
//      */
//     function adminRescueTokens(address token, address recipient, uint256 amount) external onlyAdmin {
//         require(token != address(0x0), "zero address");
//         require(recipient != address(0x0), "bad recipient");
//         require(amount > 0, "zero amount");

//         bool ok = IERC20Upgradeable(token).transfer(recipient, amount);
//         require(ok, "transfer");

//         emit AdminRescueTokens(token, recipient, amount);
//     }
    
//     uint256[49] private __gap;
// }
