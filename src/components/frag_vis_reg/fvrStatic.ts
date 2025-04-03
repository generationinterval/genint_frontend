
export interface DataPoint {
  chrom: string;
  start: number;
  end: number;
  reg: string;
  pres_numind?: number;
  numind?: number;
  freq?: number;
}

export interface FilterState {
  stat: string;
  stat_mapped: string;
  regs: string[];
  regs_mapped: string[];
  chrms: string[];
  chrms_mapped: string[];
  anc: string;
  anc_mapped: string;
  mpp: number;
  chrms_limits: [number, number];
  min_length: number;
}


export const variables = {
  statistic: ["Joined", "Frequency", "Shared", "Private"],
  regions: ["Europe",
    "MID",
    "South Asia",
    "Central Asia",
    "East Asia",
    "America",
    "Oceania",
    "Global"],
  chrms: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "X",
  ],
  anc: ["All", "Ambiguous", "Denisova", "Neanderthal", "Non DAVC"]
}
export const mappingToShort = {
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
  X: "X",
  All: "All",
  Ambiguous: "Ambiguous",
  Denisova: "Denisova",
  Neanderthal: "Neanderthal",
  "Non DAVC": "nonDAVC",
  Europe: "EUR",
  MID: "MID",
  "South Asia": "SAS",
  "East Asia": "EAS",
  America: "AMR",
  Oceania: "OCE",
  "Central Asia": "CAS",
  Global: "GLOB",
  Joined: "joined",
  Frequency: "freq",
  Shared: "shared",
  Private: "private",
}

export const mappingToLong = {
  EUR: "Europe",
  MID: "MID",
  SAS: "South Asia",
  AFR: "Africa",
  EAS: "East Asia",
  AMR: "America",
  OCE: "Oceania",
  CAS: "Central Asia",
  GLOB: "Global"
}