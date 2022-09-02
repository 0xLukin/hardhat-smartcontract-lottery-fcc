const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval

      const chainId = network.config.chainId

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        raffleEntranceFee = await raffle.getEntranceFee()
      })

      describe("fulfillRandomWords", function () {
        it("work with live Chainlink Keepers and Chainlink VRF,we get a random winner", async function () {
          console.log("Setting up test...")
          const startingTimeStamp = await raffle.getLatestTimeStamp()
          const accounts = await ethers.getSigners()
          // 先设置监听器，防止block运行的很快
          console.log("Setting up Listener...")
          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicaked", async () => {
              console.log("WinnerPicaked event fired!")

              try {
                const recentWiner = await raffle.getRecentWinner()
                const raffleState = await raffle.getReffleState()
                const winnerEndingBalance = await accounts[0].getBalance()
                const endingTimeStamp = await raffle.getLatestTimeStamp()

                await expect(raffle.getPlayer(0)).to.be.reverted
                assert.equal(recentWiner.toString(), accounts[0].address)
                assert.equal(raffleState, 0)
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(raffleEntranceFee).toString()
                )
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (error) {
                console.log(error)
                reject(e)
              }
            })
            console.log("Entering Raffle...")
            const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
            await tx.wait(1)
            console.log("Ok, time to wait...")
            const winnerStartingBalance = await accounts[0].getBalance()
          })
        })
      })
    })
