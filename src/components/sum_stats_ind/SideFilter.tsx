import React from "react";
import MultipleSelectChip from "@/components/shared/MultipleSelect/multipleselect";
import {
  datasets,
  ancestries,
  chrms_discrete,
  mpp_marks,
  regions,
  variables,
  bin_marks,
  axis,
  map_jit_marks,
} from "@/assets/FilterOptions";
import {
  Box,
  Button,
  Grid,
  Slider,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { checkboxBoxStyles } from "@/assets/styles";
import { TextField } from "@mui/material";
import { b } from "vite/dist/node/types.d-aGj9QkWt";

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

interface SideFilterProps {
  tabValue: number;
  setTabValue: (value: number) => void;
  filters: FilterState; // Use your FilterState type here
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // Function to set the filters
  applyFilters: () => Promise<void>;
}

type MappingKey = keyof typeof variables.mapping;

const plotOptionsSingle = ["Violin", "Histogram", "Density", "Bar", "Map"];
const plotOptionsDouble = ["Bar", "2D Density", "Quantiles"];

const SideFilter: React.FC<SideFilterProps> = ({
  tabValue,
  setTabValue,
  filters,
  setFilters,
  applyFilters,
}) => {
  const handleSingleChangeMapped = (key: keyof FilterState, value: string) => {
    // Use the mapping based on the key
    const mappedValue = variables.mapping[value as MappingKey];

    // Set the original and mapped values in the state
    setFilters((prevFilters: FilterState) => ({
      ...prevFilters,
      [key]: value, // Store the original value for display
      [`${key}_mapped`]: mappedValue, // Store the mapped value for backend
    }));
  };

  const handleSingleChangeUnmapped = (key: keyof FilterState) => {
    return (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent<string>,
      child?: React.ReactNode
    ) => {
      // Check if the event is a SelectChangeEvent
      const value = "target" in event ? event.target.value : event;

      setFilters((prevFilters: FilterState) => ({
        ...prevFilters,
        [key]: value, // update the specific key in the state
      }));
    };
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    if (typeof value === "number") {
      // If the value is a number, it's from the slider
      setFilters((prevFilters: FilterState) => ({
        ...prevFilters,
        [key]: value,
      }));
    } else if (typeof value === "boolean") {
      // If the value is a boolean, it's from the checkbox
      setFilters((prevFilters: FilterState) => ({
        ...prevFilters,
        [key]: value,
      }));
    } else {
      // Otherwise, assume it's from a multi-select or single-select input
      const mappedValue = value.map(
        (v: string) => variables.mapping[v as MappingKey]
      );

      if (key === "col") {
        const selectedDiscrete = mappedValue.filter((v: string) =>
          variables.discreteOptions
            .map((option) => variables.mapping[option as MappingKey])
            .includes(v)
        );
        const selectedContinuous = mappedValue.filter((v: string) =>
          variables.continuousOptions
            .map((option) => variables.mapping[option as MappingKey])
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

        setFilters((prevFilters: FilterState) => ({
          ...prevFilters,
          [key]: [...selectedDiscrete, ...selectedContinuous],
        }));
      } else {
        setFilters((prevFilters: FilterState) => ({
          ...prevFilters,
          [key]: mappedValue,
        }));
      }
    }
  };

  const options = tabValue === 0 ? plotOptionsSingle : plotOptionsDouble;

  const handleToggleChange = (
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h5">1- Select Type of Plot:</Typography>
      </Grid>
      <Grid item xs={12}>
        <ToggleButtonGroup
          value={tabValue}
          exclusive
          onChange={handleToggleChange}
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
        <FormControl fullWidth>
          <InputLabel id="plot-type-select-label">Plot Type</InputLabel>
          <Select
            labelId="plot-type-select-label"
            id="plot-type-select"
            value={filters.plot} // Bind to the plot state
            label="Plot Types"
            onChange={handleSingleChangeUnmapped("plot")} // Updated handler
          >
            {options.map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <>
        <Grid item xs={12}>
          <Typography variant="h5">2- Data Filters:</Typography>
        </Grid>
      </>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {tabValue === 0 && (
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="variable-select-label">Variable</InputLabel>
                <Select
                  labelId="variable-select-label"
                  id="variable-select"
                  value={filters.var_1} // Bind to the original value for display
                  label="Variable"
                  onChange={(event: SelectChangeEvent<string>) =>
                    handleSingleChangeMapped("var_1", event.target.value)
                  }
                >
                  {variables.options_all.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {filters.plot !== "Map" && (
                <Box sx={checkboxBoxStyles}>
                  <FormControlLabel
                    value="bottom"
                    control={
                      <Checkbox
                        checked={filters.mea_med_1}
                        size="small"
                        onChange={(event) =>
                          handleFilterChange("mea_med_1", event.target.checked)
                        }
                      />
                    }
                    label="Mean/Median"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
              )}
              <MultipleSelectChip
                sx={{ mb: 1, mt: 1 }}
                options={datasets.options}
                label="Datasets"
                selectedValues={filters.data_1}
                onChange={(newValues) =>
                  handleFilterChange("data_1", newValues)
                }
              />
              <MultipleSelectChip
                sx={{ mb: 1, mt: 1 }}
                options={ancestries.options}
                label="Ancestries"
                selectedValues={filters.ancs_1}
                onChange={(newValues) =>
                  handleFilterChange("ancs_1", newValues)
                }
              />
              <MultipleSelectChip
                sx={{ mb: 1, mt: 1 }}
                options={chrms_discrete.options}
                label="Chromosomes"
                selectedValues={filters.chrms_1}
                onChange={(newValues) =>
                  handleFilterChange("chrms_1", newValues)
                }
              />
              <MultipleSelectChip
                sx={{ mb: 1, mt: 1 }}
                options={regions.options}
                label="Region"
                selectedValues={filters.reg_1}
                onChange={(newValues) => handleFilterChange("reg_1", newValues)}
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
                  onChange={(event, newValue) =>
                    handleFilterChange("mpp_1", newValue as number)
                  }
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
                    onChange={(event: SelectChangeEvent<string>) =>
                      handleSingleChangeMapped("var_2_1", event.target.value)
                    }
                  >
                    {variables.options_all.map((option, index) => (
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
                        onChange={(event) =>
                          handleFilterChange("mea_med_x", event.target.checked)
                        }
                      />
                    }
                    label="Mean/Median X"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={datasets.options}
                  label="Datasets in X"
                  selectedValues={filters.data_2_1}
                  onChange={(newValues) =>
                    handleFilterChange("data_2_1", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={ancestries.options}
                  label="Ancestries in X"
                  selectedValues={filters.ancs_2_1}
                  onChange={(newValues) =>
                    handleFilterChange("ancs_2_1", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={chrms_discrete.options}
                  label="Chromosomes in X"
                  selectedValues={filters.chrms_2_1}
                  onChange={(newValues) =>
                    handleFilterChange("chrms_2_1", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={regions.options}
                  label="Region in X"
                  selectedValues={filters.reg_2_1}
                  onChange={(newValues) =>
                    handleFilterChange("reg_2_1", newValues)
                  }
                />
                <Box
                  sx={{
                    mb: 1,
                    mt: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    className="contrast-text"
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    Mean Posterior Prob. in X
                  </Typography>
                  <Slider
                    value={filters.mpp_2_1}
                    onChange={(event, newValue) =>
                      handleFilterChange("mpp_2_1", newValue as number)
                    }
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
                    onChange={(event: SelectChangeEvent<string>) =>
                      handleSingleChangeMapped("var_2_2", event.target.value)
                    }
                  >
                    {variables.options_all.map((option, index) => (
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
                        onChange={(event) =>
                          handleFilterChange("mea_med_y", event.target.checked)
                        }
                      />
                    }
                    label="Mean/Median Y"
                    labelPlacement="end"
                    sx={{ width: "100%" }}
                  />
                </Box>
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={datasets.options}
                  label="Datasets in Y"
                  selectedValues={filters.data_2_2}
                  onChange={(newValues) =>
                    handleFilterChange("data_2_2", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={ancestries.options}
                  label="Ancestries in Y"
                  selectedValues={filters.ancs_2_2}
                  onChange={(newValues) =>
                    handleFilterChange("ancs_2_2", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={chrms_discrete.options}
                  label="Chromosomes in Y"
                  selectedValues={filters.chrms_2_2}
                  onChange={(newValues) =>
                    handleFilterChange("chrms_2_2", newValues)
                  }
                />
                <MultipleSelectChip
                  sx={{ mb: 1, mt: 1 }}
                  options={regions.options}
                  label="Region in Y"
                  selectedValues={filters.reg_2_2}
                  onChange={(newValues) =>
                    handleFilterChange("reg_2_2", newValues)
                  }
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
                    Mean Posterior Prob. in Y
                  </Typography>
                  <Slider
                    value={filters.mpp_2_2}
                    onChange={(event, newValue) =>
                      handleFilterChange("mpp_2_2", newValue as number)
                    }
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
            </>
          )}
        </Grid>
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
              options={[
                ...variables.discreteOptions,
                ...variables.continuousOptions,
              ]}
              label="Color by"
              selectedValues={filters.col}
              onChange={(newValues) => handleFilterChange("col", newValues)}
            />
            <MultipleSelectChip
              sx={{ mb: 1, mt: 1 }}
              options={variables.discreteOptions}
              label="Facet in X"
              selectedValues={filters.fac_x}
              onChange={(newValues) => handleFilterChange("fac_x", newValues)}
            />
            <MultipleSelectChip
              sx={{ mb: 1, mt: 1 }}
              options={variables.discreteOptions}
              label="Facet in Y"
              selectedValues={filters.fac_y}
              onChange={(newValues) => handleFilterChange("fac_y", newValues)}
            />
            {filters.plot !== "Violin" && (
              <FormControl sx={{ mb: 1, mt: 1 }} fullWidth>
                <InputLabel id="x_axis_options">X Axis Options</InputLabel>
                <Select
                  labelId="x_axis_options"
                  id="x_axis_options"
                  value={filters.x_axis} // Bind to the plot state
                  label="X Axis Options"
                  onChange={handleSingleChangeUnmapped("x_axis")} // Updated handler
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
                  onChange={(event) =>
                    handleSingleChangeUnmapped("min_x_axis")(event)
                  }
                />
                <TextField
                  sx={{ width: "49%" }}
                  label="Max X"
                  inputProps={{ type: "number" }}
                  onChange={(event) =>
                    handleSingleChangeUnmapped("max_x_axis")(event)
                  }
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
                onChange={handleSingleChangeUnmapped("y_axis")} // Updated handler
              >
                {axis.options.map((option, index) => (
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
                  onChange={(event) =>
                    handleSingleChangeUnmapped("min_y_axis")(event)
                  }
                />
                <TextField
                  sx={{ width: "49%" }}
                  label="Max Y"
                  inputProps={{ type: "number" }}
                  onChange={(event) =>
                    handleSingleChangeUnmapped("max_y_axis")(event)
                  }
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
                  onChange={(event, newValue) =>
                    handleFilterChange("n_bins", newValue as number)
                  }
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
                    onChange={(event) =>
                      handleFilterChange("map_data", event.target.checked)
                    }
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
                onChange={(event) =>
                  handleSingleChangeUnmapped("map_data_rad")(event)
                }
              />
            )}
            <Box sx={checkboxBoxStyles}>
              <FormControlLabel
                value="bottom"
                control={
                  <Checkbox
                    checked={filters.map_reg}
                    size="small"
                    onChange={(event) =>
                      handleFilterChange("map_reg", event.target.checked)
                    }
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
                onChange={(event) =>
                  handleSingleChangeUnmapped("map_reg_rad")(event)
                }
              />
            )}
            <Box sx={checkboxBoxStyles}>
              <FormControlLabel
                value="bottom"
                control={
                  <Checkbox
                    checked={filters.map_pop}
                    size="small"
                    onChange={(event) =>
                      handleFilterChange("map_pop", event.target.checked)
                    }
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
                onChange={(event) =>
                  handleSingleChangeUnmapped("map_pop_rad")(event)
                }
              />
            )}
            <TextField
              sx={{ width: "100%", mb: 1, mt: 1 }}
              label="Radius for Individual points"
              inputProps={{ type: "number" }}
              onChange={(event) =>
                handleSingleChangeUnmapped("map_ind_rad")(event)
              }
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
                  onChange={(event, newValue) =>
                    handleFilterChange("map_lat_jit", newValue as number)
                  }
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
                  onChange={(event, newValue) =>
                    handleFilterChange("map_lon_jit", newValue as number)
                  }
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
  );
};

export default SideFilter;
