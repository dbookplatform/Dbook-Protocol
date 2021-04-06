// SPDX-License-Identifier: ISC

pragma solidity >=0.6.0 <0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

contract DBKTeamContract is Initializable, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
	using SafeMathUpgradeable for uint256;
	using SafeERC20Upgradeable for IERC20Upgradeable;

	struct TeamMemberStake {
			uint256 start;
			uint256 amountAllocated;
			uint256 rewardRate;
			uint256 claimed;
	}

	uint256 public amountAllocated;
	uint256 public amountUnallocated;
	uint256 public vestTime;
	uint256 public lockTime;

	IERC20Upgradeable public DBK; 

	mapping(address => TeamMemberStake) public teamMembers;
	mapping(address => bool) public teamMemberExist;

	bytes32 public constant TEAM_ADMIN_ROLE = keccak256("TEAM_ADMIN_ROLE");
	bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");

	function initialize(uint256 _lockTimeYears, uint256 _vestTimeYears, address _DBK) public initializer {
			lockTime = _lockTimeYears.mul(365 days);
			emit teamLockPeriod(lockTime);
			vestTime = _vestTimeYears.mul(365 days);
			emit teamVestPeriod(vestTime);
			
			DBK = IERC20Upgradeable(_DBK);
			
			amountAllocated = 0;

			_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      _setupRole(TEAM_ADMIN_ROLE, _msgSender());
	}

	function addTeamFund(uint256 amount) public onlyTeamAdmin{
			amountUnallocated = amountUnallocated.add(amount);
			
			//transfer from -- requires approval -- safest way to ensure seed is correct
			DBK.transferFrom(_msgSender(), address(this), amount);
			emit teamFundAdded(block.timestamp, amount);
	}

	function addTeamMember(address payable _teamMember, uint256 _amount) public onlyTeamAdmin {
			require(_amount <= amountUnallocated, "DBKTeamMember: Allocating more funds that the remaiing unallocated amount!");

			uint256 rewardRate = _amount.div(vestTime); //unique token/s


			teamMembers[_teamMember] = TeamMemberStake(block.timestamp, _amount, rewardRate, 0);
			teamMemberExist[_teamMember] = true;

			amountUnallocated = amountUnallocated.sub(_amount);
			amountAllocated = amountAllocated.add(_amount);

			addTeamMember(_teamMember);

			emit teamMemberAdded(_teamMember,_amount);
	}

	function addTeamAdmin(address _address) external onlyTeamAdmin {
      _setupRole(TEAM_ADMIN_ROLE, _address);
  }


  function addTeamMember(address _member) internal onlyTeamAdmin {
  		_setupRole(TEAM_MEMBER_ROLE, _member);
  }


  function claimTokens() external onlyTeamMember nonReentrant{
  		uint256 currentReward = calculateReward(_msgSender());
  		require(currentReward <= teamMembers[_msgSender()].amountAllocated);
  		DBK.transfer(_msgSender(),currentReward);

  		teamMembers[_msgSender()].claimed = (teamMembers[_msgSender()].claimed).add(currentReward);

  		emit memberClaimed(_msgSender(), currentReward);
  }


  /* View */

	function calculateReward(address _member) public view returns(uint256){
			require(teamMemberExist[_member], "DBKTeamContract: This member does not exist!");
			uint256 timePassed = block.timestamp.sub(teamMembers[_member].start);
			
			require(timePassed >= lockTime, "DBKTeamMember: Funds have not been locked for the minimum amount of time!");

			//caps the time and therefore will cap claimable amount
			if(timePassed >= lockTime.add(vestTime)){
				timePassed = lockTime.add(vestTime); 
			}

			return ((teamMembers[_member].rewardRate).mul(timePassed.sub(lockTime))).sub(teamMembers[_member].claimed);
	}


	function memberAllocation(address _member) public view returns(uint256){
			require(teamMemberExist[_member], "DBKTeamContract: This member does not exist!");
			return teamMembers[_member].amountAllocated;
	}


	function memberStartTime(address _member) public view returns(uint256){
			require(teamMemberExist[_member], "DBKTeamContract: This member does not exist!");
			return teamMembers[_member].start;
	}
	
	function isTeamAdmin(address _address) public view returns(bool){
			return hasRole(TEAM_ADMIN_ROLE,_address);
	}


	function isTeamMember(address _address) public view returns(bool){
			return hasRole(TEAM_MEMBER_ROLE,_address);
	}

	/* modifiers */

	modifier onlyTeamAdmin() {
      require(hasRole(TEAM_ADMIN_ROLE, _msgSender()), "DBKTeamContract: must have team admin role to use this function");  
      _;
  }


  modifier onlyTeamMember() {
      require(hasRole(TEAM_MEMBER_ROLE, _msgSender()), "DBKTeamContract: must have team member role to use this function");  
      _;
  }
	

	/* Events */

	event teamFundAdded(uint256 time, uint256 teamAmount);
	event teamLockPeriod(uint256 time);
	event teamVestPeriod(uint256 time);
	event teamMemberAdded(address teamMember, uint256 amount);
	event memberClaimed(address teamMember, uint256 amount);

	uint256[49] private __gap;
}