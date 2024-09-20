import React, { useState } from "react";
import { Grid } from "@mui/material";
import SideFilter from "@/components/sum_stats_ind/SideFilter";
import HistogramComponent from "@/components/sum_stats_ind/HistogramComponent";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import "@/global.css";

interface FilterState {
  var_1: string;
  var_1_mapped: string;
  data_1: string[];
  reg_1: string[];
  mpp_1: number;
  chrms_1: string[];
  ancs_1: string[];
  var_2_1: string;
  var_2_1_mapped: string;
  var_2_2: string;
  var_2_2_mapped: string;
  data_2_1: string[];
  data_2_2: string[];
  reg_2_1: string[];
  reg_2_2: string[];
  mpp_2_1: number;
  mpp_2_2: number;
  chrms_2_1: string[];
  chrms_2_2: string[];
  ancs_2_1: string[];
  ancs_2_2: string[];
  col: string[];
  fac_x: string[];
  fac_y: string[];
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
}

interface DataPoint {
  ind: string;
  dat: string;
  chrom: string;
  anc: string;
  hap: number;
  len_mea: number;
  len_med: number;
  len_max: number;
  len_min: number;
  nfr: number;
  seq: number;
  sex: string;
  pop: string;
  reg: string;
  oda: string;
  tim: number;
  lat: number;
  lon: number;
  cre: string;
  cda: string;
  lin: string;
  ancAMR: number;
  ancEAS: number;
  ancSAS: number;
  ancAFR: number;
  ancEUR: number;
  ancOCE: number;
  fac_x: string | null; // Assuming fac_x and fac_y might be null
  fac_y: string | null;
  col: string;
}
export const SummStatInd: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { isSidebarVisible } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
    var_1: "",
    var_1_mapped: "",
    data_1: [],
    reg_1: [],
    mpp_1: 0.5,
    chrms_1: [],
    ancs_1: [],
    var_2_1: "",
    var_2_1_mapped: "",
    var_2_2: "",
    var_2_2_mapped: "",
    data_2_1: [],
    data_2_2: [],
    reg_2_1: [],
    reg_2_2: [],
    mpp_2_1: 0.5,
    mpp_2_2: 0.5,
    chrms_2_1: [],
    chrms_2_2: [],
    ancs_2_1: [],
    ancs_2_2: [],
    col: [],
    fac_x: [],
    fac_y: [],
    mea_med_1: false,
    mea_med_x: false,
    mea_med_y: false,
    plot: "",
    n_bins: 20,
    x_axis: "Free Axis",
    min_x_axis: 0,
    max_x_axis: 0,
    y_axis: "Free Axis",
    min_y_axis: 0,
    max_y_axis: 0,
  });
  const [data, setData] = useState<DataPoint[]>([]); // For holding the fetched data
  const [isFiltersApplied, setIsFiltersApplied] = useState(false); // To check if filters are applied
  const [loading, setLoading] = useState(false); // To handle loading state

  const applyFilters = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:2208/api/histogram-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasets: filters.data_1,
          mpp_dim1: Math.round(filters.mpp_1 * 100),
          regions: filters.reg_1,
          ancestries: filters.ancs_1,
          chromosomes: filters.chrms_1,
          excluded: [], // Example, or pass actual excluded filters
          facet_x: filters.fac_x,
          facet_y: filters.fac_y,
          color: filters.col,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch filtered data.");
      }

      const fetchedData = await response.json(); // JSON array directly
      setData(fetchedData); // Set directly since the structure is correct
      setIsFiltersApplied(true); // Allow histogram rendering
    } catch (error) {
      console.error("Error:", error);
      setIsFiltersApplied(false); // Disable histogram rendering on error
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <Grid container spacing={2} style={{ height: "100vh", overflow: "hidden" }}>
      {isSidebarVisible && (
        <Grid
          item
          xs={12}
          sm={4}
          md={3}
          lg={3}
          style={{
            height: "90vh",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <SideFilter
            tabValue={tabValue}
            setTabValue={setTabValue}
            filters={filters} // Pass the full filters object here
            setFilters={setFilters} // Pass the setFilters function
            applyFilters={applyFilters}
          />
        </Grid>
      )}

      <Grid
        item
        xs={12}
        sm={isSidebarVisible ? 8 : 12}
        md={isSidebarVisible ? 9 : 12}
        lg={isSidebarVisible ? 9 : 12}
        style={{ height: "100%", padding: "10px", display: "flex" }}
      >
        {loading && <div>Loading...</div>} {/* Show a loading indicator */}
        {!loading && isFiltersApplied && data.length > 0 && (
          <HistogramComponent
            data={data}
            var_1_mapped={filters.var_1_mapped}
            col={filters.col}
            n_bins={filters.n_bins}
            isSidebarVisible={isSidebarVisible}
            mea_med_1={filters.mea_med_1}
            x_axis={filters.x_axis}
            min_x_axis={filters.min_x_axis}
            max_x_axis={filters.max_x_axis}
            y_axis={filters.y_axis}
            min_y_axis={filters.min_y_axis}
            max_y_axis={filters.max_y_axis}
          />
        )}
        {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
      </Grid>
    </Grid>
  );
};
