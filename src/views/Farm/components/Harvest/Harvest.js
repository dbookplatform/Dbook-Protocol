import React, { useCallback, useEffect, useMemo, useState } from "react";

import numeral from "numeral";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardIcon,
  Spacer,
} from "react-neu";
import { useWallet } from "use-wallet";

import Label from "components/Label";
import Value from "components/Value";

import useFarming from "hooks/useFarming";

import { bnToDec } from "utils";
import { contractAddress, abi } from "../../../../utils/data";
import { toast } from "react-toastify";

const Harvest = () => {
  const [earnedBalance, setEarnedBalance] = useState(0);
  const { status } = useWallet();
  const {
    earnedBalanceYAMETH,
    isHarvesting,
    isRedeeming,
    onHarvestYAMETH,
  } = useFarming();

  const formattedEarnedBalance = useCallback(async () => {
    if (earnedBalanceYAMETH && bnToDec(earnedBalanceYAMETH) > 0) {
      setEarnedBalance(bnToDec(earnedBalanceYAMETH));
    } else {
      setEarnedBalance(0);
    }
  }, [earnedBalanceYAMETH, setEarnedBalance]);

  useEffect(() => {
    formattedEarnedBalance();
    let refreshInterval = setInterval(formattedEarnedBalance, 10000);
    return () => clearInterval(refreshInterval);
  }, [formattedEarnedBalance]);

  const unStakeTokens = async () => {
    // let _amount = amount.toString()
    console.log("unstkae");
    // you have nothing staked
    let account = localStorage.getItem("account");
    console.log("account", account);

    if (account && account !== null) {
      const web3 = window.web3;
      console.log("account", account);

      let contract = new web3.eth.Contract(abi, contractAddress);
      console.log("contract", contract);

      contract.methods
        .unstake(account)
        .send({ from: account })
        .on("transactionHash", async (hash) => {
          console.log("hash", hash);
          toast.success("Transaction is Submitted");

          // let obj = {
          //   show: true,
          //   severity: "info",
          //   message: "Your transaction is pending",
          //   title: "Stake",
          // };
          // setMessage(obj);
          // handleToggleBackdrop();
          // setDropMessage("Your transaction is pending");
        })
        .on("receipt", async (receipt) => {
          console.log("recept", receipt);
          toast.success("Transaction is completed");

          // handleCloseBackdrop();
          // setDropMessage("");
          // stakeAmount = await getUserData();
        })
        .on("error", async (error) => {
          console.log("error", error);
          toast.error(error?.message);

          // let obj = {
          //   show: true,
          //   severity: "error",
          //   message: "User denied transaction",
          //   title: "",
          // };
          // setMessage(obj);
          // handleCloseBackdrop();
          // setDropMessage("");
        });
    } else {
      toast.error("metamask is not connected!");

      // let obj = {
      //   show: true,
      //   severity: "info",
      //   message:
      //     stakeAmount.toString() === "0.000"
      //       ? "You have nothing stake"
      //       : "Please wait for the timer to run out before unstaking",
      // };
      // setMessage(obj);
    }
  };

  const HarvestAction = useMemo(() => {
    return (
      <Button
        // disabled
        full
        text="Unstake and claim"
        onClick={unStakeTokens}
        variant="secondary"
        style={{ cursor: "pointer" }}
      />
    );
  }, []);

  return (
    <>
      <Card>
        <CardIcon>💵</CardIcon>
        <CardContent>
          <Box alignItems="center" column>
            <Value
              value={earnedBalance > 0 ? earnedBalance.toString() : "--"}
            />
            <Label text="Unstake & Claim USDT" />
          </Box>
        </CardContent>
        <CardActions>{HarvestAction}</CardActions>
      </Card>
    </>
  );
};

export default Harvest;
