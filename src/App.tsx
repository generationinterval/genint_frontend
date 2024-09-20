import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./router";

import "@/responsive.css";
import "@/global.css";

import "@/layout/layout.css";

import "@/components/sum_stats_ind/HistogramComponent.css";
import "@/components/sum_stats_ind/SideFilter.css";

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
