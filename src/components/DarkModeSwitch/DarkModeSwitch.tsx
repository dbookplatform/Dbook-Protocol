import React, { useEffect } from "react";

import { Emoji, Switch, SwitchButton, useTheme } from "react-neu";

import useLocalStorage from "hooks/useLocalStorage";

const DarkModeSwitch: React.FC = () => {
  const { darkMode, onToggleDarkMode } = useTheme();
  const [_, setDarkModeSetting] = useLocalStorage("darkMode", darkMode);

  useEffect(() => {
    if (!darkMode) {
      onToggleDarkMode();
    }
    if (darkMode) {
      document.documentElement.style.setProperty(
        "--gridline-drop-shadow",
        "drop-shadow( 0px 1px 0px rgba(30, 30,30, 0.13))"
      );
    } else {
      document.documentElement.style.setProperty(
        "--gridline-drop-shadow",
        "drop-shadow(0 -1px 0px hsl(338deg 20% 90% / 100%))"
      );
    }
    setDarkModeSetting(darkMode);
    // eslint-disable-next-line
  }, [darkMode, setDarkModeSetting]);

  return (
    <>
      {/* <Switch>
       <SwitchButton active={!darkMode} onClick={onToggleDarkMode} round>
         <Emoji emoji="🌞" />
       </SwitchButton>
       <SwitchButton active={darkMode} onClick={onToggleDarkMode} round>
         <Emoji emoji="🌚" />
       </SwitchButton>
     </Switch> */}
    </>
  );
};

export default DarkModeSwitch;
