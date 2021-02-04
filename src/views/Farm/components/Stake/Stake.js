import React, { useCallback, useEffect, useMemo, useState } from "react";

import Countdown, { CountdownRenderProps } from "react-countdown";
import numeral from "numeral";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardIcon,
} from "react-neu";
import { useWallet } from "use-wallet";

import Label from "components/Label";
import Value from "components/Value";

import useFarming from "hooks/useFarming";

import { bnToDec, getFullDisplayBalance } from "utils";

import StakeModal from "./components/StakeModal.js";
import UnstakeModal from "./components/UnstakeModal";
import BigNumber from "bignumber.js";
import { contractAddress, abi } from "../../../../utils/data";
import {
  contractAbiApprove,
  contractAddressApprove,
} from "../../../../utils/ApproveAddress";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Stake = () => {
  const [stakeModalIsOpen, setStakeModalIsOpen] = useState(false);
  const [unstakeModalIsOpen, setUnstakeModalIsOpen] = useState(false);
  const [stakeBalance, setStakeBalance] = useState(0);

  const { status } = useWallet();
  const {
    countdown,
    farmingStartTime,
    isApproved,
    isApproving,
    isStaking,
    isUnstaking,
    onApprove,
    onStakeYAMETH,
    onUnstakeYAMETH,
    stakedBalanceYAMYUSD,
    stakedBalanceYAMETH,
  } = useFarming();

  const handleDismissStakeModal = useCallback(() => {
    setStakeModalIsOpen(false);
    // eslint-disable-next-line
  }, [setStakeModalIsOpen]);

  const handleDismissUnstakeModal = useCallback(() => {
    setUnstakeModalIsOpen(false);
    // eslint-disable-next-line
  }, [setUnstakeModalIsOpen]);

  const stakeTokens = async (amount) => {
    let account = localStorage.getItem("account");
    console.log("amount", amount, account);
    if (account === null) {
      toast.error("metamask is not connected!");
    } else {
      const web3 = window.web3;

      let _amount = amount.toString();
      let contract = new web3.eth.Contract(abi, contractAddress);
      console.log("web=======", web3.utils.toWei(_amount, "ether"));
      try {
        contract.methods
          .stake(web3.utils.toWei(_amount, "ether").toString())
          .send({
            from: account,
            value: web3.utils.toWei(_amount, "ether"),
          })
          .on("transactionHash", async (hash) => {
            console.log("hash", hash);
            toast.info("Transaction is submitted!");
          })
          .on("receipt", async (receipt) => {
            console.log("reciept", receipt);
            toast.success("Transaction is approved!");
          })
          .on("error", async (error) => {
            console.log("error", error);
            toast.error(error?.message);
          });
      } catch (e) {
        console.log("error rejection", e);
        toast.error(e?.message);
      }
    }
  };

  const getBalance = async () => {
    let account = localStorage.getItem("account");

    if (account === null) {
    } else {
      const web3 = window.web3;

      let contract = new web3.eth.Contract(
        contractAbiApprove,
        contractAddressApprove
      );
      console.log(contract.methods);
      try {
        const res = await contract.methods.balanceOf(account).call();
        console.log("resres", web3.utils.fromWei(res, "ether"));
        setStakeBalance(web3.utils.fromWei(res, "ether"));
      } catch (e) {
        console.log("error rejection", e);
      }
    }
  };
  useEffect(() => {
    getBalance();
  }, [localStorage?.getItem("account")]);
  const handleOnStake = useCallback(
    (amount) => {
      stakeTokens(amount);
      handleDismissStakeModal();
    },
    // eslint-disable-next-line
    [handleDismissStakeModal]
  );

  const handleOnUnstake = useCallback(
    (amount) => {
      onUnstakeYAMETH(amount);
      handleDismissUnstakeModal();
    },
    // eslint-disable-next-line
    [handleDismissUnstakeModal, onUnstakeYAMETH]
  );

  const handleStakeClick = useCallback(() => {
    setStakeModalIsOpen(true);
    // eslint-disable-next-line
  }, [setStakeModalIsOpen]);

  const handleUnstakeClick = useCallback(() => {
    setUnstakeModalIsOpen(true);
    // eslint-disable-next-line
  }, [setUnstakeModalIsOpen]);

  const StakeButton = useMemo(() => {
    // if (status !== "connected") {
    return (
      <Button
        full
        text="Stake"
        variant="secondary"
        onClick={handleStakeClick}
      />
    );
    // }
    if (isStaking) {
      return <Button disabled full text="Staking..." variant="secondary" />;
    }
    if (!isApproved) {
      return (
        <Button
          disabled={isApproving}
          full
          onClick={onApprove}
          text={!isApproving ? "Approve staking" : "Approving staking..."}
          variant={
            isApproving || status !== "connected" ? "secondary" : "default"
          }
        />
      );
    }
    if (isApproved) {
      return (
        <Button
          full
          onClick={handleStakeClick}
          text="Stake"
          variant="secondary"
        />
      );
    }

    // eslint-disable-next-line
  }, [countdown, handleStakeClick, isApproving, onApprove, status]);

  const UnstakeButton = useMemo(() => {
    const hasStaked = stakedBalanceYAMETH && stakedBalanceYAMETH.toNumber() > 0;
    if (status !== "connected" || !hasStaked) {
      return <Button disabled full text="Unstake" variant="secondary" />;
    }
    if (isUnstaking) {
      return <Button disabled full text="Unstaking..." variant="secondary" />;
    }
    return (
      <Button
        full
        onClick={handleUnstakeClick}
        text="Unstake"
        variant="secondary"
      />
    );
    // eslint-disable-next-line
  }, [handleUnstakeClick, isApproving, onApprove, status]);

  const renderer = (countdownProps) => {
    const { hours, minutes, seconds } = countdownProps;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const paddedHours = hours < 10 ? `0${hours}` : hours;
    return (
      <Box row justifyContent="center">
        <Label
          text={`Farming starts in ${paddedHours}:${paddedMinutes}:${paddedSeconds}`}
        />
      </Box>
    );
  };

  return (
    <>
      <Card>
        <CardIcon>💰 </CardIcon>
        <CardContent>
          <Box alignItems="center" column>
            <Value value={stakeBalance > 0 ? stakeBalance.toString() : "--"} />
            <Label text="Staked $DBK Tokens" />
          </Box>
        </CardContent>
        <CardActions>
          {/* {UnstakeButton} */}
          {StakeButton}
        </CardActions>
        {typeof countdown !== "undefined" && countdown > 0 && (
          <CardActions>
            <Countdown date={farmingStartTime} renderer={renderer} />
          </CardActions>
        )}
      </Card>
      <ToastContainer />
      <StakeModal
        isOpen={stakeModalIsOpen}
        onDismiss={handleDismissStakeModal}
        onStake={handleOnStake}
      />
      <UnstakeModal
        isOpen={unstakeModalIsOpen}
        onDismiss={handleDismissUnstakeModal}
        onUnstake={handleOnUnstake}
      />
    </>
  );
};

export default Stake;
