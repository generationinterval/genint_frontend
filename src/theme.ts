import { createTheme } from '@mui/material/styles';

const customDropdownTheme = createTheme({
  components: {
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', 
          minHeight: '32px', 
        },
      },
    },
  },
});

export default customDropdownTheme;
