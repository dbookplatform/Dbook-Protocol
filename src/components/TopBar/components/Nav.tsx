import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

const Nav: React.FC = () => {
  return (
    <StyledNav>
      <StyledRouterLink exact activeClassName="active" to="/dashboard">
        Dashboard
      </StyledRouterLink>

      <StyledRouterLink exact activeClassName="active" to="/stake">
        Stake
      </StyledRouterLink>
    </StyledNav>
  );
};

const StyledNav = styled.nav`
  align-items: center;
  display: flex;
`;

const StyledRouterLink = styled(NavLink)`
  color: white;
  font-weight: 700;
  padding-left: ${(props) => props.theme.spacing[3]}px;
  padding-right: ${(props) => props.theme.spacing[3]}px;
  text-decoration: none;
  &:hover {
    color: red;
  }
  &.active {
    color: red;
  }
`;

const StyledLink = styled.a`
  color: ${(props) => props.theme.colors.grey[500]};
  padding-left: ${(props) => props.theme.spacing[3]}px;
  padding-right: ${(props) => props.theme.spacing[3]}px;
  text-decoration: none;
  font-weight: bold;
  &:hover {
    color: ${(props) => props.theme.colors.grey[600]};
  }
`;

export default Nav;
