import * as React from 'react';
import { useColorScheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';

export default function ColorModeSelect(props: SelectProps) {
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }
  return (
    <Select
      value={mode}
      onChange={(e) => setMode(e.target.value as 'system' | 'light' | 'dark')}
      SelectDisplayProps={{
        // @ts-ignore
        'data-screenshot': 'toggle-mode',
      }}
      {...props}
    >
      <MenuItem value="system">Тема</MenuItem>
      <MenuItem value="light">Светлая</MenuItem>
      <MenuItem value="dark">Тёмная</MenuItem>
    </Select>
  );
}
