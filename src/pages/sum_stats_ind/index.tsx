import PlotDownloadButton from "@/components/shared/PlotDownloadButton/PlotDownloadButton";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import HistogramComponent from "@/components/sum_stats_ind/HistogramComponent";
import "@/components/sum_stats_ind/HistogramComponent.css";
import IDDensityComponent from "@/components/sum_stats_ind/IDDensityComponent";
import MapComponent from "@/components/sum_stats_ind/MapComponent";
import PointComponent from "@/components/sum_stats_ind/PointComponent";
import SideFilter from "@/components/sum_stats_ind/SideFilter";
import { FilterState } from "@/components/sum_stats_ind/ssiStatic";
import TDDensityComponent from "@/components/sum_stats_ind/TDDensityComponent";
import ViolinComponent from "@/components/sum_stats_ind/ViolinComponent";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import TocIcon from "@mui/icons-material/Toc";
import { Button, Grid } from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";

export const SummStatInd: React.FC = () => {
  const [viewTabValue, setViewTabValue] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const { isSidebarVisible } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
    var_1: "",
    var_1_mapped: "",
    data_1: [],
    data_1_mapped: [],
    reg_1: [],
    reg_1_mapped: [],
    mpp_1: 0.5,
    chrms_1: [],
    chrms_1_mapped: [],
    ancs_1: [],
    ancs_1_mapped: [],
    var_2_1: "",
    var_2_1_mapped: "",
    var_2_2: "",
    var_2_2_mapped: "",
    col: [],
    col_mapped: [],
    fac_x: [],
    fac_x_mapped: [],
    fac_y: [],
    fac_y_mapped: [],
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
    map_data: true,
    map_data_rad: 15,
    map_reg: true,
    map_reg_rad: 10,
    map_pop: true,
    map_pop_rad: 15,
    map_ind_rad: 3,
    map_lat_jit: 1,
    map_lon_jit: 1,
    tree_lin: [],
    bandwidth_divisor: 30,
    thresholds: 10,
  });
  const [data, setData] = useState<DataPoint[]>([]); // For holding the fetched data
  const [isFiltersApplied, setIsFiltersApplied] = useState(false); // To check if filters are applied
  const [loading, setLoading] = useState(false); // To handle loading state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10, // Default page size
  });
  useEffect(() => {
    if (filters.plot) {
      applyFilters();
      console.log(filters);
    }
  }, [filters.plot]);
  const applyFilters = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:2208/api/sum-ind-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasets: filters.data_1_mapped,
          mpp_dim1: Math.round(filters.mpp_1 * 100),
          regions: filters.reg_1_mapped,
          ancestries: filters.ancs_1_mapped,
          chromosomes: filters.chrms_1_mapped,
          excluded: filters.tree_lin,
          facet_x: filters.fac_x_mapped,
          facet_y: filters.fac_y_mapped,
          color: filters.col_mapped,
        }),
      });
      console.log("filters:", filters);
      if (!response.ok) {
        throw new Error("Failed to fetch filtered data.");
      }

      const fetchedData = await response.json();
      setData(fetchedData);
      setIsFiltersApplied(true);
    } catch (error) {
      console.error("Error:", error);
      setIsFiltersApplied(false);
    } finally {
      setLoading(false);
    }
  };
  const handleViewTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setViewTabValue(newValue);
  };
  // Function to download data as CSV
  const handleDownloadCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "data.csv");
  };

  // Inside your component
  const plotRef = useRef<HTMLDivElement | null>(null);
  const handleOpenDataOverview = () => {
    setViewTabValue(1); // Set tab to Data Overview view
  };
  const handleOpenPlot = () => {
    setViewTabValue(0); // Set tab to Visualization view
  };
  const handleDownloadPlot = () => {
    const svgElement = plotRef.current?.querySelector("svg"); // Get the SVG element
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement); // Serialize SVG to string
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob); // Create URL from the SVG blob

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgElement.clientWidth;
      canvas.height = svgElement.clientHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, "plot.png"); // Save as PNG using file-saver
          }
          URL.revokeObjectURL(url); // Clean up the URL object
        });
      }
    };

    img.src = url; // Set image source to the URL
  };
  const columns: GridColDef[] = [
    {
      field: "lin",
      headerName: "Individual_Dataset",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "ind",
      headerName: "Individual",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "dat",
      headerName: "Data",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "chrom",
      headerName: "Chromosome",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "anc",
      headerName: "Ancestry",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "hap",
      headerName: "Haplotype",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "len_mea",
      headerName: "Mean Length (bp)",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "len_med",
      headerName: "Median Length (bp)",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    {
      field: "seq",
      headerName: "Sequence",
      width: 170,
      headerClassName: "super-app-theme--header", // Apply header class
    },
    // Add more columns as needed
  ];
  return (
    <Grid
      container
      spacing={2}
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {isSidebarVisible && (
        <Grid
          item
          xs={12}
          sm={4}
          md={3}
          lg={2}
          style={{
            height: "100%",
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
        lg={isSidebarVisible ? 10 : 12}
        style={{
          height: "100%",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          position: "relative", // Added for absolute positioning of buttons
        }}
      >
        {loading && <div>Loading...</div>} {/* Show a loading indicator */}
        {viewTabValue === 0 && !loading && isFiltersApplied && (
          <Grid
            item
            xs={12}
            className="plot-container"
            ref={plotRef}
            style={{
              width: "100%",
              height: "100%",
              flexGrow: 1,
              position: "relative",
            }} // Ensure the container is relatively positioned
          >
            {filters.plot === "Histogram" ? (
              <HistogramComponent
                data={data}
                var_1_mapped={filters.var_1_mapped}
                col={filters.col_mapped}
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
                bandwidth_divisor={filters.bandwidth_divisor}
                col={filters.col_mapped}
                isSidebarVisible={isSidebarVisible}
                mea_med_1={filters.mea_med_1}
                y_axis={filters.y_axis}
                min_y_axis={filters.min_y_axis}
                max_y_axis={filters.max_y_axis}
              />
            ) : filters.plot === "Points" ? (
              <PointComponent
                data={data}
                var_x_mapped={filters.var_2_1_mapped}
                var_y_mapped={filters.var_2_2_mapped}
                col={filters.col_mapped}
                isSidebarVisible={isSidebarVisible}
                mea_med_x={filters.mea_med_x}
                mea_med_y={filters.mea_med_y}
                x_axis={filters.x_axis}
                min_x_axis={filters.min_x_axis}
                max_x_axis={filters.max_x_axis}
                y_axis={filters.y_axis}
                min_y_axis={filters.min_y_axis}
                max_y_axis={filters.max_y_axis}
              />
            ) : filters.plot === "2D Density" ? (
              <TDDensityComponent
                data={data}
                var_x_mapped={filters.var_2_1_mapped}
                var_y_mapped={filters.var_2_2_mapped}
                col={filters.col_mapped}
                isSidebarVisible={isSidebarVisible}
                mea_med_x={filters.mea_med_x}
                mea_med_y={filters.mea_med_y}
                x_axis={filters.x_axis}
                min_x_axis={filters.min_x_axis}
                max_x_axis={filters.max_x_axis}
                y_axis={filters.y_axis}
                min_y_axis={filters.min_y_axis}
                max_y_axis={filters.max_y_axis}
                bandwidth_divisor={filters.bandwidth_divisor}
                thresholds={filters.thresholds}
              />
            ) : filters.plot === "Density" ? (
              <IDDensityComponent
                data={data}
                var_1_mapped={filters.var_1_mapped}
                col={filters.col_mapped}
                isSidebarVisible={isSidebarVisible}
                mea_med_1={filters.mea_med_1}
                x_axis={filters.x_axis}
                min_x_axis={filters.min_x_axis}
                max_x_axis={filters.max_x_axis}
                y_axis={filters.y_axis}
                min_y_axis={filters.min_y_axis}
                max_y_axis={filters.max_y_axis}
                bandwidth_divisor={filters.bandwidth_divisor}
              />
            ) : filters.plot === "Map" ? (
              <div
                className="map-container"
                style={{ width: "100%", height: "100%", zIndex: 0 }}
              >
                <MapComponent
                  data={data}
                  col={filters.var_1_mapped}
                  col_unmapped={filters.var_1}
                  map_data={filters.map_data}
                  map_data_rad={filters.map_data_rad}
                  map_reg={filters.map_reg}
                  map_reg_rad={filters.map_reg_rad}
                  map_pop={filters.map_pop}
                  map_pop_rad={filters.map_pop_rad}
                  map_ind_rad={filters.map_ind_rad}
                  map_lat_jit={filters.map_lat_jit}
                  map_lon_jit={filters.map_lon_jit}
                />
              </div>
            ) : (
              <div>No plot type selected</div>
            )}

            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "45px", // Position in the lower right corner
                display: "flex",
                flexDirection: "row",
                gap: "5px", // Reduce the gap between the buttons
                width: "auto", // Adjust width to fit the buttons
              }}
            >
              <PlotDownloadButton plotRef={plotRef} fileName="plot" />
              <Button
                onClick={handleOpenDataOverview}
                variant="contained"
                color="primary"
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  borderRadius: "8px",
                  padding: 0,
                }}
              >
                <TocIcon style={{ color: "#FFFFFF" }} />
              </Button>
            </div>
          </Grid>
        )}
        {viewTabValue === 1 && !loading && isFiltersApplied && (
          <Grid
            item
            xs={12}
            style={{
              width: "100%",
              height: "100%",
              flexGrow: 1,
              position: "relative",
            }}
          >
            <DataGrid
              className="custom-data-grid"
              rows={data}
              columns={columns}
              pagination
              autoPageSize // Automatically calculate the number of rows based on the container's height
              getRowId={(row) => `${row.lin}_${row.hap}_${row.anc}`}

            // Ensure correct row identification
            />

            {/* Positioned Buttons for CSV and Plot View */}
            <div
              className="button-container"
              style={{
                position: "absolute",
                bottom: "10px",
                right: "45px",
                display: "flex",
                flexDirection: "row",
                gap: "5px",
                width: "auto",
                zIndex: 9999,
                pointerEvents: "auto",
              }}
            >
              <Button
                onClick={handleDownloadCSV}
                variant="contained"
                color="primary"
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  borderRadius: "8px",
                  padding: 0,
                }}
              >
                <DownloadIcon style={{ color: "#FFFFFF" }} />
              </Button>
              <Button
                onClick={handleOpenPlot}
                variant="contained"
                color="primary"
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  borderRadius: "8px",
                  padding: 0,
                }}
              >
                <ImageIcon style={{ color: "#FFFFFF" }} />
              </Button>
            </div>
          </Grid>
        )}
        {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
      </Grid>
    </Grid>
  );
};
