const BigNumber = require('bignumber.js');
const hre = require("hardhat");
const { expect } = require("chai");
// const { solidity } = require("ethereum-waffle");

// const { time } = require('@openzeppelin/test-helpers');
// chai.use(solidity);

//import 
let tryCatch = require("../exceptions.js").tryCatch;
let errTypes = require("../exceptions.js").errTypes;

const delay = ms => new Promise(res => setTimeout(res, ms));

let token, deployer, accounts, crowdsale, stake, rewardToken, presaleAmount,  teamAmount

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}


async function setupContracts() {
    accounts = await ethers.getSigners()
    deployerAddr = await accounts[0].getAddress()

    presaleAmount = 967; //includes contirbutors
    teamAmount = 2000;

    const Token = await ethers.getContractFactory("DBKToken");
  	token = await Token.deploy();
    await token.deployed();
    
    // uint256 rate, address payable wallet, IERC20Upgradeable token, address _admin, uint256 cap, IUniswapV2Router02 router, IERC20Upgradeable stablecoin
    const Crowdsale = await ethers.getContractFactory("DBKCrowdsale");
  	crowdsale = await upgrades.deployProxy(Crowdsale, [500,await accounts[5].getAddress(),token.address,await accounts[4].getAddress(), 1000, await accounts[7].getAddress(), await accounts[1].getAddress()], {unsafeAllowCustomTypes: true});
		await crowdsale.deployed();
  	
  	// Deploy a rewardsToken
  	const RewardToken = await ethers.getContractFactory("RewardToken");
  	rewardToken = await upgrades.deployProxy(RewardToken, [], {unsafeAllowCustomTypes: true});
  	await rewardToken.deployed();

  	// address _rewardsToken,
   	// address _stakingToken
    const Stake = await ethers.getContractFactory("DBKStake");
  	stake = await upgrades.deployProxy(Stake, [rewardToken.address,token.address], {unsafeAllowCustomTypes: true});
  	await stake.deployed();

		// uint256 _lockTimeYears, uint256 _vestTimeYears, address _DBK
		const Team = await ethers.getContractFactory("DBKTeamContract");
  	team = await upgrades.deployProxy(Team, [3,7,token.address], {unsafeAllowCustomTypes: true});
  	await team.deployed();    

  	await token.mint(await accounts[0].getAddress(), ethers.utils.parseEther(String(presaleAmount)))
		await token.mint(await accounts[0].getAddress(), ethers.utils.parseEther(String(teamAmount)))
}


