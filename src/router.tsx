import React from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { AboutPage } from "@/pages/about";
import { SummStatInd } from "@/pages/sum_stats_ind";
import { SummStatGroup } from "@/pages/sum_stats_group";
import { SummStatFrag } from "@/pages/sum_stats_frag";
import { RegSeqCum } from "@/pages/reg_seq_cum";
import { HMMProb } from "@/pages/hmm_prob";
import { OutgroupFilter } from "@/pages/outgroup_filter";
import { paths } from "@/paths";
import { Layout } from "@/layout/layout";
import { FragVisInd } from "@/pages/frag_vis_ind";
import { FragVisReg } from "@/pages/frag_vis_reg";

export const AppRouter: React.FC<NonNullable<unknown>> = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path={paths.others.about} element={<AboutPage />} />
        <Route path={paths.summary_stats.per_ind} element={<SummStatInd />} />
        <Route
          path={paths.summary_stats.per_group}
          element={<SummStatGroup />}
        />
        <Route path={paths.summary_stats.per_frag} element={<SummStatFrag />} />
        <Route path={paths.fragment.vis_per_ind} element={<FragVisInd />} />
        <Route path={paths.fragment.vis_per_reg} element={<FragVisReg />} />
        <Route path={paths.others.reg_seq_cum} element={<RegSeqCum />} />
        <Route path={paths.others.hmm_prob} element={<HMMProb />} />
        <Route
          path={paths.others.outgroup_filter}
          element={<OutgroupFilter />}
        />
      </Route>
    </Routes>
  );
};
