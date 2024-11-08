import React, { useEffect, useRef } from "react";
import L from "leaflet";
import * as d3 from "d3";
import "leaflet/dist/leaflet.css";
import { variables } from "@/assets/FilterOptions";

interface DataPoint {
  ind: string;
  dat: string;
  chrom: string;
  anc: string;
  hap: number;
  len_mea: number;
  len_med: number;
  len_max: number;
  len_min: number;
  nfr: number;
  seq: number;
  sex: string;
  pop: string;
  reg: string;
  oda: string;
  tim: number;
  lat: number;
  lon: number;
  cre: string;
  cda: string;
  lin: string;
  ancAMR: number;
  ancEAS: number;
  ancSAS: number;
  ancAFR: number;
  ancEUR: number;
  ancOCE: number;
  fac_x: string | null; // Assuming fac_x and fac_y might be null
  fac_y: string | null;
  color: string;
  jitteredLat?: number; // Optional fields to store jittered positions
  jitteredLon?: number;
}

interface MapComponentProps {
  data: DataPoint[];
  col: string;
  col_unmapped: string;
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

const createColorScale = (
  data: DataPoint[],
  col: string
): {
  getColor: (d: DataPoint) => string;
  legendData: { label: string; color: string; extent?: [number, number] }[];
  discreteOrContinuous: string;
  globalColorOrder: string[];
} => {
  let getColor: (d: DataPoint) => string;
  let legendData: { label: string; color: string; extent?: [number, number] }[];
  let discreteOrContinuous: string;
  let globalColorOrder: string[] = [];

  if (col === "") {
    const defaultColor = "steelblue";
    getColor = () => defaultColor;
    legendData = [{ label: "Default Color", color: defaultColor }];
    discreteOrContinuous = "default";
    globalColorOrder = [defaultColor]; // Only one color, steelblue
  }
  // Rule 2: If the variable in col is continuous, create a continuous colormap
  else if (variables.continuousOptionsShort.includes(col)) {
    let extent = d3.extent(data, (d) => +d[col as keyof DataPoint]!);
    const isExtentValid = extent[0] !== undefined && extent[1] !== undefined;
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain(extent as [number, number]);

    getColor = (d) => {
      const value = d[col as keyof DataPoint];
      return value !== null && value !== undefined
        ? colorScale(+value)
        : "steelblue"; // Fallback color if value is undefined
    };

    legendData = isExtentValid
      ? [
        { label: `Min: ${extent[0]}`, color: colorScale(extent[0]!), extent },
        { label: `Max: ${extent[1]}`, color: colorScale(extent[1]!), extent },
      ]
      : [{ label: "No valid data", color: "steelblue" }]; // If extent is invalid
    discreteOrContinuous = "continuous";
    globalColorOrder = []; // Continuous variables don't have a strict "order" per se
  }
  // Rule 3: If the variable in col is discrete, create a categorical colormap
  else {
    const uniqueValues = [
      ...new Set(
        data
          .map((d) => d.color) // Extract "color" property from each DataPoint
          .filter((color) => color !== null && color !== undefined) // Filter out null and undefined values
          .map(String) // Convert all color values to strings (in case they're not)
      ),
    ];

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueValues);

    getColor = (d) => {
      const value = d.color;
      return value !== null && value !== undefined
        ? colorScale(String(value))
        : "steelblue"; // Fallback color if value is undefined
    };

    legendData = uniqueValues.map((value) => ({
      label: String(value),
      color: colorScale(value),
    }));
    discreteOrContinuous = "discrete";
    globalColorOrder = uniqueValues; // Set global order for categorical values
  }

  return { getColor, legendData, discreteOrContinuous, globalColorOrder };
};

