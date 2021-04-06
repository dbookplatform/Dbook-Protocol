const BigNumber = require('bignumber.js');
// const chai = require("chai");
const { expect } = require("chai");
// const { solidity } = require("ethereum-waffle");

// const { time } = require('@openzeppelin/test-helpers');
// chai.use(solidity);

//import 
let tryCatch = require("../exceptions.js").tryCatch;
let errTypes = require("../exceptions.js").errTypes;

const delay = ms => new Promise(res => setTimeout(res, ms));

let token, deployer, accounts, crowdsale, stake, rewardToken, presaleAmount,  teamAmount, rewardtoken2

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}


async function setupContracts() {
    accounts = await ethers.getSigners()
    deployerAddr = await accounts[0].getAddress()

    // presaleAmount = 967; //includes contirbutors
    // teamAmount = 2000;

    const Token = await ethers.getContractFactory("DBKToken");
  	token = await upgrades.deployProxy(Token, [], {unsafeAllowCustomTypes: true});
    await token.deployed();
    
  //   // uint256 rate, address payable wallet, IERC20Upgradeable token, address _admin, uint256 cap, IUniswapV2Router02 router, IERC20Upgradeable stablecoin
  //   const Crowdsale = await ethers.getContractFactory("DBKCrowdsale");
  // 	crowdsale = await upgrades.deployProxy(Crowdsale, [500,await accounts[5].getAddress(),token.address,await accounts[4].getAddress(), 1000, await accounts[7].getAddress(), await accounts[1].getAddress()], {unsafeAllowCustomTypes: true});
		// await crowdsale.deployed();
  	
  	// Deploy a rewardsToken
  	const RewardToken = await ethers.getContractFactory("RewardToken");
  	rewardToken = await upgrades.deployProxy(RewardToken, [], {unsafeAllowCustomTypes: true});
  	await rewardToken.deployed();

  	// Deploy a second rewardtoken
  	const RewardToken2 = await ethers.getContractFactory("RewardToken");
  	rewardToken2 = await upgrades.deployProxy(RewardToken2, [], {unsafeAllowCustomTypes: true});
  	await rewardToken2.deployed();

  	// address _rewardsToken,
   	// address _stakingToken
    const Stake = await ethers.getContractFactory("DBKStake");
  	stake = await upgrades.deployProxy(Stake, [rewardToken.address,token.address], {unsafeAllowCustomTypes: true});
  	await stake.deployed();

		// uint256 _lockTimeYears, uint256 _vestTimeYears, address _DBK
		// const Team = await ethers.getContractFactory("DBKTeamContract");
  // 	team = await upgrades.deployProxy(Team, [3,7,token.address], {unsafeAllowCustomTypes: true});
  // 	await team.deployed();    

  	//give all accounts 250 DBK
  	for(var i =0; i< 15;i++){
  			await token.mint(await accounts[i].getAddress(), ethers.utils.parseEther("600"))
  	}

  	// await token.mint(await accounts[0].getAddress(), ethers.utils.parseEther(String(presaleAmount)))
		// await token.mint(await accounts[0].getAddress(), ethers.utils.parseEther(String(teamAmount)))
}

