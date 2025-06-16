import PlotDownloadButton from "@/components/shared/PlotDownloadButton/PlotDownloadButton";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import HistogramComponent from "@/pages/sum_stats_frag/components/HistogramComponent";
import IDDensityComponent from "@/pages/sum_stats_frag/components/IDDensityComponent";
import PointComponent from "@/pages/sum_stats_frag/components/PointComponent";
import SideFilter from "@/pages/sum_stats_frag/components/SideFilter";
import TDDensityComponent from "@/pages/sum_stats_frag/components/TDDensityComponent";
import ViolinComponent from "@/pages/sum_stats_frag/components/ViolinComponent";
import { FilterState, mappingToLong } from "@/pages/sum_stats_frag/static/ssfStatic";
import "@/pages/sum_stats_frag/style/HistogramComponent.css";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import TocIcon from "@mui/icons-material/Toc";
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { Button, Checkbox, Grid, ListItemText, Menu, MenuItem } from "@mui/material";
import { AllCommunityModule, ClientSideRowModelModule, ColDef, ColGroupDef, GridApi, GridReadyEvent, ModuleRegistry, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from "ag-grid-react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";


ModuleRegistry.registerModules([AllCommunityModule]);
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const SummStatFrag: React.FC = () => {
  const [viewTabValue, setViewTabValue] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const { isSidebarVisible } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
    var_1: "",
    var_1_mapped: "",
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
      const response = await fetch(`${API_BASE}/api/sum-frag-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ind_list: filters.tree_lin,
          facet_x: filters.fac_x_mapped,
          facet_y: filters.fac_y_mapped,
          color: filters.col_mapped,
          chrms: filters.chrms_1_mapped,
        }),
      });

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
    const useSci = (abs !== 0 && (abs >= 1e6 || abs < 1e-4));
    return useSci
      ? raw.toExponential(4)
      : raw.toFixed(4);
  };
  const translateFormatter = (params: ValueFormatterParams) => {
    const raw = params.value;
    if (raw == null) return "0";
    const key = String(raw);
    return (mappingToLong as Record<string, string>)[key] ?? key;
  };

  const columns: (ColDef | ColGroupDef)[] = [
    // — always visible string/text columns —
    {
      headerName: "Individual",
      field: "ind",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Dataset",
      field: "dat",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Original dataset",
      field: "oda",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Region",
      field: "reg",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Population",
      field: "pop",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Chromosome",
      field: "chrom",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },
    {
      headerName: "Haplotype",
      field: "hap",
      flex: 1,
      valueFormatter: translateFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        defaultOption: 'contains',
        textFormatter: (r: string) => r.trim().toLowerCase()
      }
    },

    // — numeric columns —
    {
      headerName: "Start",
      field: "start",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter
    },
    {
      headerName: "End",
      field: "end",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter
    },
    {
      headerName: "Length",
      field: "length",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "SNPs",
      field: "snps",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Mean Posterior Prob.",
      field: "mean_prob",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },

    // — ancestry/archaic proportions —
    {
      headerName: "Ancestral",
      field: "anc",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Archaic",
      field: "arc",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Altai",
      field: "alt",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Chagyrskaya",
      field: "cha",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Denisova",
      field: "den",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },
    {
      headerName: "Vindija",
      field: "vin",
      flex: 1,
      filter: 'agNumberColumnFilter',
      valueFormatter: scientificFormatter, hide: true
    },

    // — placeholders with raw names for now —
    { headerName: "car", field: "car", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
    { headerName: "cne", field: "cne", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
    { headerName: "pal", field: "pal", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
    { headerName: "pch", field: "pch", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
    { headerName: "pde", field: "pde", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
    { headerName: "pvi", field: "pvi", flex: 1, filter: 'agNumberColumnFilter', valueFormatter: scientificFormatter, hide: true },
  ]

  // keep a ref to the grid API for later show/hide toggles
  const gridApiRef = useRef<GridApi | null>(null)
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
