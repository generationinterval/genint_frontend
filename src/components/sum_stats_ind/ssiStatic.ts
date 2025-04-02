export interface FilterState {
  var_1: string;
  var_1_mapped: string;
  data_1: string[];
  data_1_mapped: string[];
  reg_1: string[];
  reg_1_mapped: string[];
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
  map_data: boolean;
  map_data_rad: number;
  map_reg: boolean;
  map_reg_rad: number;
  map_pop: boolean;
  map_pop_rad: number;
  map_ind_rad: number;
  map_lat_jit: number;
  map_lon_jit: number;
  tree_lin: string[];
  bandwidth_divisor: number;
  thresholds: number;
}

export const mappingToShort = {
  Autosome: "A",
  X: "X",
  "X Prime": "Xprime",
  All: "All",
  Ambiguous: "Ambiguous",
  Denisova: "Denisova",
  Neanderthal: "Neanderthal",
  Altai: "Altai",
  Vindija: "Vindija",
  Chagyrskaya: "Chagyrskaya",
  AmbigNean: "AmbigNean",
  "Non DAVC": "nonDAVC",
  Individual: "ind",
  Sex: "sex",
  Population: "pop",
  Region: "reg",
  Dataset: "dat",
  "Original dataset": "oda",
  Time: "tim",
  Latitude: "lat",
  Longitude: "lon",
  Chromosome: "chrom",
  Ancestry: "anc",
  "Mean Length (bp)": "len_mea",
  "Median Length (bp)": "len_med",
  "Max Length (bp)": "len_max",
  "Min Length (bp)": "len_min",
  "N Fragments": "nfr",
  "Sequence (bp)": "seq",
  "Anc Africa": "ancAFR",
  "Anc America": "ancAMR",
  "Anc East Asia": "ancEAS",
  "Anc Europe": "ancEUR",
  "Anc Oceania": "ancOCE",
  "Anc South Asia": "ancSAS",
  DATA: "DATA",
  PDAT: "PDAT",
  GNOM: "GNOM",
  PGNO: "PGNO",
  GENI: "GENI",
  PGEN: "PGEN",
  "1KGP": "1KGP",
  HGDP: "HGDP",
  SGDP: "SGDP",
  VANU: "VANU",
  IGDP: "IGDP",
  AYTA: "AYTA",
  OFAR: "OFAR",
  Europe: "EUR",
  MID: "MID",
  "South Asia": "SAS",
  Africa: "AFR",
  "East Asia": "EAS",
  America: "AMR",
  Oceania: "OCE",
  "Central Asia": "CAS",
  Global: "GLOB",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  "11": "11",
  "12": "12",
  "13": "13",
  "14": "14",
  "15": "15",
  "16": "16",
  "17": "17",
  "18": "18",
  "19": "19",
  "20": "20",
  "21": "21",
  "22": "22",
  Joined: "joined",
  Frequency: "freq",
  Shared: "shared",
  Private: "private",
  Haploidy: "hap",
  Start: "start",
  End: "end",
  Length: "length",
  SNPs: "snps",
  "Mean Post. Prob.": "mean_prob",
  "Admix. Pop. Variants": "arc"
}