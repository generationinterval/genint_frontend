import {
  ancestries_frag_vis_reg,
  ancestries_noAll,
  chr_range_marks,
  chrms_all,
  min_chr_len_marks,
  mpp_marks,
  regions_frag_vis_reg,
  statistic_frag_vis_reg,
  variables
} from "@/assets/FilterOptions";
import MultipleSelectChip from "@/components/shared/MultipleSelect/multipleselect";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import React from "react";

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

interface SideFilterProps {
  filters: FilterState; // Use your FilterState type here
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // Function to set the filters
  applyFilters: () => Promise<void>;
}

type MappingKey = keyof typeof variables.mappingToShort;
type MappingAnc = keyof typeof ancestries_noAll.mapping;

const SideFilter: React.FC<SideFilterProps> = ({
  filters,
  setFilters,
  applyFilters,
}) => {
  const handleSingleMap =
    (key: keyof FilterState) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      const mappedValue = variables.mappingToShort[value as MappingKey];

      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: value, // Original value for display
        [`${key}_mapped`]: mappedValue, // Mapped value for backend
      }));
    };

  const handleAncChange =
    (key: keyof FilterState) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      const mappedValue = ancestries_noAll.mapping[value as MappingAnc];

      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: value, // Original value for display
        [`${key}_mapped`]: mappedValue, // Mapped value for backend
      }));
    };

  const handleSingleNoMap =
    (key: keyof FilterState) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;

      setFilters((prevFilters: FilterState) => ({
        ...prevFilters,
        [key]: value,
      }));
    };

  const handleMultiMap =
    (key: keyof FilterState) => (selectedValues: string[]) => {
      const mappedValues = selectedValues.map(
        (v) => variables.mappingToShort[v as MappingKey]
      );

      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: selectedValues, // Original values for display
        [`${key}_mapped`]: mappedValues, // Mapped values for backend
      }));
    };

  const handleMultiNoMap =
    (key: keyof FilterState) => (selectedValues: string[]) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: selectedValues,
      }));
    };

  const handleCheckbox =
    (key: keyof FilterState) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prevFilters) => ({
          ...prevFilters,
          [key]: event.target.checked,
        }));
      };
  const handleNumberRangeChange = (
    key: keyof FilterState,
    newValue: number[]
  ) => {
    setFilters((prevFilters: FilterState) => ({
      ...prevFilters,
      [key]: newValue, // Update the key (e.g., chrms_limits) with the new range
    }));
  };

  const handleSlider =
    (key: keyof FilterState) => (event: Event, newValue: number | number[]) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: newValue as number,
      }));
    };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5">1- Select Statistic:</Typography>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel id="stat_select-label">Statistic</InputLabel>
          <Select
            labelId="stat_select-label"
            id="stat_select"
            value={filters.stat} // Bind to the original value for display
            label="Statistic"
            onChange={handleSingleMap("stat")}
          >
            {statistic_frag_vis_reg.options.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <MultipleSelectChip
          sx={{ mb: 1, mt: 1 }}
          options={regions_frag_vis_reg.options}
          label="Regions"
          selectedValues={filters.regs}
          onChange={handleMultiMap("regs")}
        />
        <MultipleSelectChip
          sx={{ mb: 1, mt: 1 }}
          options={chrms_all.options}
          label="Chromosomes"
          selectedValues={filters.chrms}
          onChange={handleMultiMap("chrms")}
        />
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel id="ancestry_select-label">Ancestry</InputLabel>
          <Select
            labelId="ancestry_select-label"
            id="ancestry_select"
            value={filters.anc} // Bind to the original value for display
            label="Ancestry"
            onChange={handleAncChange("anc")}
          >
            {ancestries_frag_vis_reg.options.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 1,
            mt: 1,
          }}
        >
          <Typography
            className="contrast-text"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Mean Posterior Prob.
          </Typography>
          <Slider
            value={filters.mpp}
            onChange={handleSlider("mpp")}
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            step={0.05}
            marks={mpp_marks}
            min={0.5}
            max={0.95}
            sx={{ width: "85%" }}
          />
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 1,
            mt: 1,
          }}
        >
          {/* Text label for Chromosome region */}
          <Typography
            className="contrast-text"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Chromosome region (kbp limits)
          </Typography>

          {/* Range slider for controlling chrms_limits */}
          <Slider
            value={filters.chrms_limits} // Bind the slider to chrms_limits from FilterState
            onChange={(event, newValue) =>
              handleNumberRangeChange("chrms_limits", newValue as number[])
            }
            aria-labelledby="range-slider"
            valueLabelDisplay="auto"
            step={5000} // Assuming the range will change by 1
            marks={chr_range_marks} // Marks for the slider
            min={0} // Minimum value from chrms_limits
            max={250000} // Maximum value from chrms_limits
            sx={{ width: "85%" }}
          />
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 1,
            mt: 1,
          }}
        >
          <Typography
            className="contrast-text"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Minimum fragment length (kbp)
          </Typography>
          <Slider
            value={filters.min_length}
            onChange={handleSlider("min_length")}
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            step={10}
            marks={min_chr_len_marks}
            min={0}
            max={1000}
            sx={{ width: "85%" }}
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ flexGrow: 1, minWidth: "50%" }}
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SideFilter;
