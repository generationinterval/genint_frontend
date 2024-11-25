import React, { useState, useRef } from "react";
import {
  AppBar,
  Box,
  Stack,
  Toolbar,
  Typography,
  Popper,
  Paper,
  MenuList,
  MenuItem,
} from "@mui/material";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import { paths } from "@/paths";

export const NavBar: React.FC = () => {
  const { isSidebarVisible, toggleSidebar } = useSidebar();
  const handleNavigation = (url: string) => {
    window.location.href = url; // Navigate to the specified URL
  };

  // State variables for menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuType, setMenuType] = useState<string>("");

  // Reference to the Popper's Paper component
  const popperRef = useRef<HTMLDivElement>(null);

  // Handlers for opening menus
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    menu: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuType(menu);
  };

  const handleMenuClose = (event: React.MouseEvent<HTMLElement>) => {
    if (
      anchorEl &&
      (anchorEl.contains(event.relatedTarget as Node) ||
        (popperRef.current &&
          popperRef.current.contains(event.relatedTarget as Node)))
    ) {
      // The mouse is moving to the anchor or the Popper, don't close
      return;
    }
    setAnchorEl(null);
    setMenuType("");
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "7dvh",
        minHeight: "70.85px", // Set Box height explicitly
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "primary.main",
          height: "7dvh", // Explicitly set AppBar height to match Box
          minHeight: "70.85px",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <Typography
            sx={{
              color: "primary.contrastText",
              fontWeight: "bold",
              fontSize: "1.2rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginRight: "auto", // Push to the right
            }}
          >
            Generation Interval
          </Typography>

          {/* Middle Stack */}
          <Stack
            direction="row"
            spacing={0}
            sx={{
              position: "absolute",
              flexGrow: 1,
              left: "50%",
              transform: "translateX(-50%)", // Center horizontally
              alignItems: "center",
              width: "40dvw",
              height: "100%",
            }}
          >
            {/* Summary Stats */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexGrow: 1,
                height: "100%",
              }}
              onMouseOver={(e) => handleMenuOpen(e, "summary")}
              onMouseOut={handleMenuClose}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center", // Vertically align text
                  justifyContent: "center", // Horizontally align text
                  cursor: "pointer",
                  flexGrow: 1,
                  color: "primary.contrastText",
                  height: "100%", // Ensure full height
                  lineHeight: "normal", // Prevent extra line height padding
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)", // Highlight on hover
                  },
                }}
              >
                Summary Stats
              </Box>
              {/* Dropdown Menu */}
              <Popper
                open={menuType === "summary"}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 0],
                    },
                  },
                ]}
              >
                <Paper
                  ref={popperRef}
                  sx={{
                    mt: 0.5,
                    minWidth: anchorEl ? anchorEl.clientWidth : undefined,
                  }}
                  onMouseOut={handleMenuClose}
                >
                  <MenuList>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.summary_stats.per_ind);
                      }}
                    >
                      Per Ind
                    </MenuItem>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.summary_stats.per_group);
                      }}
                    >
                      Per Group
                    </MenuItem>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.summary_stats.per_frag);
                      }}
                    >
                      Per Frag
                    </MenuItem>
                  </MenuList>
                </Paper>
              </Popper>
            </Box>

            {/* Separator */}
            <Box
              sx={{
                borderLeft: "1px solid white",
                height: "100%", // Ensure full height for the separator
                alignSelf: "center", // Vertically center the separator
              }}
            />

            {/* Fragment Visualization */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexGrow: 1,
                height: "100%",
              }}
              onMouseOver={(e) => handleMenuOpen(e, "fragment")}
              onMouseOut={handleMenuClose}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexGrow: 1,
                  color: "primary.contrastText",
                  height: "100%",
                  lineHeight: "normal",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                Fragment Visualization
              </Box>
              {/* Dropdown Menu */}
              <Popper
                open={menuType === "fragment"}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 0],
                    },
                  },
                ]}
              >
                <Paper
                  ref={popperRef}
                  sx={{
                    mt: 0.5,
                    minWidth: anchorEl ? anchorEl.clientWidth : undefined,
                  }}
                  onMouseOut={handleMenuClose}
                >
                  <MenuList>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.fragment.vis_per_ind);
                      }}
                    >
                      Per Ind
                    </MenuItem>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.fragment.vis_per_reg);
                      }}
                    >
                      Per Reg
                    </MenuItem>
                  </MenuList>
                </Paper>
              </Popper>
            </Box>

            {/* Separator */}
            <Box
              sx={{
                borderLeft: "1px solid white",
                height: "100%",
                alignSelf: "center",
              }}
            />

            {/* Others */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexGrow: 1,
                height: "100%",
              }}
              onMouseOver={(e) => handleMenuOpen(e, "others")}
              onMouseOut={handleMenuClose}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexGrow: 1,
                  color: "primary.contrastText",
                  height: "100%",
                  lineHeight: "normal",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                Others
              </Box>
              {/* Dropdown Menu */}
              <Popper
                open={menuType === "others"}
                anchorEl={anchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
                modifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [0, 0],
                    },
                  },
                ]}
              >
                <Paper
                  ref={popperRef}
                  sx={{
                    mt: 0.5,
                    minWidth: anchorEl ? anchorEl.clientWidth : undefined,
                  }}
                  onMouseOut={handleMenuClose}
                >
                  <MenuList>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.others.reg_seq_cum);
                      }}
                    >
                      Reg Seq Cum
                    </MenuItem>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.others.hmm_prob);
                      }}
                    >
                      HMM Prob
                    </MenuItem>
                    <MenuItem
                      sx={{ justifyContent: "center" }}
                      onClick={(event) => {
                        handleMenuClose(event as any);
                        handleNavigation(paths.others.outgroup_filter);
                      }}
                    >
                      Outgroup Filter
                    </MenuItem>
                  </MenuList>
                </Paper>
              </Popper>
            </Box>
          </Stack>

          {/* Right Partition */}
          <Stack
            direction="row"
            spacing={0} // Remove default spacing between items
            sx={{
              position: "absolute",
              flexGrow: 1,
              right: "5%",
              alignItems: "center",
              width: "20dvw",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center", // Center text horizontally
                cursor: "pointer",
                flexGrow: 1, // Allow the box to grow equally with others
                color: "#000000",
                height: "100%",
                backgroundColor: "#FFDD57",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)", // Highlight on hover
                },
              }}
              onClick={() =>
                handleNavigation(
                  "https://docs.google.com/document/d/1JRWpkrQgZZWFrVSoFaIyffE0t9Mg6IEndR0z1k7a6hI/edit?tab=t.0"
                )
              }
            >
              Feedback Document
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center", // Center text horizontally
                cursor: "pointer",
                flexGrow: 1, // Allow the box to grow equally with others
                color: "#000000",
                height: "100%",
                backgroundColor: "#4CAF50",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)", // Highlight on hover
                },
              }}
              onClick={() =>
                handleNavigation(
                  "https://docs.google.com/document/d/1cL6oENyD6VUiUcreoTpUGiFGX-raaNkgyI6Uu8ZDqMM/edit?tab=t.0"
                )
              }
            >
              Latest Changes
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
