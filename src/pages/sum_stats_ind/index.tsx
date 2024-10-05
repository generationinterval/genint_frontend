import React, { useState } from "react";
import { Grid } from "@mui/material";
import SideFilter from "@/components/sum_stats_ind/SideFilter";
import HistogramComponent from "@/components/sum_stats_ind/HistogramComponent";
import ViolinComponent from "@/components/sum_stats_ind/ViolinComponent";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import "@/global.css";
import MapComponent from "@/components/sum_stats_ind/MapComponent";

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
  map_data: boolean;
  map_data_rad: number;
  map_reg: boolean;
  map_reg_rad: number;
  map_pop: boolean;
  map_pop_rad: number;
  map_ind_rad: number;
  map_lat_jit: number;
  map_lon_jit: number;
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
    plot: "histogram", // Set default plot type here
    n_bins: 20,
    x_axis: "Free Axis",
    min_x_axis: 0,
    max_x_axis: 0,
    y_axis: "Free Axis",
    min_y_axis: 0,
    max_y_axis: 0,
    map_data: true,
    map_data_rad: 15,
    map_reg: true,
    map_reg_rad: 10,
    map_pop: true,
    map_pop_rad: 15,
    map_ind_rad: 3,
    map_lat_jit: 1,
    map_lon_jit: 1,
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
      setIsFiltersApplied(true); // Allow rendering of components
    } catch (error) {
      console.error("Error:", error);
      setIsFiltersApplied(false); // Disable rendering on error
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
          <>
            {filters.plot === "Histogram" ? (
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
            ) : filters.plot === "Violin" ? (
              <ViolinComponent
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
            ) : filters.plot === "Map" ? (
              <MapComponent
                data={data}
                map_data={filters.map_data}
                map_data_rad={filters.map_data_rad}
                map_reg={filters.map_data}
                map_reg_rad={filters.map_reg_rad}
                map_pop={filters.map_data}
                map_pop_rad={filters.map_pop_rad}
                map_ind_rad={filters.map_ind_rad}
                map_lat_jit={filters.map_lat_jit}
                map_lon_jit={filters.map_lon_jit}
              />
            ) : (
              <div>No plot type selected</div>
            )}
          </>
        )}
        {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
      </Grid>
    </Grid>
  );
};
