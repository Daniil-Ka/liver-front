import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';

// Sample menu items
export const MENU_ITEMS = [
  {
    title: "Услуги",
    subMenus: [
      {
        title: "Дисконтные карты",
      },
      {
        title: "Обмен с партнерами",
      },
      {
        title: "Брак",
      },
    ],
  },
  {
    title: "Клиенты",
    subMenus: [
      {
        title: "Клиент 1",
      },
      {
        title: "Клиент 2",
      },
    ],
  },
];

const DropdownMenuItem = ({
  menuItem,
  menuShowingDropdown,
  setMenuShowingDropdown,
}) => {
  const { title, subMenus } = menuItem;
  const buttonRef = React.useRef(null);

  const showSubMenu = () => {
    setMenuShowingDropdown(menuItem.title);
  };

  const closeSubMenu = () => {
    setMenuShowingDropdown("");
  };

  const subMenusNodes = subMenus?.map((subMenuItem) => (
    <MenuItem
      onClick={() => {
        console.log(`${subMenuItem.title} clicked`);
        closeSubMenu();
      }}
      key={subMenuItem.title}
    >
      {subMenuItem.title}
    </MenuItem>
  ));

  const theme = useTheme();

  return (
    <>
      <Button
        ref={buttonRef}
        sx={{ zIndex: theme.zIndex.modal + 1 }}
        onMouseEnter={showSubMenu}
        onMouseLeave={closeSubMenu}
      >
        {title} {subMenus ? "↓" : ""}
      </Button>
      <Menu
        anchorEl={buttonRef.current}
        open={menuShowingDropdown === menuItem.title}
        onClose={closeSubMenu}
        PaperProps={{
          onMouseEnter: showSubMenu,
          onMouseLeave: closeSubMenu,
        }}
      >
        {subMenusNodes}
      </Menu>
    </>
  );
};

export default function Header() {
  const [menuShowingDropdown, setMenuShowingDropdown] = React.useState("");

  const handleMenuShowingDropdownChange = (menuTitle) => {
    setMenuShowingDropdown(menuTitle);
  };

  const menuItems = MENU_ITEMS.map((menuItem) => (
    <DropdownMenuItem
      key={menuItem.title}
      menuItem={menuItem}
      menuShowingDropdown={menuShowingDropdown}
      setMenuShowingDropdown={handleMenuShowingDropdownChange}
    />
  ));

  return (
    <AppBar
      position="fixed"
      sx={{
        boxShadow: 0,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MuiToolbar>
        <Stack direction="row" spacing={2}>
          {menuItems}
        </Stack>
      </MuiToolbar>
    </AppBar>
  );
}
