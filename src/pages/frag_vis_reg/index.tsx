import ChromosomeComponent from "@/components/frag_vis_reg/ChromosomeComponent";
import { DataPoint, FilterState, variables } from "@/components/frag_vis_reg/fvrStatic";
import SideFilter from "@/components/frag_vis_reg/SideFilter";
import PlotDownloadButton from "@/components/shared/PlotDownloadButton/PlotDownloadButton";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import { Grid } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const defaultStat = "Frequency";
const defaultRegs = variables.regions;
const defaultChrms = variables.chrms;
const defaultAnc = "All";
const defaultMpp = 0.5;
const defaultChrmsLimits: [number, number] = [0, 250000];
const defaultMinLength = 50;

export const FragVisReg: React.FC = () => {
  const { isSidebarVisible } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
    stat: defaultStat,
    stat_mapped: "freq",
    regs: defaultRegs,
    regs_mapped: ["EUR", "MID", "SAS", "CAS", "EAS", "AMR", "OCE", "GLOB"],
    chrms: defaultChrms,
    chrms_mapped: [
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
      "Xprime",
    ],
    anc: defaultAnc,
    anc_mapped: "All",
    mpp: defaultMpp,
    chrms_limits: defaultChrmsLimits,
    min_length: defaultMinLength,
  });
  const [data, setData] = useState<DataPoint[]>([]); // For holding the fetched data
  const [isFiltersApplied, setIsFiltersApplied] = useState(false); // To check if filters are applied
  const [loading, setLoading] = useState(false); // To handle loading state
  const plotRef = useRef<HTMLDivElement | null>(null);
  const applyFilters = async () => {
    setLoading(true);
    console.log(
      JSON.stringify({
        stat: filters.stat_mapped,
        regions: filters.regs_mapped,
        ancestry: filters.anc_mapped,
        mpp: Math.round(filters.mpp * 100),
        chromosomes: filters.chrms_mapped,
      })
    );

    try {
      const response = await fetch(
        `${API_BASE}/api/fragvisreg-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stat: filters.stat_mapped,
            regions: filters.regs_mapped,
            ancestry: filters.anc_mapped,
            mpp: Math.round(filters.mpp * 100),
            chromosomes: filters.chrms_mapped,
          }),
        }
      );

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

  useEffect(() => {
    applyFilters(); // Fetch data when the component first renders
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        height: "100vh",
        width: "100vw",
        paddingTop: "9vh",
        overflowY: "hidden", // Prevent scrolling in the main container
      }}
    >
      <Grid container spacing={2} style={{ height: "100%" }}>
        {isSidebarVisible && (
          <Grid
            item
            xs={12}
            sm={4}
            md={3}
            lg={2}
            style={{
              height: "100%", // Ensure it takes the parent's full height
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto", // Allow vertical scrolling for the sidebar only
              paddingLeft: "20px",
            }}
          >
            <SideFilter
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
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden", // Prevent scrolling in the plot area

          }}
        >
          {loading && <div>Loading...</div>} {/* Show a loading indicator */}
          {!loading && isFiltersApplied && data.length > 0 && (
            <Grid
              item
              xs={12}
              className="plot-container"
              ref={plotRef}
              style={{
                position: "relative",
                overflow: "hidden",
              }} // Ensure the container is relatively positioned
            >
              <ChromosomeComponent
                data={data}
                stat={filters.stat_mapped}
                isSidebarVisible={isSidebarVisible}
                chrms={filters.chrms}
                regs={filters.regs_mapped}
                anc={filters.anc_mapped}
                chrms_limits={filters.chrms_limits}
                min_length={filters.min_length}
              />
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
              </div>
            </Grid>
          )}
          {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
        </Grid>
      </Grid>
    </div>
  );
};
