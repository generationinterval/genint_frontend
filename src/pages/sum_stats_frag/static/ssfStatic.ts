export interface FilterState {
  var_1: string;
  var_1_mapped: string;
  mpp_1: number;
  chrms_1: string[];
  chrms_1_mapped: string[];
  ancs_1: string[];
  ancs_1_mapped: string[];
  var_2_1: string;
  var_2_1_mapped: string;
  var_2_2: string;
  var_2_2_mapped: string;
  col: string[];
  col_mapped: string[];
  fac_x: string[];
  fac_x_mapped: string[];
  fac_y: string[];
  fac_y_mapped: string[];
  mea_med_1: boolean;
  mea_med_x: boolean;
  mea_med_y: boolean;
  plot: string;
  n_bins: number;
  x_axis: string;
  min_x_axis: number;
  max_x_axis: number;
  y_axis: string;
  min_y_axis: number;
  max_y_axis: number;
  tree_lin: string[];
  bandwidth_divisor: number;
  thresholds: number;
}
export const mappingToLong = {
  EUR: "Europe",
  MID: "Middle East",
  SAS: "South Asia",
  AFR: "Africa",
  EAS: "East Asia",
  AMR: "America",
  OCE: "Oceania",
  CAS: "Central Asia",
  GLOB: "Global",
  DATA: "Diploid",
  PDAT: "Phased",
  A: "Autosome",
  X: "X",
  Xprime: "X Prime",
  F: "Female",
  M: "Male",
  All: "All",
  Ambiguous: "Ambiguous",
  den: "Denisova",
  Neanderthal: "Neanderthal",
  alt: "Altai",
  vin: "Vindija",
  cha: "Chagyrskaya",
  AmbigNean: "AmbigNean",
  nonDAVC: "Non DAVC",
}