const MapComponent: React.FC<MapComponentProps> = ({
  data,
  col,
  col_unmapped,
  map_data,
  map_data_rad,
  map_reg,
  map_reg_rad,
  map_pop,
  map_pop_rad,
  map_ind_rad,
  map_lat_jit,
  map_lon_jit,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const bounds = L.latLngBounds(
      L.latLng(-85, -180), // Southwest corner
      L.latLng(85, 180) // Northeast corner
    );

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [47, 2],
      zoom: 5,
      maxZoom: 6, // Set max zoom level to prevent zooming beyond bounds
      minZoom: 2.25, // Set min zoom level to prevent zooming beyond bounds
      maxBounds: bounds, // Set max bounds to restrict panning entirely
      maxBoundsViscosity: 1.0, // Set viscosity to 1 to completely block panning beyond bounds
      worldCopyJump: false, // Disable world copy to prevent wrapping at boundaries
    });

    // Add a tile layer (OpenStreetMap)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 6,
      }
    ).addTo(map);

    // Add an SVG layer
    L.svg().addTo(map);

    // Function to project the lat/lon coordinates to pixels
    function projectPoint(lat: number, lon: number) {
      const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
      return point;
    }
    function applyJitter(
      lat: number,
      lon: number,
      map_lat_jit: number,
      map_lon_jit: number
    ) {
      const jitterLat = lat + (Math.random() - 0.5) * map_lat_jit;
      const jitterLon = lon + (Math.random() - 0.5) * map_lon_jit;
      return { jitterLat, jitterLon };
    }
    const jitteredData = data.map((d) => {
      const { jitterLat, jitterLon } = applyJitter(
        d.lat,
        d.lon,
        map_lat_jit,
        map_lon_jit
      );
      return { ...d, jitteredLat: jitterLat, jitteredLon: jitterLon };
    });
    const dataColorScale = d3
      .scaleOrdinal(d3.schemeCategory10) // You can replace with other schemes if needed
      .domain([...new Set(data.map((d) => d.dat))]);

    const regColorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain([...new Set(data.map((d) => d.reg))]);

    const popColorScale = d3
      .scaleOrdinal(d3.schemeSet2)
      .domain([...new Set(data.map((d) => d.pop))]);
    // Function to update the circles when the map moves
    // Update the circle positions when the map is zoomed or moved
    function updateCircles() {
      svg
        .selectAll("circle")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y);
    }

    const { getColor, legendData, discreteOrContinuous, globalColorOrder } =
      createColorScale(data, col);

    // Select the SVG overlay for circles
    const svg = d3
      .select(map.getPanes().overlayPane)
      .select("svg")
      .attr("class", "leaflet-zoom-animated")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0");

    // Remove previous circles to avoid duplication
    svg.selectAll(".circle_data, .circle_reg, .circle_pop").remove();

    // Data attribute circles
    if (map_data) {
      svg
        .selectAll(".circle_data")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("class", "circle_data")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_data_rad)
        .attr("fill", (d) => dataColorScale(d.dat))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.02);
    }

    // Region attribute circles
    if (map_reg) {
      svg
        .selectAll(".circle_reg")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("class", "circle_reg")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_reg_rad)
        .attr("fill", (d) => regColorScale(d.reg))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.4);
    }

    // Population attribute circles
    if (map_pop) {
      svg
        .selectAll(".circle_pop")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("class", "circle_pop")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_pop_rad)
        .attr("fill", (d) => popColorScale(d.pop))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.6);
    }

    const tooltip = d3
      .select(map.getContainer())
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "5px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);
    svg
      .selectAll(".circe_ind")
      .data(jitteredData)
      .enter()
      .append("circle")
      .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
      .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
      .attr("r", map_ind_rad)
      .attr("fill", (d) => getColor(d))
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("fill-opacity", 1);

    map.on("moveend", updateCircles);
    map.on("zoomend", updateCircles);

    // Create the legend content
    const legendContainer = d3.select("#legend");
    legendContainer.selectAll("*").remove(); // Clear previous legend content

    // Create the main legend based on the "col" argument
    function createMainLegend() {
      const mainLegend = legendContainer
        .append("div")
        .attr("class", "main-legend")
        .style("margin-bottom", "10px");

      mainLegend
        .append("div")
        .text(col_unmapped || "Main Legend")
        .style("font-weight", "bold")
        .style("margin-bottom", "5px");

      // Populate main legend based on whether it’s continuous or discrete
      if (discreteOrContinuous === "continuous" && legendData[0].extent) {
        // Continuous gradient legend
        const gradientLegend = mainLegend
          .append("div")
          .append("svg")
          .attr("width", 150) // Increase width to accommodate text
          .attr("height", 220); // Increase height to fit text above and below

        // Append linear gradient
        const gradient = gradientLegend
          .append("defs")
          .append("linearGradient")
          .attr("id", "main-color-gradient")
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2", "0%");

        const extent = legendData[0].extent;
        const colorScale = d3
          .scaleSequential(d3.interpolateViridis)
          .domain(extent);

        // Create gradient stops
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          gradient
            .append("stop")
            .attr("offset", `${t * 100}%`)
            .attr(
              "stop-color",
              colorScale(extent[0] + t * (extent[1] - extent[0]))
            );
        }

        // Draw the gradient rectangle
        gradientLegend
          .append("rect")
          .attr("x", 15) // Center the rectangle in the svg
          .attr("y", 10) // Add some padding at the top
          .attr("width", 20)
          .attr("height", 200)
          .style("fill", "url(#main-color-gradient)");

        // Add min label at the bottom of the gradient
        gradientLegend
          .append("text")
          .attr("x", 40) // Position to the right of the gradient rectangle
          .attr("y", 210) // Position slightly below the rectangle
          .style("font-size", "10px") // Adjust font size if needed
          .text(`Min: ${extent[0].toFixed(3)}`);

        // Add max label at the top of the gradient
        gradientLegend
          .append("text")
          .attr("x", 40) // Position to the right of the gradient rectangle
          .attr("y", 10) // Position slightly above the rectangle
          .attr("dy", "0.35em")
          .style("font-size", "10px") // Adjust font size if needed
          .text(`Max: ${extent[1].toFixed(3)}`);
      } else {
        // Discrete legend
        legendData.forEach((item) => {
          const legendItem = mainLegend.append("div").style("display", "flex");
          legendItem
            .append("div")
            .style("width", "18px")
            .style("height", "18px")
            .style("background-color", item.color)
            .style("margin-right", "8px");
          legendItem.append("span").text(item.label);
        });
      }
    }

    createMainLegend();

    // Function to create a discrete legend
    function createDiscreteLegend(
      container: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
      title: string,
      colorScale: d3.ScaleOrdinal<string, string>
    ) {
      const legend = container.append("div").style("margin-bottom", "10px");

      legend
        .append("div")
        .text(title)
        .style("font-weight", "bold")
        .style("margin-bottom", "5px");

      colorScale.domain().forEach((value: string) => {
        const item = legend
          .append("div")
          .style("display", "flex")
          .style("align-items", "center")
          .style("margin-bottom", "3px");

        item
          .append("div")
          .style("width", "18px")
          .style("height", "18px")
          .style("background-color", colorScale(value))
          .style("margin-right", "8px");

        item.append("span").text(value);
      });
    }

    // Add Dataset legend if map_data is enabled
    if (map_data) {
      createDiscreteLegend(legendContainer, "Dataset", dataColorScale);
    }

    // Add Region legend if map_reg is enabled
    if (map_reg) {
      createDiscreteLegend(legendContainer, "Region", regColorScale);
    }

    // Add Population legend if map_pop is enabled
    if (map_pop) {
      createDiscreteLegend(legendContainer, "Population", popColorScale);
    }

    return () => {
      map.remove();
    };
  }, [
    data,
    col,
    map_data,
    map_reg,
    map_pop,
    map_data_rad,
    map_reg_rad,
    map_pop_rad,
    map_lat_jit,
    map_lon_jit,
  ]);

  return (
    <div style={{ position: "relative", height: "94%", width: "100%" }}>
      <div ref={mapRef} id="mapid" style={{ height: "100%", width: "100%" }} />
      <div
        id="legend"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "4px",
          boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
          zIndex: 1000,
        }}
      />
    </div>
  );
};

export default MapComponent;
