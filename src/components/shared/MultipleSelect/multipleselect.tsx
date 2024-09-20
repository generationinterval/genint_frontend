import * as React from "react";
import { Theme, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { useId } from "react";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const DEFAULT_MENU_WIDTH = 250;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

function getStyles(
  name: string,
  selectedNames: readonly string[],
  theme: Theme
) {
  return {
    fontWeight:
      selectedNames.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

interface MultipleSelectChipProps {
  options: string[];
  label: string;
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  variant?: "text" | "outlined" | "contained"; // Variant to match MUI Button
  sx?: object;
  menuWidth?: number;
}

const MultipleSelectChip: React.FC<MultipleSelectChipProps> = ({
  options,
  label,
  selectedValues,
  onChange,
  variant = "outlined", // Default to "outlined" like a button
  sx = {},
  menuWidth = DEFAULT_MENU_WIDTH,
}) => {
  const theme = useTheme();
  const [selectedNames, setSelectedNames] = React.useState<string[]>(
    selectedValues || []
  );

  const handleChange = (event: SelectChangeEvent<typeof selectedNames>) => {
    const {
      target: { value },
    } = event;
    const newSelectedNames =
      typeof value === "string" ? value.split(",") : value;
    setSelectedNames(newSelectedNames);
    onChange(newSelectedNames);
  };

  const labelId = useId();
  const selectId = useId();
  const inputId = useId();

  return (
    <FormControl sx={{ width: "100%", ...sx }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={selectId}
        multiple
        value={selectedNames}
        onChange={handleChange}
        input={
          <OutlinedInput
            id={inputId}
            label={label}
            sx={{
              padding: 0, // Ensure padding is zero since it's already handled by the inner elements
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": {
                border: variant === "text" ? "none" : undefined,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
              backgroundColor:
                variant === "contained"
                  ? theme.palette.primary.main
                  : undefined,
              color:
                variant === "contained"
                  ? theme.palette.primary.contrastText
                  : undefined,
            }}
          />
        }
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                sx={{
                  backgroundColor:
                    variant === "contained"
                      ? theme.palette.primary.light
                      : theme.palette.action.selected,
                  color: theme.palette.getContrastText(
                    theme.palette.primary.light
                  ),
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={{
          ...MenuProps,
          PaperProps: {
            ...MenuProps.PaperProps,
            style: {
              ...MenuProps.PaperProps.style,
              width: menuWidth,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            value={option}
            style={getStyles(option, selectedNames, theme)}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MultipleSelectChip;
