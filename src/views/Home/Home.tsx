import React from "react";
import { Container, Spacer, useTheme } from "react-neu";

import Page from "components/Page";
import PageHeader from "components/PageHeader";

import useBalances from "hooks/useBalances";
import useVesting from "hooks/useVesting";

import MigrationNotice from "./components/MigrationNotice";
import RegisterVoteNotice from "./components/RegisterVoteNotice";
import Treasury from "./components/Treasury";
import VestingNotice from "./components/VestingNotice";

const Home: React.FC = () => {
  const { darkMode } = useTheme();
  const { yamV2Balance } = useBalances();
  const { vestedBalance } = useVesting();
  return (
    <Page>
      <PageHeader
        icon={darkMode ? "🌚" : "🌞"}
        subtitle={
          darkMode
            ? "🤫 shhh... the DBOOKs are sleeping."
            : "It's a great day to farm DBOOKs!"
        }
        title="Welcome to DBOOK."
      />
      <Container>
        <RegisterVoteNotice />
        <Spacer />
        {yamV2Balance && yamV2Balance.toNumber() > 0 && (
          <>
            <MigrationNotice />
            <Spacer />
          </>
        )}
        {vestedBalance && vestedBalance.toNumber() > 0 && (
          <>
            <VestingNotice />
            <Spacer />
          </>
        )}
        <Treasury />
      </Container>
    </Page>
  );
};

export default Home;
