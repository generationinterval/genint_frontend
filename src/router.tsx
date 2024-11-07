import React from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { AboutPage } from "@/pages/about";
import { PlotIndex } from "@/pages/plotindex";
import { SummStatInd } from "@/pages/sum_stats_ind";
import { paths } from "@/paths";
import { Layout } from "@/layout/layout";
import { FragVisInd } from "@/pages/frag_vis_ind";
import { FragVisReg } from "@/pages/frag_vis_reg";

export const AppRouter: React.FC<NonNullable<unknown>> = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/plotindex" element={<PlotIndex />} />
        <Route path={paths.summary_stats.per_ind} element={<SummStatInd />} />
        <Route path={paths.fragment.vis_per_ind} element={<FragVisInd />} />
        <Route path={paths.fragment.vis_per_reg} element={<FragVisReg />} />
      </Route>
    </Routes>
  );
};
