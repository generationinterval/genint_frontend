import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./router";

import "@/responsive.css";

import "@/layout/layout.css";

import "@/components/sum_stats_ind/HistogramComponent.css";
import "@/components/sum_stats_ind/SideFilter.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AppRouter />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
