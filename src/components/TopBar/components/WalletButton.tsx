import React, { useCallback, useState, useEffect } from "react";
import styled from "styled-components";

import { Button } from "react-neu";
import { useWallet } from "use-wallet";

import UnlockWalletModal from "components/UnlockWalletModal";
import WalletModal from "components/WalletModal";
import { sleep } from "utils";

interface WalletButtonProps {}

const WalletButton: React.FC<WalletButtonProps> = (props) => {
  const [walletModalIsOpen, setWalletModalIsOpen] = useState(false);
  const [unlockModalIsOpen, setUnlockModalIsOpen] = useState(false);
  const [userAccount, setUserAccount] = useState<string | null>();
  const { account, status, connect } = useWallet();

  const handleDismissUnlockModal = useCallback(() => {
    setUnlockModalIsOpen(false);
  }, [setUnlockModalIsOpen]);

  const handleDismissWalletModal = useCallback(() => {
    setWalletModalIsOpen(false);
  }, [setWalletModalIsOpen]);

  const handleWalletClick = useCallback(() => {
    setWalletModalIsOpen(true);
  }, [setWalletModalIsOpen]);

  const handleUnlockWalletClick = useCallback(() => {
    setUnlockModalIsOpen(true);
  }, [setUnlockModalIsOpen]);

  const handleConnectMetamask = useCallback(() => {
    connect("injected");
  }, [connect]);

  const handleConnectWalletConnect = useCallback(() => {
    connect("walletconnect");
    // eslint-disable-next-line
  }, [connect]);

  const checkLocalUserAccount = useCallback(async () => {
    if (!localStorage.getItem("account")) {
      setUserAccount(null);
    }
    // eslint-disable-next-line
  }, []);

  const fetchConnection = useCallback(async () => {
    if (status === "disconnected") {
      setUserAccount(null);
      localStorage.removeItem("account");
    }
    // eslint-disable-next-line
  }, [status, setUserAccount]);

  useEffect(() => {
    checkLocalUserAccount();
    const localAccount: any =
      (account ? account.toString() : false) || localStorage.getItem("account");
    if (account) {
      localStorage.setItem("account", localAccount);
      setUserAccount(localAccount);
    }
    // eslint-disable-next-line
  }, [
    localStorage.getItem("account"),
    account,
    userAccount,
    handleDismissWalletModal,
  ]);

  useEffect(() => {
    let checkConnection = setTimeout(() => {
      fetchConnection();
      if (account) {
      }
    }, 2000);
    return () => {
      clearTimeout(checkConnection);
    };
    // eslint-disable-next-line
  }, [status, fetchConnection]);

  useEffect(() => {
    const localAccount = localStorage.getItem("account");
    const walletProvider = localStorage.getItem("walletProvider");
    if (!account && localAccount) {
      setUserAccount(localAccount);
      if (
        localAccount &&
        (walletProvider === "metamask" || walletProvider === "injected")
      ) {
        handleConnectMetamask();
      }
      if (localAccount && walletProvider === "walletconnect") {
        handleConnectWalletConnect();
      }
    }
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <StyledWalletButton>
        {!localStorage.getItem("account") ? (
          <Button
            onClick={handleUnlockWalletClick}
            size="sm"
            text="Unlock Wallet"
          />
        ) : (
          <Button
            onClick={handleWalletClick}
            size="sm"
            text="Balances"
            variant="tertiary"
          />
        )}
      </StyledWalletButton>
      <WalletModal
        isOpen={walletModalIsOpen}
        onDismiss={handleDismissWalletModal}
      />
      <UnlockWalletModal
        isOpen={unlockModalIsOpen}
        onDismiss={handleDismissUnlockModal}
      />
    </>
  );
};

const StyledWalletButton = styled.div``;

export default WalletButton;
