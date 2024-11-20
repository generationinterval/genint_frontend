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

export const NavBar: React.FC<NonNullable<unknown>> = () => {
  const { isSidebarVisible, toggleSidebar } = useSidebar();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          <Container maxWidth="xl">
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Grid item>
                <Button variant="contained" onClick={toggleSidebar}>
                  {isSidebarVisible ? "Collapse Options" : "Expand Options"}
                </Button>
              </Grid>
              <Grid item>
                <Typography
                  color="primary"
                  sx={{ color: "primary.contrastText" }}
                >
                  Generation Interval
                </Typography>
              </Grid>
              <Grid item>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" href="/">
                    Home
                  </Button>
                  <Button variant="contained" href="/about">
                    About
                  </Button>
                  <Button
                    variant="contained"
                    href={paths.summary_stats.per_ind}
                  >
                    Summ Per Ind
                  </Button>
                  <Button variant="contained" href={paths.fragment.vis_per_ind}>
                    Frag Vis Per Ind
                  </Button>
                  <Button variant="contained" href={paths.fragment.vis_per_reg}>
                    Frag Vis Per reg
                  </Button>
                  <Button
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

                  {/*                  <Button
                    variant="contained"
                    href={paths.summary_stats.per_ind}
                  >
                    Summ Per Group
                  </Button>
                  <Button
                    variant="contained"
                    href={paths.summary_stats.per_ind}
                  >
                    Summ Per Frag
                  </Button> */}
                  {/* <Button variant="contained" href="/">
                    Summary stats per individual
                  </Button>
                  <Button variant="contained" href="/about">
                    Summary stats per group
                  </Button>
                  <Button variant="contained" href="/about">
                    Summary stats per fragment
                  </Button>
                  <Button variant="contained" href="/about">
                    Fragment visualization per individual
                  </Button>
                  <Button variant="contained" href="/about">
                    Fragment comparison per individual
                  </Button>
                  <Button variant="contained" href="/about">
                    Fragment visualization per region
                  </Button>
                  <Button variant="contained" href="/about">
                    Region sequencence accumulation
                  </Button>
                  <Button variant="contained" href="/about">
                    HMM probability stats per individual
                  </Button>
                  <Button variant="contained" href="/about">
                    Outgroup filter stats per individual
                  </Button>
                  <Button variant="contained" href="/about">
                    Table summary stats per individual
                  </Button> */}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
