import React from "react";
import styled, { keyframes } from "styled-components";

import { NavLink } from "react-router-dom";

interface MobileMenuProps {
  onDismiss: () => void;
  visible?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onDismiss, visible }) => {
  if (visible) {
    return (
      <StyledMobileMenuWrapper>
        <StyledBackdrop onClick={onDismiss} />
        <StyledMobileMenu>
          <StyledRouterLink
            exact
            activeClassName="active"
            to="/dashboard"
            onClick={onDismiss}
          >
            Dashboard
          </StyledRouterLink>

          <StyledRouterLink
            exact
            activeClassName="active"
            to="/stake"
            onClick={onDismiss}
          >
            Stake
          </StyledRouterLink>
        </StyledMobileMenu>
      </StyledMobileMenuWrapper>
    );
  }
  return null;
};

const StyledBackdrop = styled.div`
  background-color: ${(props) => props.theme.colors.black};
  opacity: 0.75;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const StyledMobileMenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
`;

const slideIn = keyframes`
  0% {
    transform: translateX(0)
  }
  100% {
    transform: translateX(-100%);
  }
`;

const StyledMobileMenu = styled.div`
  animation: ${slideIn} 0.3s forwards ease-out;
  background: ${(props) => props.theme.baseBg};
  display: flex;
  // flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 15px;
  position: absolute;
  top: 0;
  left: 100%;
  bottom: 0;
  width: calc(100% - 48px);
`;

const StyledRouterLink = styled(NavLink)`
  box-sizing: border-box;
  color: #fff !important;
  font-size: 24px;
  font-weight: 700;
  padding: ${(props) => props.theme.spacing[3]}px
    ${(props) => props.theme.spacing[4]}px;
  text-align: center;
  text-decoration: none;
  width: 100%;
  &:hover {
    color: red !important;
  }
  &.active {
    color: red !important;
  }
`;

const StyledLink = styled.a`
  box-sizing: border-box;
  color: ${(props) => props.theme.colors.grey[500]};
  font-size: 24px;
  font-weight: 700;
  padding: ${(props) => props.theme.spacing[3]}px
    ${(props) => props.theme.spacing[4]}px;
  text-align: center;
  text-decoration: none;
  width: 100%;
  &:hover {
    color: ${(props) => props.theme.colors.grey[600]};
  }
  &.active {
    color: ${(props) => props.theme.colors.primary.main};
  }
`;

export default MobileMenu;