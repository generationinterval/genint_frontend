import PlotDownloadButton from "@/components/shared/PlotDownloadButton/PlotDownloadButton";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import HistogramComponent from "@/pages/sum_stats_ind/components/HistogramComponent";
import IDDensityComponent from "@/pages/sum_stats_ind/components/IDDensityComponent";
import MapComponent from "@/pages/sum_stats_ind/components/MapComponent";
import PointComponent from "@/pages/sum_stats_ind/components/PointComponent";
import SideFilter from "@/pages/sum_stats_ind/components/SideFilter";
import TDDensityComponent from "@/pages/sum_stats_ind/components/TDDensityComponent";
import ViolinComponent from "@/pages/sum_stats_ind/components/ViolinComponent";
import { FilterState, mappingToLong } from "@/pages/sum_stats_ind/static/ssiStatic";
import "@/pages/sum_stats_ind/style/HistogramComponent.css";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import TocIcon from "@mui/icons-material/Toc";
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { Button, Checkbox, Grid, ListItemText, Menu, MenuItem } from "@mui/material";
import { AllCommunityModule, ClientSideRowModelModule, ColDef, ColGroupDef, GridApi, GridReadyEvent, ModuleRegistry, ValueFormatterParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from "ag-grid-react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";


ModuleRegistry.registerModules([AllCommunityModule]);

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
    console.log("Data fetched:", data);
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

  const scientificFormatter = (params: ValueFormatterParams) => {
    const raw = params.value as number | null | undefined;
    if (raw == null || isNaN(raw)) return '';

    const abs = Math.abs(raw);
    // tune these thresholds to taste:
    const useSci = (abs !== 0 && (abs >= 1e6 || abs < 1e-4));

    return useSci
      ? raw.toExponential(4)    // e.g. 1.2345e+7
      : raw.toFixed(4);          // e.g. 123.4567
  };
  const translateFormatter = (params: ValueFormatterParams) => {
    const raw = params.value;
    if (raw == null) return "0";
    const key = String(raw);
    return (mappingToLong as Record<string, string>)[key] ?? key;
  };
  const columns: (ColDef | ColGroupDef)[] = [
    // — always visible —
    {
      headerName: "Individual", field: "ind", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Dataset", field: "dat", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Original Dataset", field: "oda", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Region", field: "reg", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Population", field: "pop", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Haplotype", field: "hap", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Sex", field: "sex", flex: 1, valueFormatter: translateFormatter, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Mean Length (bp)", field: "len_mea", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter
    },
    {
      headerName: "Median Length (bp)", field: "len_med", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter
    },

    // — ancestry group (all hidden by default) —
    {
      headerName: "Ancestry Details",
      children: [
        {
          headerName: "Ancestry", field: "anc", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑AFR", field: "ancAFR", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑AMR", field: "ancAMR", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑EAS", field: "ancEAS", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑EUR", field: "ancEUR", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑OCE", field: "ancOCE", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
        {
          headerName: "Anc‑SAS", field: "ancSAS", flex: 1,
          filter: 'agNumberColumnFilter',
          valueFormatter: scientificFormatter, hide: true
        },
      ]
    },

    // — all other columns hidden by default —
    {
      headerName: "Chromosome", field: "chrom", flex: 1, valueFormatter: translateFormatter, hide: true, filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Latitude", field: "lat", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Longitude", field: "lon", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Max Length (bp)", field: "len_max", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Min Length (bp)", field: "len_min", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "N Fragments", field: "nfr", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Sequence", field: "seq", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Time", field: "tim", flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
  ];
  // keep a ref to the grid API
  const gridApiRef = useRef<GridApi | null>(null);

  // for controlling the columns‑menu popover
  const [colMenuAnchor, setColMenuAnchor] = useState<null | HTMLElement>(null);

  // open/close handlers
  const openColMenu = (e: React.MouseEvent<HTMLElement>) => setColMenuAnchor(e.currentTarget);
  const closeColMenu = () => setColMenuAnchor(null);

  // toggle visibility helper
  const toggleColumn = (colId: string) => {
    const api = gridApiRef.current;
    if (!api) return;

    // get the Column object
    const col = api.getColumn(colId);
    const currentlyVisible = col?.isVisible() ?? false;

    // flip it
    api.setColumnsVisible([colId], !currentlyVisible);
  };


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
                bottom: "4px",
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
                  width: "35px",
                  height: "35px",
                  minWidth: "35px",
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
            <div className="ag-theme-alpine" style={{ width: "100%", height: "100%" }}>
              <AgGridReact
                onGridReady={(params: GridReadyEvent) => {
                  gridApiRef.current = params.api;
                }}
                pagination={true}
                paginationAutoPageSize={true}
                columnDefs={columns}
                rowData={data}
                modules={[ClientSideRowModelModule]}
                paginationPageSizeSelector={false}
              />
            </div>

            {/* Positioned Buttons for CSV and Plot View */}
            <div
              className="button-container"
              style={{
                position: "absolute",
                bottom: "4px",
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
                  width: "35px",
                  height: "35px",
                  minWidth: "35px",
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
                  width: "35px",
                  height: "35px",
                  minWidth: "35px",
                  borderRadius: "8px",
                  padding: 0,
                }}
              >
                <ImageIcon style={{ color: "#FFFFFF" }} />
              </Button>
              {/* Column‑selector, now as a Button */}
              <Button
                onClick={openColMenu}
                variant="contained"
                color="primary"
                style={{
                  width: "35px",
                  height: "35px",
                  minWidth: "35px",
                  borderRadius: "8px",
                  padding: 0,
                }}
              >
                <ViewColumnIcon style={{ color: "#FFFFFF" }} />
              </Button>

              {/* the Menu itself stays the same */}
              <Menu
                anchorEl={colMenuAnchor}
                open={Boolean(colMenuAnchor)}
                onClose={closeColMenu}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "bottom", horizontal: "right" }}
              >
                {columns.flatMap(col => {
                  if ((col as ColGroupDef).children) return [];
                  const def = col as ColDef;
                  const id = def.field!;
                  return (
                    <MenuItem key={id} dense onClick={() => toggleColumn(id)}>
                      <Checkbox checked={!def.hide} size="small" />
                      <ListItemText primary={def.headerName} />
                    </MenuItem>
                  );
                })}
              </Menu>
            </div>

          </Grid>
        )}
        {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
      </Grid>
    </Grid>
  );
};
