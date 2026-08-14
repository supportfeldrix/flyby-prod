import { createTheme } from '@mui/material/styles';
import palette from './palette';
import typography from './typography';
import components from './components';

const theme = createTheme({
  palette,
  typography,
  components,
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
});

export default theme;
