import React, { useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalProps,
  ModalTitle,
  Spacer,
} from "react-neu";
import styled from "styled-components";
import { useWallet } from "use-wallet";

import metamaskLogo from "assets/metamask-fox.svg";
import walletConnectLogo from "assets/wallet-connect.svg";

import WalletProviderCard from "./components/WalletProviderCard";
import Web3 from "web3";

const UnlockWalletModal = ({ isOpen, onDismiss }) => {
  const { account, connector, connect } = useWallet();
  const getAccounts = async () => {
    const web3 = window.web3;
    try {
      let accounts = await web3.eth.getAccounts();
      console.log("---", accounts);

      return accounts;
    } catch (error) {
      console.log("Error while fetching acounts: ", error);
      return null;
    }
  };
  const load = async () => {
    if (window?.ethereum) {
      window.web3 = new Web3(window?.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
  };
  const loadWeb3 = async () => {
    let isConnected = false;
    try {
      if (window?.ethereum) {
        window.web3 = new Web3(window?.ethereum);
        await window.ethereum.enable();

        isConnected = true;
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
        isConnected = true;
      } else {
      }
      if (isConnected === true) {
        const web3 = window.web3;

        let accounts = await getAccounts();
        localStorage.setItem("account", accounts[0]);

        // web3.eth.getBalance(accounts[0], function (err, balance) {
        //   console.log(
        //     "========-==-=-=-=-=-",
        //     web3.fromWei(balance, "ether") + " ETH"
        //   );
        // });
        // onDismiss();
        let accountDetails = null;
        window.ethereum.on("accountsChanged", function (accounts) {
          // clearInterval(rev);
          // setAccount(accounts[0]);
          // getUpdateAccount(accounts);
          console.log(accounts);
          localStorage.setItem("account", accounts[0]);
        });
      }
      onDismiss();
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);
  // const handleConnectMetamask = useCallback(() => {
  //   connect("injected");
  // }, [connect]);

  const handleConnectWalletConnect = useCallback(() => {
    connect("walletconnect");
  }, [connect]);

  useEffect(() => {
    if (account) {
      onDismiss && onDismiss();
    }
    if (connector) {
      localStorage.setItem("walletProvider", connector);
    }
  }, [account, connector, onDismiss]);

  return (
    <Modal isOpen={isOpen}>
      <ModalTitle text="Select a wallet provider." />
      <ModalContent>
        <StyledWalletsWrapper>
          <Box flex={1}>
            <WalletProviderCard
              icon={<img src={metamaskLogo} style={{ height: 32 }} />}
              name="Metamask"
              onSelect={loadWeb3}
            />
          </Box>
          <Spacer />
          <Box flex={1}>
            <WalletProviderCard
              icon={<img src={walletConnectLogo} style={{ height: 24 }} />}
              name="WalletConnect"
              onSelect={handleConnectWalletConnect}
            />
          </Box>
        </StyledWalletsWrapper>
      </ModalContent>
      <ModalActions>
        <Box flex={1} row justifyContent="center">
          <Button onClick={onDismiss} text="Cancel" variant="secondary" />
        </Box>
      </ModalActions>
    </Modal>
  );
};

const StyledWalletsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  @media (max-width: 600px) {
    flex-direction: column;
    flex-wrap: none;
  }
`;

export default UnlockWalletModal;
