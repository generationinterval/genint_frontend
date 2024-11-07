import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import SideFilter from "@/components/frag_vis_reg/SideFilter";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import "@/global.css";
import {
  ancestries_noAll,
  chrms_all,
  regions_frag_vis_reg,
  mpp_marks,
  variables,
  color_chrms,
  min_chr_len_marks,
  chr_range_marks,
} from "@/assets/FilterOptions";
import ChromosomeComponent from "@/components/frag_vis_reg/ChromosomeComponent";

interface FilterState {
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

interface DataPoint {
  chrom: string;
  start: number;
  end: number;
  reg: string;
  numind?: number;
  freq?: number;
  column_6?: number;
}

const defaultStat = "Joined";
const defaultRegs = regions_frag_vis_reg.options;
const defaultChrms = chrms_all.options;
const defaultAnc = "All";
const defaultMpp = 0.5;
const defaultChrmsLimits: [number, number] = [0, 250000];
const defaultMinLength = 50;

export const FragVisReg: React.FC = () => {
  const { isSidebarVisible } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
    stat: defaultStat,
    stat_mapped: "joined",
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
        "http://localhost:2208/api/fragvisreg-data",
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
          </>
        )}
        {!loading && !isFiltersApplied && <div>No data to display yet.</div>}
      </Grid>
    </Grid>
  );
};