describe("Token Staking Test(s)", function() {
		before("deploying contracts:" , setupContracts)		

		it("should give each account(15) 250 DBk", async () =>{
				for(var i=0;i<15;i++){
						expect(await token.balanceOf(await accounts[i].getAddress())).to.equal(ethers.utils.parseEther("600"))
				}
		})

		it('should revert if a user tries to stake before seeding first pool', async ()=> {
				// await tryCatch(stake.stake(ethers.utils.parseEther("200")), errTypes.revert);
		})



		//1. Seed First Pool
		/* requires approval given to the contract for the given deposit token */
		/* sets the first poool amount and start time in unix time */
		/* sets the start time in unix time */
  	it("seed first pool", async ()=>{
  			let now = parseInt((Date.now()/1000) + 86400)

  			//approve the staking pool to take my reward tokens for staking
  			await rewardToken.approve(stake.address,ethers.utils.parseEther("50000000000000000000000000"))
  			await stake.seedFirstPool(ethers.utils.parseEther("5000"), now)
  			expect((await stake._poolTimes(1))['start']).to.equal(now)
  	})


  	it('stake', async ()=>{
  			
  			// await stake.stake(ethers.utils.parseEther("200")) -> reverts
  			// await stake.unstake(1) -> reverts
				//increment time to stake
				ethers.provider.send("evm_increaseTime", [86401]) // advance a day
				ethers.provider.send("evm_mine")

				//create stake connect
				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					await signed_token.approve(stake.address, ethers.utils.parseEther("200"))
					await signed_contract.stake(ethers.utils.parseEther("200"))
					expect(await rewardToken.balanceOf(await accounts[i].getAddress())).to.equal(0)
					console.log("Claimable amount after after 0 time: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				}


				//accounts 4-9 will be staked for 200 tokens on first second
				ethers.provider.send("evm_increaseTime", [86401]) // advance a day
				ethers.provider.send("evm_mine")

				//unstake
				for(var i=5; i<= 9;i++){
						let signed_contract = stake.connect(accounts[i])
						console.log("Claimable amount after after 1 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
						// let signed_token = token.connect(accounts[i])
						// await signed_token.approve(stake.address, ethers.utils.parseEther("200"))
						await signed_contract.unstake(1) 
						expect(await rewardToken.balanceOf(await accounts[i].getAddress())).to.be.lt(ethers.utils.parseEther("7.5"))
						expect(await rewardToken.balanceOf(await accounts[i].getAddress())).to.be.gt(ethers.utils.parseEther("7.4"))
				}

				ethers.provider.send("evm_increaseTime", [43150]) // advance half a day
				ethers.provider.send("evm_mine")

				//admin deposit into next cycle
				await stake.adminDepositForNextPool(rewardToken.address,ethers.utils.parseEther("1000"), 108000,604800)//offset next pool start by 1.25 days
				
				for(var i=4; i<= 11;i++){						
						let signed_contract = stake.connect(accounts[i])
						console.log("Claimable amount after after 1.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
						let signed_token = token.connect(accounts[i])
						await signed_token.approve(stake.address, ethers.utils.parseEther("200"))
						await signed_contract.stake(ethers.utils.parseEther("200")) 	
				}

				//4 restakes 5 stakes new
				ethers.provider.send("evm_increaseTime", [84600]) // advance a day
				ethers.provider.send("evm_mine")


				for(var i=4; i<= 11;i++){
					let signed_contract = stake.connect(accounts[i])
					console.log("Claimable amount after after 2.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				}

				ethers.provider.send("evm_increaseTime", [345000]) // advance 4 days
				ethers.provider.send("evm_mine")

				for(var i=5; i<= 11;i++){
					let signed_contract = stake.connect(accounts[i])
					console.log("Claimable amount after after 6.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
					await signed_contract.unstake(1) 
					console.log("Claimable amount after after 6.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				}


				let signed_contract = stake.connect(accounts[4])
				console.log("Reward amount left:" + String(await signed_contract._totalRewardSupplyOnCycle(1)))
				ethers.provider.send("evm_increaseTime", [43150]) // advance half a day
				ethers.provider.send("evm_mine")
				console.log("Claimable amount after after 7 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				ethers.provider.send("evm_increaseTime", [43150]) // advance half a day
				ethers.provider.send("evm_mine")
				console.log("Claimable amount after after 7.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				ethers.provider.send("evm_increaseTime", [43150]) // advance half a day
				ethers.provider.send("evm_mine")
				console.log("Claimable amount after after 8 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				await signed_contract.unstake(1) 
				console.log("Reward amount left:" + String(await signed_contract._totalRewardSupplyOnCycle(1)))
				console.log("current cycle: ", String(await stake.currentCycle()))

				// for(var i=5; i<= 11;i++){
				// 	let signed_contract = stake.connect(accounts[i])
				// 	console.log("Claimable amount after after 6.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				// 	await signed_contract.unstake(1) 
				// 	console.log("Claimable amount after after 6.5 day: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				// }

				//create stake in cylce 2
				// for(var i=4; i<= 9;i++){
				// 	let signed_contract = stake.connect(accounts[i])
				// 	let signed_token = token.connect(accounts[i])
				// 	await signed_token.approve(stake.address, ethers.utils.parseEther("200"))
				// 	await signed_contract.stake(ethers.utils.parseEther("100"))
				// 	expect(await rewardToken.balanceOf(await accounts[i].getAddress())).to.equal(0)
				// 	console.log("Claimable amount after after 0 time: " + String(await signed_contract.earnedOnCycle(1)/1e18))
				// }

				ethers.provider.send("evm_increaseTime", [30000]) // advance half a day + 
				ethers.provider.send("evm_mine")

				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					await signed_token.approve(stake.address, ethers.utils.parseEther("50"))
					await signed_contract.stake(ethers.utils.parseEther("50"))
					console.log("Claimable amount after after 0 time: " + String(await signed_contract.earnedOnCycle(2)/1e18))
					console.log("current cycle: ", String(await stake.currentCycle()))
				}

				ethers.provider.send("evm_increaseTime", [608801]) // advance a awhile
				ethers.provider.send("evm_mine")	

				// let _poolTimes = await stake._poolTimes(2)
				// let start = _poolTimes['start']
				// let end = _poolTimes['end']
				// console.log("_poolTimes length: ", String(end-start))
				// for(var i=4; i<= 9;i++){
				// 	let signed_contract = stake.connect(accounts[i])
				// 	let signed_token = token.connect(accounts[i])
				// 	console.log("stake on cycle ", await stake._stakeOnCycle(2,await accounts[i].getAddress()))
				// }


				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					console.log("Claimable amount after after 8 days: " + String(await signed_contract.earnedOnCycle(2)/1e18))
					await signed_contract.unstake(2)
					console.log("Claimable amount after after 8 days: " + String(await signed_contract.earnedOnCycle(2)/1e18))
					console.log("Total reward " + String(await signed_contract._totalRewardSupplyOnCycle(2)/1e18))
				}

				ethers.provider.send("evm_increaseTime", [960000]) // advance a awhile
				ethers.provider.send("evm_mine")	

				//admin deposit with 11 day offset to compensate for delay
				await stake.adminDepositForNextPool(rewardToken.address,ethers.utils.parseEther("50000"), 950400,604800)


				/*CYCLE 3 */

				for(var i=4; i<= 9;i++){
					console.log("current cycle: ", String(await stake.currentCycle()))
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					await signed_token.approve(stake.address, ethers.utils.parseEther("11"))
					await signed_contract.stake(ethers.utils.parseEther("11"))
					console.log("Claimable amount after after 0 time: " + String(await signed_contract.earnedOnCycle(3)/1e18))
				}

				ethers.provider.send("evm_increaseTime", [86500]) // advance a day
				ethers.provider.send("evm_mine")	


				
				// function setRewardsDuration(uint256 _rewardsDuration) external onlyAdmin {
				//during cycle3: change duration 14 days now

				//admin deposit
				await rewardToken2.approve(stake.address,ethers.utils.parseEther("1000000000000"))
				await stake.adminDepositForNextPool(rewardToken2.address,ethers.utils.parseEther("50000"), 0,1209600)
				
				//
				ethers.provider.send("evm_increaseTime", [518400]) // advance 6 days
				ethers.provider.send("evm_mine")	

				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					console.log("Claimable amount after after 8 days: " + String(await signed_contract.earnedOnCycle(3)/1e18))
					await signed_contract.unstake(3)
					console.log("Claimable amount after after 8 days: " + String(await signed_contract.earnedOnCycle(3)/1e18))
					console.log("Total reward " + String(await signed_contract._totalRewardSupplyOnCycle(3)/1e18))
				}



				/*CYCLE 4 */
				// during cycle4: test duration change, change reward token
				// let _poolTimes = await stake._poolTimes(4)
				// let start = _poolTimes['start']
				// let end = _poolTimes['end']

				for(var i=4; i<= 9;i++){
					console.log("current cycle: ", String(await stake.currentCycle()))
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					await signed_token.approve(stake.address, ethers.utils.parseEther("11"))
					await signed_contract.stake(ethers.utils.parseEther("11"))
					console.log("Claimable amount after after 0 time: " + String(await signed_contract.earnedOnCycle(4)/1e18))
					expect(await rewardToken2.balanceOf(await accounts[i].getAddress())).to.equal(0)
				}

				ethers.provider.send("evm_increaseTime", [86500]) // advance a day
				ethers.provider.send("evm_mine")	
				
				//
				//grant allowance for new token
				
				await stake.adminDepositForNextPool(rewardToken2.address,ethers.utils.parseEther("50000"), 0, 1209600)


				ethers.provider.send("evm_increaseTime", [518400]) // advance 6 days
				ethers.provider.send("evm_mine")	

				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					console.log("Claimable amount after after 7 days: " + String(await signed_contract.earnedOnCycle(4)/1e18))
					console.log("Total reward " + String(await signed_contract._totalRewardSupplyOnCycle(4)/1e18))
				}

				ethers.provider.send("evm_increaseTime", [691200]) // advance 8 days
				ethers.provider.send("evm_mine")	

				for(var i=4; i<= 9;i++){
					let signed_contract = stake.connect(accounts[i])
					let signed_token = token.connect(accounts[i])
					console.log("Claimable amount after after 15 days: " + String(await signed_contract.earnedOnCycle(4)/1e18))
					await signed_contract.unstake(4)
					console.log("Claimable amount after after 15 days: " + String(await signed_contract.earnedOnCycle(4)/1e18))
					console.log("Total reward " + String(await signed_contract._totalRewardSupplyOnCycle(4)/1e18))
					console.log(String(await rewardToken2.balanceOf(await accounts[i].getAddress())))
				}

				// withdraw the leftover amount before unstake
				// admin deposit
				console.log(String(await rewardToken.balanceOf(await accounts[0].getAddress())/1e18))

				await stake.adminRescueTokens(rewardToken.address,await accounts[0].getAddress(), ethers.utils.parseEther("1000"))
				
				console.log(String(await rewardToken.balanceOf(await accounts[0].getAddress())/1e18))



  	})

})