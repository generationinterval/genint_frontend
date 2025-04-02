import {
  ancestries,
  axis,
  bandwidth_divisor_marks,
  bin_marks,
  chrms_discrete,
  datasets,
  map_jit_marks,
  mpp_marks,
  regions,
  td_bandwidth_divisor_marks,
  td_threshold_divisor_marks,
  variables
} from "@/assets/FilterOptions";
import { icons } from "@/assets/icons";
import { checkboxBoxStyles } from "@/assets/styles";
import MultipleSelectChip from "@/components/shared/MultipleSelect/multipleselect";
import { GmailTreeViewWithText } from "@/components/shared/TreeSelect/TreeSelect";
import { FilterState, mappingToShort } from "@/components/sum_stats_ind/ssiStatic";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import React from "react";
import "./SideFilter.css";


interface SideFilterProps {
  tabValue: number;
  setTabValue: (value: number) => void;
  filters: FilterState; // Use your FilterState type here
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // Function to set the filters
  applyFilters: () => Promise<void>;
}

type MappingKey = keyof typeof mappingToShort;

const plotOptionsSingle = ["Violin", "Histogram", "Density", "Map"];
const plotOptionsDouble = ["Points", "2D Density"];

const SideFilter: React.FC<SideFilterProps> = ({
  tabValue,
  setTabValue,
  filters,
  setFilters,
  applyFilters,
}) => {
  const normalizeOptionName = (option: string) =>
    option.toLowerCase().replace(/\s+/g, "_");

  const handleSingleMap =
    (key: keyof FilterState) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      const mappedValue = mappingToShort[value as MappingKey];

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
        (v) => mappingToShort[v as MappingKey]
      );

      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: selectedValues, // Original values for display
        [`${key}_mapped`]: mappedValues, // Mapped values for backend
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

  const handleSlider =
    (key: keyof FilterState) => (event: Event, newValue: number | number[]) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: newValue as number,
      }));
    };

  const handleColor = (selectedValues: string[]) => {
    const mappedValues = selectedValues.map(
      (v) => mappingToShort[v as MappingKey]
    );

    const selectedDiscrete = mappedValues.filter((v) =>
      variables.discreteOptions
        .map((option) => mappingToShort[option as MappingKey])
        .includes(v)
    );
    const selectedContinuous = mappedValues.filter((v) =>
      variables.continuousOptions
        .map((option) => mappingToShort[option as MappingKey])
        .includes(v)
    );

    if (selectedContinuous.length > 1) {
      alert("You can only select one continuous variable at a time.");
      return;
    }

    if (selectedDiscrete.length > 0 && selectedContinuous.length > 0) {
      alert(
        "You cannot select both discrete and continuous variables at the same time."
      );
      return;
    }

    const disableMeanMedian = selectedContinuous.length > 0;

    setFilters((prevFilters) => ({
      ...prevFilters,
      col: selectedValues, // Original values for display
      col_mapped: [...selectedDiscrete, ...selectedContinuous], // Mapped values for backend
      mea_med_1: disableMeanMedian ? false : prevFilters.mea_med_1, // Reset to false if continuous
      mea_med_x: disableMeanMedian ? false : prevFilters.mea_med_x,
      mea_med_y: disableMeanMedian ? false : prevFilters.mea_med_y,
    }));
  };

  const options = tabValue === 0 ? plotOptionsSingle : plotOptionsDouble;

  const handleNumberInput =
    (key: keyof FilterState) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        const numericValue = Number(value);

        setFilters((prevFilters: FilterState) => ({
          ...prevFilters,
          [key]: numericValue,
        }));
      };

  const handleToggle = (
    event: React.MouseEvent<HTMLElement>,
    newValue: number
  ) => {
    if (newValue !== null) {
      setTabValue(newValue);
      setFilters((prevFilters) => ({
        ...prevFilters,
        plot: "",
      }));
    }
  };
  const handleTreeSelection = (selectedItems: string[]) => {
    // Update tree_lin with selected tree items
    setFilters((prevFilters: FilterState) => ({
      ...prevFilters,
      tree_lin: selectedItems,
    }));
  };
  const getDefaultValuesForPlot = (plotType: string): Partial<FilterState> => {
    switch (plotType) {
      case "Violin":
        return {
          var_1: "Mean Length (bp)",
          var_1_mapped: "len_mea",
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          col: ["Region"],
          col_mapped: ["reg"],
          fac_x: ["Dataset", "Original dataset"],
          fac_x_mapped: ["dat", "oda"],
          fac_y: [],
          fac_y_mapped: [],
          mea_med_1: true,
          y_axis: "Shared Axis",
          min_y_axis: 0,
          max_y_axis: 0,
          tree_lin: ["HGDP00535_HGDP", "HGDP00535_PGNO", "HG02351_1KGP"],
          bandwidth_divisor: 30,
        };
      case "Density":
        return {
          var_1: "Mean Length (bp)",
          var_1_mapped: "len_mea",
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          col: ["Region"],
          col_mapped: ["reg"],
          fac_x: [],
          fac_x_mapped: [],
          fac_y: ["Dataset"],
          fac_y_mapped: ["dat"],
          mea_med_1: true,
          /* n_bins: 50, */
          x_axis: "Define Range",
          min_x_axis: 35000,
          max_x_axis: 95000,
          y_axis: "Free Axis",
          min_y_axis: 0,
          max_y_axis: 0,
          tree_lin: ["HGDP00535_HGDP", "HGDP00535_PGNO", "HG02351_1KGP"],
          bandwidth_divisor: 10,
        };
      case "Histogram":
        return {
          var_1: "Mean Length (bp)",
          var_1_mapped: "len_mea",
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          col: ["Region"],
          col_mapped: ["reg"],
          fac_x: ["Dataset"],
          fac_x_mapped: ["dat"],
          fac_y: ["Original dataset"],
          fac_y_mapped: ["oda"],
          mea_med_1: true,
          n_bins: 50,
          x_axis: "Define Range",
          min_x_axis: 35000,
          max_x_axis: 95000,
          y_axis: "Free Axis",
          min_y_axis: 0,
          max_y_axis: 0,
          tree_lin: ["HGDP00535_HGDP", "HGDP00535_PGNO", "HG02351_1KGP"],
        };
      case "Map":
        return {
          map_data: true,
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          var_1: "Mean Length (bp)",
          var_1_mapped: "len_mea",
          map_data_rad: 50,
          map_reg: true,
          map_reg_rad: 15,
          map_pop: false,
          map_pop_rad: 10,
          map_ind_rad: 3,
          map_lat_jit: 1,
          map_lon_jit: 1,
        };
      case "Points":
        return {
          var_2_1: "Mean Length (bp)",
          var_2_1_mapped: "len_mea",
          var_2_2: "Max Length (bp)",
          var_2_2_mapped: "len_max",
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          col: ["Region"],
          col_mapped: ["reg"],
          fac_x: ["Dataset"],
          fac_x_mapped: ["dat"],
          fac_y: [],
          fac_y_mapped: [],
          mea_med_x: false,
          mea_med_y: false,
          x_axis: "Free Axis",
          min_x_axis: 0,
          max_x_axis: 0,
          y_axis: "Free Axis",
          min_y_axis: 0,
          max_y_axis: 0,
          tree_lin: ["HGDP00535_HGDP", "HGDP00535_PGNO", "HG02351_1KGP"],
        };
      case "2D Density":
        return {
          var_2_1: "Mean Length (bp)",
          var_2_1_mapped: "len_mea",
          var_2_2: "Max Length (bp)",
          var_2_2_mapped: "len_max",
          data_1: ["DATA", "PDAT"],
          data_1_mapped: ["DATA", "PDAT"],
          reg_1: [
            "East Asia",
            "Europe",
            "South Asia",
            "Oceania",
            "Central Asia",
          ],
          reg_1_mapped: ["EAS", "EUR", "SAS", "OCE", "CAS"],
          mpp_1: 0.5,
          chrms_1: ["Autosome"],
          chrms_1_mapped: ["A"],
          ancs_1: ["All"],
          ancs_1_mapped: ["All"],
          col: [],
          col_mapped: [],
          fac_x: [],
          fac_x_mapped: [],
          fac_y: [],
          fac_y_mapped: [],
          mea_med_x: false,
          mea_med_y: false,
          x_axis: "Free Axis",
          min_x_axis: 0,
          max_x_axis: 0,
          y_axis: "Free Axis",
          min_y_axis: 0,
          max_y_axis: 0,
          tree_lin: ["HGDP00535_HGDP", "HGDP00535_PGNO", "HG02351_1KGP"],
          bandwidth_divisor: 10,
          thresholds: 10,
        };


      default:
        return {};
    }
  };

  return (
    <Grid className="side-filter" container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5">1- Select Type of Plot:</Typography>
      </Grid>
      <Grid item xs={12}>
        <ToggleButtonGroup
          value={tabValue}
          id="dimension-toggle"
          exclusive
          onChange={handleToggle}
          aria-label="dimension toggle"
          fullWidth
          sx={{
            "& .MuiToggleButtonGroup-grouped": {
              borderColor: "primary.main",
              color: "primary.main",
              height: "56px", // Set the height to match the default Select height
              padding: "0 16px", // Adjust padding to match Select's padding
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
              },
              "&:hover": {
                backgroundColor: "primary.light",
              },
            },
          }}
        >
          <ToggleButton value={0} aria-label="1 dimension">
            1 Dimension
          </ToggleButton>
          <ToggleButton value={1} aria-label="2 dimensions">
            2 Dimensions
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={12}>
        <ToggleButtonGroup
          value={filters.plot}
          exclusive
          onChange={(event, newPlot) => {
            if (newPlot !== null) {
              const defaultValues = getDefaultValuesForPlot(newPlot);
              setFilters((prevFilters) => ({
                ...prevFilters,
                plot: newPlot,
                ...defaultValues,
              }));
            }
          }}
          aria-label="plot type"
          orientation="vertical"
          fullWidth
          sx={{
            "& .MuiToggleButtonGroup-grouped": {
              height: "40px",
              color: "#003d73", // Default text and SVG color
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white", // Change text and SVG color
              },
            },
          }}
        >
          {options.map((option, index) => (
            <ToggleButton
              key={index}
              value={option}
              aria-label={option}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#003d73", // Default color
                "&.Mui-selected": {
                  color: "white", // Selected color
                },
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  marginRight: 1,
                }}
              >
                {icons.get(normalizeOptionName(option)) || null}{" "}
                {/* Fetch the appropriate SVG */}
              </Box>
              {option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Grid>
      <>
        <Grid item xs={12}>
          <Typography variant="h5">2- Data Filters:</Typography>
        </Grid>
        <Grid item xs={12}>
          <GmailTreeViewWithText
            selectedItems={filters.tree_lin}
            onSelectedItemsChange={handleTreeSelection} // Handle multiselect in tree
          />
        </Grid>
      </>
      <Grid item xs={12}>
        <Grid container spacing={1}>
          {tabValue === 0 && (
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="var_1_select-label">Variable</InputLabel>
                <Select
                  labelId="var_1_select-label"
                  id="var_1_select"
                  value={filters.var_1} // Bind to the original value for display
                  label="Variable"
                  onChange={handleSingleMap("var_1")}
                >
                  {filters.plot === "Density"
                    ? variables.continuousOptions.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))
                    : variables.options_all.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {filters.plot !== "Map" && (
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.mea_med_1}
                        size="small"
                        onChange={handleCheckbox("mea_med_1")}
                        disabled={filters.col.some((col) =>
                          variables.continuousOptions.includes(col)
                        )} // Disable when continuous variable is selected
                      />
                    }
                    label="Mean/Median"
                  />
                </Box>
              )}
            </Grid>
          )}
          {tabValue === 1 && (
            <>
              <Grid item xs={6}>
                <FormControl sx={{ mb: 1 }} fullWidth>
                  <InputLabel id="plot-type-select-label">
                    Variable in X
                  </InputLabel>
                  <Select
                    labelId="plot-type-select-label"
                    id="plot-type-select"
                    value={filters.var_2_1}
                    label="Plot Types"
                    onChange={handleSingleMap("var_2_1")}
                  >
                    {variables.continuousOptions.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.mea_med_x}
                        size="small"
                        onChange={handleCheckbox("mea_med_x")}
                        disabled={filters.col_mapped.some((col) =>
                          variables.continuousOptions.includes(col)
                        )} // Disable when continuous variable is selected
                      />
                    }
                    label="Mean/Median X"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
              </Grid>

              <Grid item xs={6}>
                <FormControl sx={{ mb: 1 }} fullWidth>
                  <InputLabel id="plot-type-select-label">
                    Variable in Y
                  </InputLabel>
                  <Select
                    labelId="plot-type-select-label"
                    id="plot-type-select"
                    value={filters.var_2_2}
                    label="Plot Types"
                    onChange={handleSingleMap("var_2_2")}
                  >
                    {variables.continuousOptions.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.mea_med_y}
                        size="small"
                        onChange={handleCheckbox("mea_med_y")}
                        disabled={filters.col_mapped.some((col) =>
                          variables.continuousOptions.includes(col)
                        )} // Disable when continuous variable is selected
                      />
                    }
                    label="Mean/Median Y"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <MultipleSelectChip
              sx={{ mb: 1 }}
              options={datasets.options}
              label="Datasets"
              selectedValues={filters.data_1}
              onChange={handleMultiMap("data_1")}
            />
            <MultipleSelectChip
              sx={{ mb: 1, mt: 1 }}
              options={ancestries.options}
              label="Ancestries"
              selectedValues={filters.ancs_1}
              onChange={handleMultiMap("ancs_1")}
            />
            <MultipleSelectChip
              sx={{ mb: 1, mt: 1 }}
              options={chrms_discrete.options}
              label="Chromosomes"
              selectedValues={filters.chrms_1}
              onChange={handleMultiMap("chrms_1")}
            />
            <MultipleSelectChip
              sx={{ mb: 1, mt: 1 }}
              options={regions.options}
              label="Region"
              selectedValues={filters.reg_1}
              onChange={handleMultiMap("reg_1")}
            />
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
                value={filters.mpp_1}
                onChange={handleSlider("mpp_1")}
                aria-labelledby="discrete-slider"
                valueLabelDisplay="auto"
                step={0.05}
                marks={mpp_marks}
                min={0.5}
                max={0.95}
                sx={{ width: "85%" }}
              />
            </Box>
          </Grid>

          <>
            <Grid item xs={12}>
              <Typography variant="h5">3- Plot Specific Options:</Typography>
            </Grid>
          </>
          <Grid item xs={12}>
            {filters.plot !== "Map" && (
              <>
                <MultipleSelectChip
                  sx={{ mb: 1 }}
                  options={
                    filters.plot === "Violin" || filters.plot === "Density"
                      ? variables.discreteOptions
                      : [
                        ...variables.discreteOptions,
                        ...variables.continuousOptions,
                      ]
                  }
                  label="Color by"
                  selectedValues={filters.col}
                  onChange={handleColor}
                />

                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={variables.discreteOptions}
                  label="Facet in X"
                  selectedValues={filters.fac_x}
                  onChange={handleMultiMap("fac_x")}
                />

                {filters.plot !== "Violin" && (
                  <MultipleSelectChip
                    sx={{ mb: 1, mt: 1 }}
                    options={variables.discreteOptions}
                    label="Facet in Y"
                    selectedValues={filters.fac_y}
                    onChange={handleMultiMap("fac_y")}
                  />
                )}
                {filters.plot !== "Violin" && (
                  <FormControl sx={{ mb: 1, mt: 1 }} fullWidth>
                    <InputLabel id="x_axis_options">X Axis Options</InputLabel>
                    <Select
                      labelId="x_axis_options"
                      id="x_axis_options"
                      value={filters.x_axis} // Bind to the plot state
                      label="X Axis Options"
                      onChange={handleSingleNoMap("x_axis")} // Updated handler
                    >
                      {axis.options.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {filters.x_axis === "Define Range" && (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                      mt: 1,
                    }}
                  >
                    <TextField
                      sx={{ width: "49%" }}
                      label="Min X"
                      inputProps={{ type: "number" }}
                      value={filters.min_x_axis}
                      onChange={handleNumberInput("min_x_axis")}
                    />
                    <TextField
                      sx={{ width: "49%" }}
                      label="Max X"
                      inputProps={{ type: "number" }}
                      value={filters.max_x_axis}
                      onChange={handleNumberInput("max_x_axis")}
                    />
                  </Box>
                )}

                <FormControl sx={{ mb: 1, mt: 1 }} fullWidth>
                  <InputLabel id="y_axis_options">Y Axis Options</InputLabel>
                  <Select
                    labelId="y_axis_options"
                    id="y_axis_options"
                    value={filters.y_axis} // Bind to the plot state
                    label="Y Axis Options"
                    onChange={handleSingleNoMap("y_axis")} // Updated handler
                  >
                    {/* Dynamically determine the options */}
                    {(filters.plot === "Violin"
                      ? ["Free Axis", "Shared Axis", "Define Range"]
                      : ["Free Axis", "Shared Axis", "Define Range"]
                    ).map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {filters.y_axis === "Define Range" && (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      mb: 1,
                      mt: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <TextField
                      sx={{ width: "49%" }}
                      label="Min Y"
                      inputProps={{ type: "number" }}
                      value={filters.min_y_axis}
                      onChange={handleNumberInput("min_y_axis")}
                    />
                    <TextField
                      sx={{ width: "49%" }}
                      label="Max Y"
                      inputProps={{ type: "number" }}
                      value={filters.max_y_axis}
                      onChange={handleNumberInput("max_y_axis")}
                    />
                  </Box>
                )}
                {(filters.plot === "Violin" || filters.plot === "Density") && (
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
                      sx={{ mt: 0, textAlign: "center" }}
                    >
                      Plot smoothness
                    </Typography>
                    <Slider
                      value={filters.bandwidth_divisor}
                      onChange={handleSlider("bandwidth_divisor")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="off"
                      step={1}
                      marks={bandwidth_divisor_marks}
                      min={1}
                      max={100}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                )}
                {(filters.plot === "2D Density") && (
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
                      sx={{ mt: 0, textAlign: "center" }}
                    >
                      Plot smoothness
                    </Typography>
                    <Slider
                      value={filters.bandwidth_divisor}
                      onChange={handleSlider("bandwidth_divisor")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="off"
                      step={1}
                      marks={td_bandwidth_divisor_marks}
                      min={1}
                      max={50}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                )}
                {(filters.plot === "2D Density") && (
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
                      sx={{ mt: 0, textAlign: "center" }}
                    >
                      Number of steps
                    </Typography>
                    <Slider
                      value={filters.thresholds}
                      onChange={handleSlider("thresholds")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="off"
                      step={1}
                      marks={td_threshold_divisor_marks}
                      min={10}
                      max={45}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                )}
                {filters.plot === "Histogram" && (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      className="contrast-text"
                      sx={{ textAlign: "center" }}
                    >
                      Number of bins
                    </Typography>
                    <Slider
                      value={filters.n_bins}
                      onChange={handleSlider("n_bins")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="auto"
                      step={1}
                      marks={bin_marks}
                      min={0}
                      max={100}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                )}
              </>
            )}
            {filters.plot === "Map" && (
              <>
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.map_data}
                        size="small"
                        onChange={handleCheckbox("map_data")}
                      />
                    }
                    label="Points for Dataset"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
                {filters.map_data === true && (
                  <TextField
                    sx={{ width: "100%", mb: 1, mt: 1 }}
                    label="Radius for Dataset points"
                    inputProps={{ type: "number" }}
                    value={filters.map_data_rad}
                    onChange={handleNumberInput("map_data_rad")}
                  />
                )}
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.map_reg}
                        size="small"
                        onChange={handleCheckbox("map_reg")}
                      />
                    }
                    label="Points for Region"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
                {filters.map_reg === true && (
                  <TextField
                    sx={{ width: "100%", mb: 1, mt: 1 }}
                    label="Radius for Region points"
                    inputProps={{ type: "number" }}
                    value={filters.map_reg_rad}
                    onChange={handleNumberInput("map_reg_rad")}
                  />
                )}
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.map_pop}
                        size="small"
                        onChange={handleCheckbox("map_pop")}
                      />
                    }
                    label="Points for Population"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
                {filters.map_pop === true && (
                  <TextField
                    sx={{ width: "100%", mb: 1, mt: 1 }}
                    label="Radius for Population points"
                    inputProps={{ type: "number" }}
                    value={filters.map_pop_rad}
                    onChange={handleNumberInput("map_pop_rad")}
                  />
                )}
                <TextField
                  sx={{ width: "100%", mb: 1, mt: 1 }}
                  label="Radius for Individual points"
                  inputProps={{ type: "number" }}
                  value={filters.map_ind_rad}
                  onChange={handleNumberInput("map_ind_rad")}
                />{" "}
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                    mt: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: "45%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      className="contrast-text"
                      sx={{ textAlign: "center" }}
                    >
                      Latitude
                    </Typography>
                    <Slider
                      value={filters.map_lat_jit}
                      onChange={handleSlider("map_lat_jit")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="auto"
                      step={1}
                      marks={map_jit_marks}
                      min={0}
                      max={10}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: "45%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      className="contrast-text"
                      sx={{ textAlign: "center" }}
                    >
                      Longitude
                    </Typography>
                    <Slider
                      value={filters.map_lon_jit}
                      onChange={handleSlider("map_lon_jit")}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="auto"
                      step={1}
                      marks={map_jit_marks}
                      min={0}
                      max={10}
                      sx={{ width: "85%" }}
                    />
                  </Box>
                </Box>
              </>
            )}
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
      </Grid>
    </Grid>
  );
};

export default SideFilter;
