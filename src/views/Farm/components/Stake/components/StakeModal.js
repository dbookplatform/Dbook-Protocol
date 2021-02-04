import React, { useCallback, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import {
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalProps,
  ModalTitle,
} from "react-neu";

import TokenInput from "components/TokenInput";
import useBalances from "hooks/useBalances";
import { getFullDisplayBalance } from "utils";
import {
  contractAddressApprove,
  contractAbiApprove,
} from "../../../../../utils/ApproveAddress";
import { contractAddress } from "../../../../../utils/data";
import { toast } from "react-toastify";

const StakeModal = ({ isOpen, onDismiss, onStake }) => {
  const [val, setVal] = useState("");
  const { yycrvUniLpBalance, YAMETHLPBalance } = useBalances();

  const fullBalance = useMemo(() => {
    return 0;
  }, []);

  const handleChange = useCallback(
    (e) => {
      setVal(e.currentTarget.value);
    },
    [setVal]
  );

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance);
  }, [fullBalance, setVal]);

  const handleStakeClick = useCallback(() => {
    onStake(val);
  }, [onStake, val]);
  const verify = async () => {
    try {
      let account = localStorage.getItem("account");
      if (account === null || account === undefined) {
        toast.error("metamask is not connected!");
      } else {
        const web3 = window.web3;
        const contract = new web3.eth.Contract(
          contractAbiApprove,
          contractAddressApprove
        );

        let res = await contract.methods
          .approve(contractAddress, web3.utils.toWei(val, "ether"))
          .send({ from: account })
          .on("receipt", async (receipt) => {})
          .on("error", async (error) => {});
        console.log("res", res);
      }
    } catch (e) {
      console.log(e);
      toast.error(e?.message);
    }
  };
  const handleApprove = () => {
    verify();
  };
  return (
    <Modal isOpen={isOpen}>
      <ModalTitle text="Stake" />
      <ModalContent>
        <TokenInput
          value={val}
          onSelectMax={handleSelectMax}
          onChange={handleChange}
          max={fullBalance}
          symbol="$DBK"
        />
      </ModalContent>
      <ModalActions>
        <Button onClick={onDismiss} text="Cancel" variant="secondary" />
        <Button
          disabled={!val || !Number(val)}
          onClick={handleApprove}
          text="Approve"
          variant={!val || !Number(val) ? "secondary" : "default"}
        />
        <Button
          disabled={!val || !Number(val)}
          onClick={handleStakeClick}
          text="Stake"
          variant={!val || !Number(val) ? "secondary" : "default"}
        />
      </ModalActions>
    </Modal>
  );
};

export default StakeModal;
