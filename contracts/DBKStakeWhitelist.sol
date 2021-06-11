// SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract DBKStake is
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /* ========== DATA STRUCTURES ========== */

    struct Stake {
        uint256 timeStaked;
        uint256 amountStaked;
    }

    struct PoolTimes {
        uint256 start;
        uint256 end; //start + reward duration
    }

    /* ========== STATE VARIABLES ========== */

    IERC20Upgradeable public stakingToken; //DBK or LP Token

    uint256 public currentCycle;
    bool public init_first_pool_flag;
    uint256 duration;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(uint256 => bool) public _adminPoolDepositFlag;
    mapping(address => bool) public _whitelist;

    mapping(uint256 => uint256) public _totalStakingSupplyOnCycle;
    mapping(uint256 => uint256) public _totalRewardSupplyOnCycle;
    mapping(uint256 => uint256) public _baseReward;
    mapping(uint256 => IERC20Upgradeable) public _rewardTokenForCycle;
    mapping(uint256 => uint256) public _durationForCycle;

    mapping(uint256 => mapping(address => Stake)) public _stakeOnCycle;
    mapping(uint256 => mapping(address => bool)) public _userStakedOnCycle;

    mapping(uint256 => PoolTimes) public _poolTimes;

    /* ========== INITIALIZE ========== */

    function initialize(
        address _rewardsToken,
        address _stakingToken,
        bool _days
    ) public initializer {
        __Context_init();
        __AccessControl_init();
        __Pausable_init();

        if (_days) {
            duration = 1 days;
        } else {
            duration = 1 hours;
        }

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());

        _rewardTokenForCycle[1] = IERC20Upgradeable(_rewardsToken);
        stakingToken = IERC20Upgradeable(_stakingToken);
        _durationForCycle[1] = uint256(7).mul(duration);
        currentCycle = 0;
    }

    // Set start time, length, and deposit into
    function seedFirstPool(uint256 _poolSeedAmount, uint256 _poolSeedStartTime)
        public
        onlyAdmin
    {
        require(
            !init_first_pool_flag,
            "DBKStake: First Pool has already been seeded!"
        );

        currentCycle = 1;

        _poolTimes[currentCycle] = PoolTimes({
            start: _poolSeedStartTime,
            end: _poolSeedStartTime.add(_durationForCycle[1])
        });
        _totalRewardSupplyOnCycle[currentCycle] = _poolSeedAmount;
        _baseReward[currentCycle] = _poolSeedAmount.div(
            _durationForCycle[1].mul(16)
        ); // token/s

        _rewardTokenForCycle[currentCycle].safeTransferFrom(
            _msgSender(),
            address(this),
            _poolSeedAmount
        );
        init_first_pool_flag = true;

        emit firstPoolSeeded(_poolSeedStartTime, _poolSeedAmount);
    }

    /* =========== Write ========== */

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        _updateTime();
        require(_whitelist[_msgSender()], "DBKStake: whitelist");
        require(amount > 0, "Cannot stake 0");
        require(
            block.timestamp >= _poolTimes[currentCycle].start,
            "DBKStake: attempting to stake in a cycle that has not yet started"
        );
        require(
            block.timestamp <=
                _poolTimes[currentCycle].start + uint256(2).mul(duration),
            "DBKStake: Too late to deposit, wait for next cycle!"
        );
        require(
            currentCycle > 0,
            "DBKStake: First Pool has not been seeded yet!"
        );

        _totalStakingSupplyOnCycle[currentCycle] = _totalStakingSupplyOnCycle[
            currentCycle
        ]
            .add(amount);

        if (!_userStakedOnCycle[currentCycle][_msgSender()]) {
            _stakeOnCycle[currentCycle][msg.sender] = Stake({
                timeStaked: block.timestamp,
                amountStaked: amount
            });
        } else {
            _stakeOnCycle[currentCycle][msg.sender]
                .amountStaked = _stakeOnCycle[currentCycle][msg.sender]
                .amountStaked
                .add(amount);
        }

        _userStakedOnCycle[currentCycle][_msgSender()] = true;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(_msgSender(), amount, currentCycle);
    }

    /* unstakes and claims in a single function */
    function unstake(uint256 _cycle) external nonReentrant whenNotPaused {
        require(
            _userStakedRequirements(_msgSender(), _cycle),
            "DBKStake: User Does Not Meet the unstake Requirements!"
        );

        uint256 rewardAmount = _calculateReward(_cycle, _msgSender());
        uint256 stakeAmount = _stakeOnCycle[_cycle][_msgSender()].amountStaked;

        // Transfer Reward and Staked Token
        stakingToken.safeTransfer(_msgSender(), stakeAmount);
        _rewardTokenForCycle[_cycle].safeTransfer(_msgSender(), rewardAmount);

        //reset their stake for this cycle and update total cycle reward amount accordingly
        _totalRewardSupplyOnCycle[_cycle] = _totalRewardSupplyOnCycle[_cycle]
            .sub(rewardAmount);
        _stakeOnCycle[_cycle][_msgSender()].amountStaked = 0;
        _userStakedOnCycle[_cycle][_msgSender()] = false;

        emit Unstaked(_msgSender(), stakeAmount, _cycle);
        emit RewardPaid(_msgSender(), rewardAmount);
        _updateTime();
    }

    // function restake() public nonReentrant whenNotPaused {
    //     _updateTime();//makes sure start conditions are met

    //     require(block.timestamp <= _poolTimes[currentCycle].start + 2 days, "DBKStake: Too late to deposit into the pool for this cycle!");
    //     require(block.timestamp >= _poolTimes[currentCycle].start, "DBKStake: attempting to stake in a cycle that has not yet started");
    //     require(currentCycle > 1, "More than one cycle required to restake");
    //     require(!_userStakedOnCycle[currentCycle][_msgSender()], "Cannot restake on an already invested cycle");

    //     uint256 _cycle = currentCycle-1;

    //     uint256 rewardAmount = _calculateReward(_cycle, _msgSender());
    //     rewardsToken.safeTransfer(_msgSender(), rewardAmount);

    //     uint256 stakeAmount = _stakeOnCycle[_cycle][_msgSender()].amountStaked;

    //     //reset their stake for the previous cycle and update total cycle reward amount accordingly
    //     _totalRewardSupplyOnCycle[_cycle] = _totalRewardSupplyOnCycle[_cycle].sub(rewardAmount);
    //     _stakeOnCycle[_cycle][_msgSender()].amountStaked = 0;
    //     _userStakedOnCycle[_cycle][_msgSender()] = false;

    //     //stake them in the new current cycle, granted requirements are met
    //     require(block.timestamp <= _poolTimes[currentCycle].start + 2 days, "DBKStake: Too late to deposit into the pool for this cycle; unstake instead!");
    //     _totalStakingSupplyOnCycle[currentCycle] = _totalStakingSupplyOnCycle[currentCycle].add(stakeAmount);
    //     _userStakedOnCycle[currentCycle][_msgSender()] = true;
    //     _stakeOnCycle[currentCycle][_msgSender()] = Stake({timeStaked: block.timestamp, amountStaked: stakeAmount});

    //     emit Unstaked(_msgSender(), stakeAmount, _cycle);
    //     emit RewardPaid(_msgSender(), rewardAmount);
    //     emit Staked(_msgSender(), stakeAmount, currentCycle);
    // }

    /* ========== RESTRICTED FUNCTIONS ========== */

    //stake offset in seconds
    function adminDepositForNextPool(
        address rewardToken,
        uint256 amount,
        uint256 _stakeOffset,
        uint256 _days
    ) external onlyAdmin {
        require(amount != 0, "Amount Cannot be Zero");
        require(
            !_adminPoolDepositFlag[currentCycle + 1],
            "DBKStake: Deposit has already been made for the upcoming cycle!"
        );

        //transfer into pool
        IERC20Upgradeable(rewardToken).safeTransferFrom(
            _msgSender(),
            address(this),
            amount
        );

        _rewardTokenForCycle[currentCycle + 1] = IERC20Upgradeable(rewardToken);
        _durationForCycle[currentCycle + 1] = _days.mul(duration);

        //set times for next pool
        _poolTimes[currentCycle + 1] = PoolTimes({
            start: (_poolTimes[currentCycle].end).add(_stakeOffset),
            end: (_poolTimes[currentCycle].end).add(_stakeOffset) +
                _days.mul(duration)
        });
        _totalRewardSupplyOnCycle[currentCycle + 1] = amount;

        //set baseReward for the upcoming cycle
        _baseReward[currentCycle + 1] = amount.div(_days.mul(duration).mul(16)); // token/s

        _adminPoolDepositFlag[currentCycle + 1] = true;

        _rewardTokenForCycle[currentCycle + 1] = IERC20Upgradeable(rewardToken);

        _updateTime();

        emit nextPoolUpdated(
            currentCycle.add(1),
            (_poolTimes[currentCycle].end).add(_stakeOffset),
            amount,
            _days.mul(duration)
        );
    }

    function addAdmin(address _address) external onlyAdmin {
        _setupRole(ADMIN_ROLE, _address);
        emit adminAdded(_address);
    }

    function updateWhitelist(address _address, bool _flag) external onlyAdmin {
        _whitelist[_address] = _flag;

        emit whitelistUpdated(_address, _flag);
    }

    /**
     * @notice Allows the admin to withdraw tokens mistakenly sent into the contract.
     * @param token The address of the token to rescue.
     * @param recipient The recipient that the tokens will be sent to.
     * @param amount How many tokens to rescue.
     */
    function adminRescueTokens(
        address token,
        address recipient,
        uint256 amount
    ) external onlyAdmin {
        require(token != address(0x0), "zero address");
        require(recipient != address(0x0), "bad recipient");
        require(amount > 0, "zero amount");
        if (token == address(_rewardTokenForCycle[currentCycle])) {
            //  this check still does not guarantee that an overwithdraw will not occur
            //  if over withdraw occurs, contract assumes the overwithdraw amount will
            //  be manually depositted into the contract via an ERC20 transfer
            require(
                amount <
                    IERC20Upgradeable(token).balanceOf(address(this)).sub(
                        _totalRewardSupplyOnCycle[currentCycle]
                    ),
                "DBKStake: Amount attmepting to withdraw exceeds the allocated awards!"
            );
        }
        bool ok = IERC20Upgradeable(token).transfer(recipient, amount);
        require(ok, "transfer fail");

        emit AdminRescueTokens(token, recipient, amount);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _userStakedRequirements(address _user, uint256 _cycle)
        internal
        view
        returns (bool)
    {
        require(
            _cycle <= currentCycle && _cycle > 0,
            "DBKStake: Invalid Cycle given for Unstake Attempt!"
        );
        require(_userStakedOnCycle[_cycle][_user], "DBKStake: Must be staked");
        require(
            block.timestamp.sub(_stakeOnCycle[_cycle][_user].timeStaked) >
                1 days,
            "24 hour staked requirement has not been met!"
        );
        return true;
    }

    function _calculateReward(uint256 _cycle, address _user)
        internal
        view
        returns (uint256)
    {
        // depends on pool withdrawing from, pool start, pool end, multiplier, and total time staked
        Stake memory _stake = _stakeOnCycle[_cycle][_user];
        uint256 multiplier =
            _calculateMultiplier(durationStaked(_cycle, _user));

        return
            (
                (
                    (
                        _stake.amountStaked.mul(_baseReward[_cycle]).mul(
                            multiplier
                        )
                    )
                        .mul(durationStaked(_cycle, _user))
                )
            )
                .div(_totalStakingSupplyOnCycle[_cycle]);
    }

    function _calculateMultiplier(uint256 _duration)
        internal
        view
        returns (uint256)
    {
        //map the duration to a multiplier 1-2 days = 1x, 3 = 2x, 4 = 4x, 5 = 8x, 6+ = 16x
        uint256 _days = _duration.div(duration); //intrinsic floor division

        if (_days <= 2) {
            return 1;
        } else if (_days == 3) {
            return 2;
        } else if (_days == 4) {
            return 4;
        } else if (_days == 5) {
            return 8;
        } else if (_days == 5) {
            return 8;
        } else if (_days >= 6) {
            return 16;
        }
    }

    function _updateTime() internal {
        if (block.timestamp >= _poolTimes[currentCycle].end) {
            if (_adminPoolDepositFlag[currentCycle + 1]) {
                if (block.timestamp >= _poolTimes[currentCycle + 1].start) {
                    currentCycle = currentCycle.add(1);
                    emit cycleUpdated(currentCycle);
                } else {
                    return;
                }
            } else {
                return;
            }
        }
    }

    /* ========== VIEWS ========== */

    function totalStakingSupplyOnCylce(uint256 cycle)
        internal
        view
        returns (uint256)
    {
        require(cycle <= currentCycle, "Cycle does not exist");
        return _totalStakingSupplyOnCycle[cycle];
    }

    function earnedOnCycle(uint256 _cycle) public view returns (uint256) {
        return _calculateReward(_cycle, _msgSender());
    }

    function durationStaked(uint256 _cycle, address _user)
        public
        view
        returns (uint256)
    {
        return
            (MathUpgradeable.min(block.timestamp, _poolTimes[_cycle].end)).sub(
                _stakeOnCycle[_cycle][_user].timeStaked
            );
    }

    function isAdmin(address _address) public view returns (bool) {
        return hasRole(ADMIN_ROLE, _address);
    }

    function multiplier(uint256 _cycle) public view returns (uint256) {
        if (!_userStakedOnCycle[_cycle][_msgSender()]) {
            return 0;
        } else {
            return _calculateMultiplier(durationStaked(_cycle, _msgSender()));
        }
    }

    /* ========== MODIFIERS ========== */

    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, _msgSender()),
            "DBKCrowdsale: must have admin role to use this function"
        );
        _;
    }

    /* ========== EVENTS ========== */

    // event
    event firstPoolSeeded(uint256 _startTime, uint256 _poolAmount);
    event Staked(address indexed user, uint256 amount, uint256 cycle);
    event Unstaked(address indexed user, uint256 amount, uint256 cycle);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event nextPoolUpdated(
        uint256 _cycle,
        uint256 _startTime,
        uint256 _poolAmount,
        uint256 _duration
    );
    event cycleUpdated(uint256 _cycle);
    event AdminRescueTokens(address token, address recipient, uint256 amount);
    event adminAdded(address admin);
    event whitelistUpdated(address user, bool flag);

    uint256[49] private __gap;
}