describe("DBKToken: Initialization", function() {
	before("deploying contracts:" , setupContracts)

  it("should have initialSupply equalt to presale amount and teamamount", async function() {
    expect(await token.totalSupply()).is.equal(ethers.utils.parseEther("2967"))
  });

  it('should set detailed ERC20 parameters', async () => {
      expect(await token.name()).to.equal('Dbook')
      expect(await token.symbol()).to.equal('DBK')
      expect(await token.decimals()).to.equal(18)
  })

  it('should have 18 decimals', async () => {
      const decimals = await token.decimals()
      expect(decimals).to.equal(18)
  })

  it('should have DBK symbol', async () => {
      const symbol = await token.symbol()
      expect(symbol).to.equal('DBK')
  })	
  it('should have Dbook name', async () => {
      const name = await token.name()
      expect(name).to.equal('Dbook')
  })	

  it("should have owner set as a minter of the token",  async () => {
      expect(await token.isMinter(deployerAddr)).to.equal(true)
  })
  
  it("should have the cap set at 10,000 tokens",  async () => {
      expect(await token.cap()).to.equal(ethers.utils.parseEther('10000'))
  })

 	it("should have minted presale amount, team amount, and any aditional", async () => {
			await token.mint(await accounts[1].getAddress(), ethers.utils.parseEther(String(1000)))
  		expect(await token.balanceOf(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther(String(1000)))
 			expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("3967"))
  		expect(await token.balanceOf(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther(String(1000)))
  })

	// function approve(address spender, uint tokens)  public returns (bool);
	// function transferFrom(address from, address to, uint tokens) public returns (bool);
	it("should have ERC20: totalSupply() function", async () => {
		expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("3967"))
	})


	it("should have ERC20: balanceOf() function", async () => {
		expect(await token.balanceOf(await accounts[2].getAddress())).to.equal(ethers.utils.parseEther("0"))
	})


	it("should have ERC20: allowance() function", async () => {
		expect(await token.allowance(await accounts[2].getAddress(),await accounts[0].getAddress())).to.equal(ethers.utils.parseEther("0"))
	})


	it("should have ERC20: transfer() function: Test Transfer and New Balance Amount(s)", async () => {
		//create token signer for account 1
		let contractWithSigner1 = token.connect(accounts[1]);
		await contractWithSigner1.transfer(await accounts[0].getAddress(),ethers.utils.parseEther("1.5"))
		expect(await token.balanceOf(await accounts[0].getAddress())).to.equal(ethers.utils.parseEther("2968.5")) //2967 + 1.5
		expect(await token.balanceOf(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther("998.5"))
	})

	it("should have ERC20: approve() function: Test Approve, then Allowance", async () => {
		let contractWithSigner1 = token.connect(accounts[1]);
		await contractWithSigner1.approve(await accounts[8].getAddress(), ethers.utils.parseEther("69.420"));
		expect(await token.allowance(await accounts[1].getAddress(),await accounts[8].getAddress())).to.equal(ethers.utils.parseEther("69.420"))
	})

	it("should have ERC20: transferFrom(): transferFrom using the Allowee's Signature", async () =>{
		let contractWithSigner8 = token.connect(accounts[8]);

		//transferFrom
		await contractWithSigner8.transferFrom(await accounts[1].getAddress(),await accounts[9].getAddress(), ethers.utils.parseEther(".420"))

		//expect balance of 1 to be 9998.5 - .42
		expect(await token.balanceOf(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther("998.08"))

		//expect balance of 8 to be .42
		expect(await token.balanceOf(await accounts[9].getAddress())).to.equal(ethers.utils.parseEther(".420"))

		//expect allowane to be 69.420 - 420
		expect(await token.allowance(await accounts[1].getAddress(),await accounts[8].getAddress())).to.equal(ethers.utils.parseEther("69"))
	})

}).timeout(80000000);

// describe("DBKCrowdsale: Initialization", function() {
	
// 	//First make sure all linking is correct
// 	it("should set the intial rate to 500DBK:1ETH (test rate only)" , async () => {
// 		expect((await crowdsale.rate()).toString()).to.equal("500")	
// 	})
// 	it("should set the selling cap to 1000 tokens", async () => {
// 		expect(await crowdsale.cap()).to.equal(ethers.utils.parseEther("1000"))	
// 	})
// 	it("should set the token address", async () => {
// 		expect(await crowdsale.token()).to.equal(token.address)	
// 	})
// 	it("has Admin Role functionality", async () => {
// 			expect(await crowdsale.isAdmin(await accounts[4].getAddress())).to.equal(true)
// 	})
// 	it("has Pausing functionality (Admin Only)", async () => {
// 		let contractWithSigner4 = crowdsale.connect(accounts[4]);
// 		expect(await crowdsale.paused()).to.equal(false)
// 		await contractWithSigner4.pause()
// 		expect(await crowdsale.paused()).to.equal(true)
// 	})
// 	it("has Rate Changing Functionality (Admin Only)", async () => {
// 		let contractWithSigner4 = crowdsale.connect(accounts[4]);

// 		await contractWithSigner4.changeRate(20)
// 		expect((await crowdsale.rate()).toString()).to.equal("20")	
// 	})

// 	it("has Tokens Sold Cap Raising Functionality (Admin Only)", async () => {
// 		let contractWithSigner4 = crowdsale.connect(accounts[4]);

// 		await contractWithSigner4.raiseCap(500)
// 		expect(await crowdsale.cap()).to.equal(ethers.utils.parseEther("1500"));	
// 	})
	
// })
// describe("DBKCrowdsale and DBKToken: Linking", function() {
// 	it("Token should allow minter_role to be given to the contract (only deployer) ", async ()=>{
// 		//grantRole from the 
// 		let contractWithSigner = token.connect(accounts[0]);
// 		await contractWithSigner.addMinter(crowdsale.address)
// 	})


// 	it("should have token buying functionality (only when unpaused)", async () => {
// 		//unpause it to make it usable
// 		let contractWithSigner4 = crowdsale.connect(accounts[4]);
// 		expect(await crowdsale.paused()).to.equal(true)
// 		await contractWithSigner4.unpause()
// 		expect(await crowdsale.paused()).to.equal(false)

// 		let contractWithSigner2 = crowdsale.connect(accounts[2]);
// 		// let tx = await contractWithSigner.buyTokens(await account1.getAddress(), {value: acnt1});
// 		await contractWithSigner2.buyTokens(await accounts[2].getAddress(), {value: ethers.utils.parseEther("0.5")})
// 		expect(await token.balanceOf(await accounts[2].getAddress())).to.equal(ethers.utils.parseEther(String(0.5*20)));	
// 		// console.log(parseInt((await token.totalSupply()).toString())/1e18)
// 		// console.log(parseInt((await crowdsale.tokensSold()).toString())/1e18)
// 	})

// 	it("should convert ALL ETH in the contract to given stablecoin", async ()=> {
// 		console.log("\t IN WORK")
// 	})

// })

// describe("DBKStake: Initialization", function() {
// 	// IERC20Upgradeable public rewardsToken; //stablecoin
//  //  IERC20Upgradeable public stakingToken; //DBK or LP Token
// 	it("should have the rewards token set as given stablecoin", async ()=> {
// 			expect(await stake.rewardsToken()).to.equal(rewardToken.address);	
// 	})

// 	it("should have the staking token set as DBKToken", async ()=> {
// 			expect(await stake.stakingToken()).to.equal(token.address);	
// 	})

// 	it("deployer should have 1,000,000 reward tokens", async ()=> {
// 			expect(await rewardToken.balanceOf(await accounts[0].getAddress())).to.equal(ethers.utils.parseEther("1000000"))
// 	})

// 	it("deployer has Admin Role functionality", async () => {
// 			expect(await stake.isAdmin(await accounts[0].getAddress())).to.equal(true)
// 	})

// 	it('should allow admin to be set', async ()=>{
// 			await stake.addAdmin(await accounts[9].getAddress())
// 			expect(await stake.isAdmin(await accounts[9].getAddress())).to.equal(true)
// 	})

// 	it("should not seed first pool until approved", async ()=>{
// 			// fails: expect(await stake.seedFirstPool(1611320658, 100000000))
// 	})

// 	it("should seed first pool after approved", async ()=>{
// 			await rewardToken.approve(stake.address, ethers.utils.parseEther("10000"));
// 			expect(await stake.seedFirstPool(ethers.utils.parseEther("1000"),parseInt(Date.now()/1000)))
// 	})	

// 	it("should set the base reward for cycle 1" , async ()=> {
// 		// check deviation threshold of 1 units
// 		expect(await stake._baseReward(1) - 1).to.be.lt(ethers.utils.parseEther("0.0001033399471"))
// 		expect(await stake._baseReward(1) + 1).to.be.gt(ethers.utils.parseEther("0.0001033399471"))
// 	})

// }).timeout(80000000);

// describe("DBKStake: Use Cases", function () {
// 	it("Stake 10 ", async ()=> {
// 			//account 1 has 1000 tokens
// 			let tokenWithSigner1 = token.connect(accounts[1]);
// 			let stakeWithSigner1 = stake.connect(accounts[1]);

// 			//requires approval 
// 			await tokenWithSigner1.approve(stake.address, ethers.utils.parseEther("10"));

// 			//stake 10 tokens
// 			await stakeWithSigner1.stake(ethers.utils.parseEther("10"));
			
// 			// mapping(uint256 => mapping(address=> Stake)) public _stakeOnCycle;
// 			let stake_object = await stakeWithSigner1._stakeOnCycle(1,await accounts[1].getAddress());
// 			expect(stake_object.amountStaked).to.equal(ethers.utils.parseEther("10"));
// 			expect(await stake._userStakedOnCycle(1,await accounts[1].getAddress())).to.equal(true);
// 			// console.log("Time User Staked: " + String(stake_object.timeStaked))
// 			// console.log("Pool Start: " + String((await stake._poolTimes(1)).start))
// 			// console.log("Pool End: " + String((await stake._poolTimes(1)).end))

// 			// for (var i =0; i< 50;i++){
// 			// 		console.log(String(await stakeWithSigner1.earnedOnCyle(1)));
// 			// 		await delay(10000);
// 			// }
// 	}).timeout(80000000)
	
// 	it("Stake has a total of 10 tokens in staking", async ()=> {
// 		expect(await stake._totalStakingSupplyOnCycle(1)).to.equal(ethers.utils.parseEther("10"));
// 	})

// 	it("should allow a deposit for the next pool by the admin", async ()=>{
// 			//deposit 100 tokens
// 			await stake.depositForNextPool(ethers.utils.parseEther("100"), 0);
// 	})

// 	it("should disallow a deposit for the next pool after doing it a single time", async ()=>{
// 			//deposit 100 tokens -- error check
// 			await tryCatch(stake.depositForNextPool(ethers.utils.parseEther("100"), 0), errTypes.revert);
// 	})

// 	it("should return multiplier correctly", async ()=>{
// 			let stakeWithSigner1 = stake.connect(accounts[1]);
// 			expect(await stakeWithSigner1.multiplier(1)).to.equal(1)	
// 			expect(await stakeWithSigner1.multiplier(2)).to.equal(0)	
// 	})


// 	it("Unstake 10 after 6 years should be the same reward as if they unstaked 7 days later: ", async ()=>{

// 			//increment by mining
// 			ethers.provider.send("evm_increaseTime", [60]) //increase 60s
// 			ethers.provider.send("evm_mine")

// 			// console.log("Duration Staked: " + String(await stake.durationStaked(1, await accounts[1].getAddress())))
			
// 			let stakeWithSigner1 = stake.connect(accounts[1]);
// 			// console.log("Reward Earned After 60s: " + String((await stakeWithSigner1.earnedOnCycle(1))/1e18))

// 			//increment by mining
// 			ethers.provider.send("evm_increaseTime", [90000]) //increase 60s
// 			ethers.provider.send("evm_mine")

// 			// console.log("Reward Earned after a day: " + String((await stakeWithSigner1.earnedOnCycle(1))/1e18))

// 			//increment by mining
// 			ethers.provider.send("evm_increaseTime", [500000]) //increase 60s
// 			ethers.provider.send("evm_mine")

// 			// console.log("Reward Earned after 6 days staked : " + String((await stakeWithSigner1.earnedOnCycle(1))/1e18))

// 			//increment by mining
// 			ethers.provider.send("evm_increaseTime", [14730]) //to first second of next pool
// 			ethers.provider.send("evm_mine")
// 			let max_allowed_raw = await stakeWithSigner1.earnedOnCycle(1)
// 			let max_allowed = String(max_allowed_raw);
// 			// console.log("Reward Earned after any duration staked in the same pool past the pool deadline (capped) : " + parseInt(max_allowed)/1e18)
// 			// console.log(String(await stake._totalStakingSupplyOnCycle(1)))
			
// 			//unstake after long time
// 			await stakeWithSigner1.unstake(1)

// 			expect(await rewardToken.balanceOf(await accounts[1].getAddress())).to.equal(max_allowed)
// 			expect(await stake._totalStakingSupplyOnCycle(1)).to.equal(ethers.utils.parseEther("10"))
// 			console.log("\tLeftOver from cycle 1: " + String((await stake._totalRewardSupplyOnCycle(1))/1e18))
			
// 	})
// });

// describe("DBKStake: Extended Use Cases", function () {
// 	it("transfer staking tokens to different accounts so the can stake", async ()=>{
// 			expect(await stake._totalRewardSupplyOnCycle(2)).to.equal(ethers.utils.parseEther("100"))

// 			//account1 minted 1000 and transfer 1.5 to account 0
// 			//account 0: 1.5
// 			//account 2: 10 from crowdsale
// 			//account 1 : 999.08
// 			//account 9 : 0.420
// 			account0 = await accounts[0].getAddress()
// 			account1 = await accounts[1].getAddress()
// 			account9 = await accounts[9].getAddress()
// 			expect(await token.balanceOf(account0)).to.equal(ethers.utils.parseEther("2968.5"))
// 			expect(await token.balanceOf(account1)).to.equal(ethers.utils.parseEther("998.08"))
// 			expect(await token.balanceOf(account9)).to.equal(ethers.utils.parseEther("0.420"))

// 			//account 3-8 will receive 50 staking tokens each
// 			let tokenWithSigner1 = token.connect(accounts[1]);
// 			for (var i = 3; i < 9;i++){
// 				await tokenWithSigner1.transfer(await accounts[i].getAddress(), ethers.utils.parseEther("100"))	

// 				let tokenWithSignerI = token.connect(accounts[i])
// 				await tokenWithSignerI.approve(stake.address, ethers.utils.parseEther("5000000000000"))
// 				expect(await token.balanceOf(await accounts[i].getAddress())).to.equal(ethers.utils.parseEther("100"))
// 				expect(await token.allowance(await accounts[i].getAddress(),stake.address)).to.equal(ethers.utils.parseEther("5000000000000"))
// 			}
// 	})


// 	//stochastically test stake and unstake
// 	it("stochastic unstaking and restaking and maintain reward balances: ",async() =>{
// 			ethers.provider.send("evm_increaseTime", [200]) //to first second of next pool
// 			ethers.provider.send("evm_mine")

// 			let stakeSigner;
// 			let stakeSigner2;

// 			for(var i = 3; i < 5 ; i++){
// 				if(i < 9 ){
// 					let random_amount = parseInt(getRandomFloat(1,50));
// 					console.log("\t *Account " + String(i) + " staked " + String(random_amount) + " DBK on day " + String(i-3));	
// 					//randomly stake with account
// 					stakeSigner = stake.connect(accounts[i])
// 					await stakeSigner.stake(ethers.utils.parseEther(String(random_amount)))	
// 					if(i == 3){
// 						for(var k= 3; k < 9 ; k++){
// 							stakeSigner4 = stake.connect(accounts[k])
// 							await stakeSigner4.stake(ethers.utils.parseEther(String(1)))	
// 							await tryCatch(stakeSigner4.unstake(2), errTypes.revert);
// 							console.log("\t *Account " + k + " staked " + String(1) + " DBK on day " + String(i-3));	
// 						}
// 					}

// 					//read earned amount
// 					console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")
// 					for(var j = 3; j < 9 ; j++){
// 							stakeSigner2 = stake.connect(accounts[j])
// 							console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 					}
// 					console.log("\n")
// 					if(i == 5){
// 						//unstake account 4 
// 						stakeSigner4 = stake.connect(accounts[4])
// 						await stakeSigner4.unstake(2)
// 						console.log("\t *Account " + String(4) + " unstaked on day " + String(i-3));	
// 						console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")
// 						for(var j = 3; j < 9 ; j++){
// 								stakeSigner2 = stake.connect(accounts[j])
// 								console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 						}
// 						console.log("\n")
// 					}
// 					if(i == 6){
// 						stakeSigner5 = stake.connect(accounts[5])
// 						await stakeSigner5.unstake(2)
// 						console.log("\t *Account " + String(5) + " unstaked on day " + String(i-3));	
// 						console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")
// 						for(var j = 3; j < 9 ; j++){
// 								stakeSigner2 = stake.connect(accounts[j])
// 								console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 						}
// 						console.log("\n")						
// 						await stakeSigner5.stake(ethers.utils.parseEther("1"))
// 						console.log("\t *Account " + String(5) + " re staked on day " + String(i-3));	
// 						console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")
// 						for(var j = 3; j < 9 ; j++){
// 								stakeSigner2 = stake.connect(accounts[j])
// 								console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 						}
// 						console.log("\n")
// 					}
// 					if(i == 8){

// 						let stakeSigner4 = stake.connect(accounts[4]);
// 						console.log("***Attempting a dilution attack!***")
// 						await stakeSigner4.stake(ethers.utils.parseEther("50"))
// 						console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")
// 						for(var j = 3; j < 9 ; j++){
// 								stakeSigner2 = stake.connect(accounts[j])
// 								console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 						}
// 						console.log("\n")
// 					}

// 				} else {
					
// 					//read earned amount
// 					console.log("\n\t ==== Day " + String(i-3) + " Rewards ==== ")

// 					if(i == 11){
// 						//unstake account 3
// 						let stakeSigner3 = stake.connect(accounts[3]);
// 						await stakeSigner3.unstake(2)

// 					}
// 					for(var j = 3; j < 9 ; j++){
// 							stakeSigner2 = stake.connect(accounts[j])
// 							console.log("\tAccount " + String(j) + " earned: " + String(await stakeSigner2.earnedOnCycle(2)/1e18) + " Reward Tokens")
// 					}
// 					console.log("\n")
// 				}
				
// 				//increment time
// 				ethers.provider.send("evm_increaseTime", [86400]) // advance half a day
// 				ethers.provider.send("evm_mine")


// 			}

// 			//read out rewards on day 6



// 	}).timeout(8000000000);

	

// }).timeout(8000000000);;

// // describe("DBKTeamContract: Initialization", function () {
// // 	// uint256 public amountAllocated;
// // 	// uint256 public amountUnallocated;

// // 	it("set vest time " , async () => {
// // 		expect(await team.vestTime()).to.equal(7*52*7*24*3600 + 604800)
// // 	})

// // 	it("set lock time " , async () => {
// // 		expect(await team.lockTime()).to.equal(3*52*7*24*3600 + 3*24*3600)
// // 	})

// // 	it("set DBK token", async ()=> {
// // 		expect(await team.DBK()).to.equal(token.address)
// // 	})

// // 	it("set deployer as team admin", async ()=> {
// // 		expect(await team.isTeamAdmin(await accounts[0].getAddress())).to.equal(true)
// // 	})

// // 	it("set no team members on deployment", async ()=> {
// // 		expect(await team.isTeamMember(await accounts[0].getAddress())).to.equal(false)
// // 	})	
// // })


// // describe("DBKTeamContract: Functionality", function () {
// // 	// uint256 public amountAllocated;
// // 	// uint256 public amountUnallocated;

// // 	it("adds to team fund " , async () => {
// // 		await token.approve(team.address, ethers.utils.parseEther("1000"))
// // 		await team.addTeamFund(ethers.utils.parseEther("1000"))
// // 		expect(await token.balanceOf(team.address)).to.equal(ethers.utils.parseEther("1000"))
// // 		expect(await team.amountAllocated()).to.equal(0)
// // 		expect(await team.amountUnallocated()).to.equal(ethers.utils.parseEther("1000"))
// // 	})

// // 	it("add team member", async ()=>{
// // 		let now = parseInt(Date.now()/1000)
// // 		await team.addTeamMember(await accounts[1].getAddress(), ethers.utils.parseEther("50"))
// // 		expect(await team.isTeamMember(await accounts[1].getAddress())).to.equal(true)
// // 		expect(await team.isTeamAdmin(await accounts[1].getAddress())).to.equal(false)
// // 		expect(await team.amountAllocated()).to.equal(ethers.utils.parseEther("50"))
// // 		expect(await team.amountUnallocated()).to.equal(ethers.utils.parseEther("950"))
// // 		expect(await team.memberAllocation(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther("50"))
// // 		expect(await team.memberStartTime(await accounts[1].getAddress())).to.be.gt(now)
// // 	})

// // 	it("earned amount linear over time", async () => {
// // 			//advance clock
// // 			ethers.provider.send("evm_increaseTime", [125798400]) // advance half a day
// // 			ethers.provider.send("evm_mine")
// // 			console.log("Before Claim (year 4):" + String(await team.calculateReward(String((await accounts[1].getAddress())))/1e18))
// // 			let team1 = team.connect(accounts[1])
// // 			await team1.claimTokens()
// // 			console.log("After Claim (year 4): " + String(await team.calculateReward(String((await accounts[1].getAddress())))/1e18))
			
// // 	})

// // 	it("team member earned full amount after 10 years", async ()=>{
// // 		//advance clock
// // 		ethers.provider.send("evm_increaseTime", [86400000000000]) // advance half a day
// // 		ethers.provider.send("evm_mine")
// // 		console.log("Claimable amount after 10 years: " + String(await team.calculateReward(await accounts[1].getAddress())/1e18) )
// // 		expect(await team.calculateReward(await accounts[1].getAddress())).to.be.gt(ethers.utils.parseEther("41"))
// // 	})
// // })


// // describe("DBKBaseContract: Functionality", function () {
// // 	// uint256 public amountAllocated;
// // 	// uint256 public amountUnallocated;

// // 	it("adds to team fund " , async () => {
// // 		await token.approve(team.address, ethers.utils.parseEther("1000"))
// // 		await team.addTeamFund(ethers.utils.parseEther("1000"))
// // 		expect(await token.balanceOf(team.address)).to.equal(ethers.utils.parseEther("1000"))
// // 		expect(await team.amountAllocated()).to.equal(0)
// // 		expect(await team.amountUnallocated()).to.equal(ethers.utils.parseEther("1000"))
// // 	})

// // 	it("add team member", async ()=>{
// // 		let now = parseInt(Date.now()/1000)
// // 		await team.addTeamMember(await accounts[1].getAddress(), ethers.utils.parseEther("50"))
// // 		expect(await team.isTeamMember(await accounts[1].getAddress())).to.equal(true)
// // 		expect(await team.isTeamAdmin(await accounts[1].getAddress())).to.equal(false)
// // 		expect(await team.amountAllocated()).to.equal(ethers.utils.parseEther("50"))
// // 		expect(await team.amountUnallocated()).to.equal(ethers.utils.parseEther("950"))
// // 		expect(await team.memberAllocation(await accounts[1].getAddress())).to.equal(ethers.utils.parseEther("50"))
// // 		expect(await team.memberStartTime(await accounts[1].getAddress())).to.be.gt(now)
// // 	})

// // 	it("earned amount linear over time", async () => {
// // 			//advance clock
// // 			ethers.provider.send("evm_increaseTime", [125798400]) // advance half a day
// // 			ethers.provider.send("evm_mine")
// // 			console.log("Before Claim (year 4):" + String(await team.calculateReward(String((await accounts[1].getAddress())))/1e18))
// // 			let team1 = team.connect(accounts[1])
// // 			await team1.claimTokens()
// // 			console.log("After Claim (year 4): " + String(await team.calculateReward(String((await accounts[1].getAddress())))/1e18))
			
// // 	})

// // 	it("team member earned full amount after 10 years", async ()=>{
// // 		//advance clock
// // 		ethers.provider.send("evm_increaseTime", [86400000000000]) // advance half a day
// // 		ethers.provider.send("evm_mine")
// // 		console.log("Claimable amount after 10 years: " + String(await team.calculateReward(await accounts[1].getAddress())/1e18) )
// // 		expect(await team.calculateReward(await accounts[1].getAddress())).to.be.gt(ethers.utils.parseEther("41"))
// // 	})



// // })



