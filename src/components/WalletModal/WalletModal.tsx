import React, { useCallback, useState, useEffect } from "react";

import BigNumber from "bignumber.js";
import styled from "styled-components";
import { useWallet } from "use-wallet";

import numeral from "numeral";
import {
  Box,
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalProps,
  ModalTitle,
  Separator,
  Spacer,
} from "react-neu";

import FancyValue from "components/FancyValue";
import Split from "components/Split";

import useBalances from "hooks/useBalances";
import useVesting from "hooks/useVesting";

const WalletModal: React.FC<ModalProps> = ({ isOpen, onDismiss }) => {
  const [walletModalIsOpen, setWalletModalIsOpen] = useState(false);
  const { reset } = useWallet();
  const { yamV2Balance, yamV3Balance } = useBalances();

  const { vestedDelegatorRewardBalance, vestedMigratedBalance } = useVesting();

  const getDisplayBalance = useCallback((value?: BigNumber) => {
    if (value) {
      return numeral(value).format("0.00a");
    } else {
      return "--";
    }
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("account");
    localStorage.removeItem("walletProvider");
    setWalletModalIsOpen(false);
    reset();
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss, reset]);

  useEffect(() => {
    isOpen = !isOpen;
  }, [setWalletModalIsOpen]);

  return (
    <div style={{ background: "#1e1e1e !important" }}>
      <Modal isOpen={isOpen}>
        <ModalTitle text="My Wallet" />
        <ModalContent>
          <Split>
            <Box row>
              <FancyValue
                icon="💵"
                label="$DBK balance"
                value={getDisplayBalance(yamV3Balance)}
              />
            </Box>
            <Box row>
              <FancyValue
                icon={
                  <span role="img" style={{ opacity: 0.5 }}>
                    💵
                  </span>
                }
                label="$DBKV2 balance"
                value={getDisplayBalance(yamV2Balance)}
              />
            </Box>
          </Split>
          <Spacer />
          <Separator />
          <Spacer />
          <Split>
            <Box row>
              <FancyValue
                icon="🎁"
                label="Vested $DBK (Delegator)"
                value={getDisplayBalance(vestedDelegatorRewardBalance)}
              />
            </Box>
            <Box row>
              <FancyValue
                icon="🦋"
                label="Vested $DBK (Migrated)"
                value={getDisplayBalance(vestedMigratedBalance)}
              />
            </Box>
          </Split>
          <Spacer />
        </ModalContent>
        <Separator />
        <ModalActions>
          <Button onClick={onDismiss} text="Cancel" variant="secondary" />
          <Button onClick={handleSignOut} text="Sign Out" />
        </ModalActions>
      </Modal>
    </div>
  );
};

export default WalletModal;
