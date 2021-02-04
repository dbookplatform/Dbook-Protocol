import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useWallet } from "use-wallet";
import { contributors } from "utils/misc";

const Nav: React.FC = () => {
  const { account, status } = useWallet();

  const CheckContributor = useMemo(() => {
    if (
      status === "connected" &&
      contributors.hasOwnProperty(account?.toLowerCase())
    ) {
      return (
        <StyledRouterLinkColor exact to="/contributor">
          Contributor
        </StyledRouterLinkColor>
      );
    }
  }, [status, account]);

  return (
    <StyledNav>
      {/* <StyledRouterLink exact to="/addresses">
        Addresses
      </StyledRouterLink> */}
      <StyledLink
        href="https://github.com/dbookplatform/Dbook-Protocol"
        target="_blank"
      >
        Github
      </StyledLink>
      {/* <StyledLink href="https://twitter.com/YamFinance" target="_blank">
        Twitter
      </StyledLink> */}
      <StyledLink href=" https://t.me/dbkcommunity" target="_blank">
        Telegram
      </StyledLink>
      <StyledLink href="https://t.me/dbookannvote" target="_blank">
        Telegram Ann/Vote
      </StyledLink>
      <StyledLink href="https://dbookplatform.medium.com/" target="_blank">
        Medium
      </StyledLink>
      <StyledLink href="https://twitter.com/dbookplatform" target="_blank">
        Twitter
      </StyledLink>
      {/* <StyledLink href="https://docs.yam.finance/" target="_blank">
        Dbook @ {new Date().getFullYear()}
      </StyledLink> */}
      {CheckContributor}
    </StyledNav>
  );
};

const StyledNav = styled.nav`
  align-items: center;
  display: flex;
`;

const StyledLink = styled.a`
  color: ${(props) => props.theme.colors.grey[500]};
  padding-left: ${(props) => props.theme.spacing[3]}px;
  padding-right: ${(props) => props.theme.spacing[3]}px;
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.colors.grey[600]};
  }
`;

const StyledRouterLink = styled(NavLink)`
  color: ${(props) => props.theme.colors.grey[500]};
  padding-left: ${(props) => props.theme.spacing[3]}px;
  padding-right: ${(props) => props.theme.spacing[3]}px;
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.colors.grey[600]};
  }
`;

const StyledRouterLinkColor = styled(StyledRouterLink)`
  color: ${(props) => props.theme.colors.primary.main};
`;

export default Nav;
