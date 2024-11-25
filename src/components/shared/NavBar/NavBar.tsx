import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useSidebar } from "@/components/shared/SideBarContext/SideBarContext";
import { paths } from "@/paths";

export const NavBar: React.FC = () => {
  const { isSidebarVisible, toggleSidebar } = useSidebar();
  const handleNavigation = (url: string) => {
    window.location.href = url; // Navigate to the specified URL
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
          {/* <Stack
              direction="row"
              spacing={2}
              sx={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                height: "100%"
              }}
            > */}
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
            {/*           <Stack
            direction="row"
            spacing={0}
            sx={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center", // Align all items vertically in the center
              height: "100%",
              width: "40dvw",
            }} */}

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
              onClick={() => handleNavigation(paths.summary_stats.per_ind)}
            >
              Summ Per Ind
            </Box>
            <Box
              sx={{
                borderLeft: "1px solid white",
                height: "100%", // Ensure full height for the separator
                alignSelf: "center", // Vertically center the separator
              }}
            />
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
              onClick={() => handleNavigation(paths.fragment.vis_per_ind)}
            >
              Frag Vis Per Ind
            </Box>
            <Box
              sx={{
                borderLeft: "1px solid white",
                height: "100%",
                alignSelf: "center",
              }}
            />
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
              onClick={() => handleNavigation(paths.fragment.vis_per_reg)}
            >
              Frag Vis Per Reg
            </Box>
          </Stack>

          {/* Right Partition */}

          {/*             <Typography
              sx={{
                color: "primary.contrastText",
                fontSize: "0.9rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={toggleSidebar}
            >
              {isSidebarVisible ? "Collapse Options" : "Expand Options"}
            </Typography> */}
          <Stack
            direction="row"
            spacing={0} // Remove default spacing between items
            sx={{
              position: "absolute",
              flexGrow: 1,
              right: "5%",
              // Center horizontally
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
}; /* <Button
                    variant="contained"
                    href="https://docs.google.com/document/d/1JRWpkrQgZZWFrVSoFaIyffE0t9Mg6IEndR0z1k7a6hI/edit?tab=t.0"
                    sx={{
                      backgroundColor: "#FFDD57", // Bright yellow
                      color: "#000", // Black text
                      borderColor: "#FFAA00", // Slightly darker yellow
                      fontWeight: "bold",
                      padding: "10px 20px",
                      fontSize: "16px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Add shadow for depth
                      "&:hover": {
                        backgroundColor: "#FFC107", // Slightly darker yellow on hover
                        boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.5)", // Enhance shadow on hover
                      },
                    }}
                  >
                    Feedback Document
                  </Button>
                  <Button
                    variant="contained"
                    href="https://docs.google.com/document/d/1cL6oENyD6VUiUcreoTpUGiFGX-raaNkgyI6Uu8ZDqMM/edit?tab=t.0"
                    sx={{
                      backgroundColor: "#4CAF50", // Bright green
                      color: "#FFF", // White text
                      borderColor: "#388E3C", // Slightly darker green
                      fontWeight: "bold",
                      padding: "10px 20px",
                      fontSize: "16px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Add shadow for depth
                      textTransform: "uppercase", // Optional for emphasis
                      "&:hover": {
                        backgroundColor: "#66BB6A", // Lighter green on hover
                        boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.5)", // Enhance shadow on hover
                      },
                    }}
                  >
                    Latest changes!
                  </Button>
 */
