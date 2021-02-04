import React from "react";
import { Container, Spacer } from "react-neu";

import Page from "components/Page";
import PageHeader from "components/PageHeader";
import styled from "styled-components";
import Charts from "./components/Charts";
import TopCards from "./components/TopCards";

const Dashboard: React.FC = () => {
  return (
    <Page>
      <PageHeader
        icon="📊"
        subtitle="Overview of the Dbook Platform"
        title="Dbook Platform Dashboard"
      />
      <Container size="lg">
        <TopCards />
        {/* <Charts /> */}
      </Container>
    </Page>
  );
};

const StyledCharts = styled.div`
  padding: 0px;
`;

export default Dashboard;