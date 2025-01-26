import { variables } from "@/assets/FilterOptions";
import { data_cmaps, reg_cmaps } from "@/assets/colormaps";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import * as d3 from "d3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";

interface JitteredDataPoint extends DataPoint {
  jitteredLat?: number;
  jitteredLon?: number;
}

interface MapComponentProps {
  data: JitteredDataPoint[];
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
  data: JitteredDataPoint[],
  col: string
): {
  getColor: (d: JitteredDataPoint) => string;
  legendData: { label: string; color: string; extent?: [number, number] }[];
  discreteOrContinuous: string;
} => {
  let getColor: (d: JitteredDataPoint) => string;
  let legendData: { label: string; color: string; extent?: [number, number] }[];
  let discreteOrContinuous: string;

  if (col === "") {
    const defaultColor = "steelblue";
    getColor = () => defaultColor;
    legendData = [{ label: "Default Color", color: defaultColor }];
    discreteOrContinuous = "default";
  }
  // Rule 2: If the variable in col is continuous, create a continuous colormap
  else if (variables.continuousOptionsShort.includes(col)) {
    const extent = d3.extent(data, (d) => +d[col as keyof JitteredDataPoint]!);
    const isExtentValid = extent[0] !== undefined && extent[1] !== undefined;
    const colorScale = d3
      .scaleSequential(d3.interpolateTurbo)
      .domain(extent as [number, number]);

    getColor = (d) => {
      const value = d[col as keyof JitteredDataPoint];
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
  }

  return { getColor, legendData, discreteOrContinuous };
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
  const ancFields = [
    "ancAMR",
    "ancEAS",
    "ancSAS",
    "ancAFR",
    "ancEUR",
    "ancOCE",
  ];

  let filteredData = data;
  const colIsAnc = ancFields.includes(col);

  if (colIsAnc) {
    filteredData = data.filter((d) => d[col as keyof DataPoint] !== null);
  }

  // Proceed with filteredData instead of data
  data = filteredData;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dataColorScale = (dat: string) => {
    return data_cmaps[dat as keyof typeof data_cmaps] || "#CCCCCC";
  };

  const regColorScale = (reg: string) => {
    return reg_cmaps[reg as keyof typeof reg_cmaps] || "#CCCCCC";
  };

  const popColorScale = d3
    .scaleOrdinal(d3.schemeSet2)
    .domain([...new Set(data.map((d) => d.pop))]);

  const baseZoom = 5; // Reference zoom level
  const baseRadiusData = map_data_rad; // Base radius for data circles
  const baseRadiusReg = map_reg_rad; // Base radius for region circles
  const baseRadiusPop = map_pop_rad; // Base radius for population circles
  const baseRadiusInd = map_ind_rad; // Base radius for individual circles
  function getScaleFactor(currentZoom: number) {
    const scale = Math.pow(2, currentZoom - baseZoom);
    return scale;
  }

  useEffect(() => {
    if (!mapRef.current) return;
    const mapElement = mapRef.current;
    const bounds = L.latLngBounds(
      L.latLng(-85, -250), // Southwest corner
      L.latLng(85, 250) // Northeast corner
    );
    const tooltip = d3
      .select(mapElement)
      .append("div")
      .attr("class", "map-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("opacity", 0)
      .style("display", "none");
    // Function to format numeric values with limited decimal places
    const formatValue = (value: number | string | null, decimals = 3): string => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'string') return value;
      if (value === 0) {
        return '0';
      }

      // Use scientific notation if |value| < 0.1:
      if (Math.abs(value) < 0.1) {
        // Convert to exponential with 'decimals' digits
        const exp = value.toExponential(decimals); // e.g. "9.000e-2"
        const [mantissaRaw, exponent] = exp.split('e');
        const mantissa = mantissaRaw.replace(/\.?0+$/, '');

        return `${mantissa}e${exponent}`;
      } else {
        // Use Intl.NumberFormat for comma separators.
        // "maximumFractionDigits" ensures up to `decimals` places
        // "minimumFractionDigits: 0" strips trailing zeros
        const formatter = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        });
        return formatter.format(value);
      }
    };

    // Updated tooltip positioning function
    const positionTooltip = (event: MouseEvent, d: JitteredDataPoint) => {
      // Get the map's current container dimensions
      const mapRect = mapElement.getBoundingClientRect();

      // Calculate mouse position relative to the map container
      const mouseX = event.clientX - mapRect.left;
      const mouseY = event.clientY - mapRect.top;

      // Position the tooltip
      tooltip
        .style("left", `${mouseX + 10}px`)
        .style("top", `${mouseY + 10}px`)
        .style("display", "block")
        .style("opacity", 1)
        .html(`
          <div style="font-size: 12px; max-width: 250px;">
            <strong>Individual:</strong> ${d.ind}<br/>
            <strong>Sex:</strong> ${d.sex}<br/>
            <strong>Dataset:</strong> ${d.dat}<br/>
            <strong>Region:</strong> ${d.reg}<br/>
            <strong>Population:</strong> ${d.pop}<br/>
            <strong>Chromosome:</strong> ${d.chrom}<br/>
            <strong>Haplotype:</strong> ${formatValue(d.hap)}<br/>
            <strong>Sequence:</strong> ${formatValue(d.seq)}<br/>
            <strong>Time:</strong> ${formatValue(d.tim)}<br/>
            <strong>Length (Mean):</strong> ${formatValue(d.len_mea)}<br/>
            <strong>Length (Median):</strong> ${formatValue(d.len_med)}<br/>
            <strong>Length (Max):</strong> ${formatValue(d.len_max)}<br/>
            <strong>Length (Min):</strong> ${formatValue(d.len_min)}<br/>
            ${d.ancAMR !== null ? `<strong>Ancestry AMR:</strong> ${formatValue(d.ancAMR)}<br/>` : ''}
            ${d.ancEAS !== null ? `<strong>Ancestry EAS:</strong> ${formatValue(d.ancEAS)}<br/>` : ''}
            ${d.ancSAS !== null ? `<strong>Ancestry SAS:</strong> ${formatValue(d.ancSAS)}<br/>` : ''}
            ${d.ancAFR !== null ? `<strong>Ancestry AFR:</strong> ${formatValue(d.ancAFR)}<br/>` : ''}
            ${d.ancEUR !== null ? `<strong>Ancestry EUR:</strong> ${formatValue(d.ancEUR)}<br/>` : ''}
            ${d.ancOCE !== null ? `<strong>Ancestry OCE:</strong> ${formatValue(d.ancOCE)}<br/>` : ''}
          </div>
        `);
    };

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [47, 2],
      zoom: 5,
      maxZoom: 10, // Set max zoom level to prevent zooming beyond bounds
      minZoom: 2.25, // Set min zoom level to prevent zooming beyond bounds
      maxBounds: bounds, // Set max bounds to restrict panning entirely
      maxBoundsViscosity: 1.0, // Set viscosity to 1 to completely block panning beyond bounds
      worldCopyJump: false, // Disable world copy to prevent wrapping at boundaries
      attributionControl: false, // Disable attribution control
    });
    // Create a new attribution control with position 'bottomleft'
    L.control
      .attribution({
        position: "bottomleft", // Position the attribution control in the lower left
      })
      .addTo(map);

    // Add a tile layer (OpenStreetMap)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 10,
      }
    ).addTo(map);

    // Add an SVG layer
    L.svg().addTo(map);

    // Function to project the lat/lon coordinates to pixels
    function projectPoint(lat: number, lon: number) {
      const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
      return point;
    }
    function generateGaussianNoise(mean: number, stdDev: number): number {
      let u = 0,
        v = 0;
      while (u === 0) u = Math.random(); // Ensure u is not zero
      while (v === 0) v = Math.random();
      return (
        stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) +
        mean
      );
    }

    function applyJitter(
      lat: number,
      lon: number,
      map_lat_jit: number,
      map_lon_jit: number
    ) {
      const jitterLat = lat + generateGaussianNoise(0, map_lat_jit);
      const jitterLon = lon + generateGaussianNoise(0, map_lon_jit);
      return { jitterLat, jitterLon };
    }

    const jitteredData = data.map((d) => {
      const { jitterLat, jitterLon } = applyJitter(
        d.lat,
        d.lon,
        map_lat_jit * 0.5,
        map_lon_jit * 0.5
      );
      return { ...d, jitteredLat: jitterLat, jitteredLon: jitterLon };
    });

    // Function to update the circles when the map moves
    // Update the circle positions when the map is zoomed or moved
    function updateCircles() {
      const currentZoom = map.getZoom();
      const scaleFactor = getScaleFactor(currentZoom);

      svg
        .selectAll(".circle_data")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y)
        .attr("r", baseRadiusData * scaleFactor);

      svg
        .selectAll(".circle_reg")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y)
        .attr("r", baseRadiusReg * scaleFactor);

      svg
        .selectAll(".circle_pop")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y)
        .attr("r", baseRadiusPop * scaleFactor);

      svg
        .selectAll(".circle_ind")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", baseRadiusInd * scaleFactor)
        .attr("pointer-events", "visible");
    }

    const { getColor, legendData, discreteOrContinuous } = createColorScale(
      data,
      col
    );

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
    const currentZoom = map.getZoom();
    const scaleFactor = getScaleFactor(currentZoom);

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
        .attr("r", baseRadiusData * scaleFactor)
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
        .attr("r", baseRadiusReg * scaleFactor)
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
        .attr("r", baseRadiusPop * scaleFactor)
        .attr("fill", (d) => popColorScale(d.pop))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.6);
    }

    svg
      .selectAll(".circle_ind")
      .data(jitteredData)
      .enter()
      .append("circle")
      .attr("class", "circle_ind")
      .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
      .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
      .attr("r", baseRadiusInd * scaleFactor)
      .attr("fill", (d) => getColor(d))
      .attr("fill-opacity", 1)
      .on("mouseenter", function (event, d) {
        // Highlight the circle
        d3.select(this)
          .attr("stroke", "black")
          .attr("stroke-width", 2);

        // Position and show the tooltip
        positionTooltip(event, d);
      })
      .on("mousemove", function (event, d) {
        // Update tooltip position as mouse moves
        positionTooltip(event, d);
      })
      .on("mouseleave", function () {
        // Remove highlight and hide tooltip
        d3.select(this)
          .attr("stroke", null)
          .attr("stroke-width", 0);

        tooltip
          .style("display", "none")
          .style("opacity", 0);
      });

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
          .scaleSequential(d3.interpolateTurbo)
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
          .attr("x", 40)
          .attr("y", 210)
          .style("font-size", "15px")
          .text(`Min: ${formatValue(extent[0], 3)}`);

        // Add max label at the top of the gradient
        gradientLegend
          .append("text")
          .attr("x", 40) // Position to the right of the gradient rectangle
          .attr("y", 25)
          .style("font-size", "15px") // Adjust font size if needed
          .text(`Max: ${formatValue(extent[1], 3)}`);
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
      colorInput: Record<string, string> | d3.ScaleOrdinal<string, string>,
      selectedValues: string[]
    ) {
      const legend = container.append("div").style("margin-bottom", "10px");

      legend
        .append("div")
        .text(title)
        .style("font-weight", "bold")
        .style("margin-bottom", "5px");

      // Handle both predefined colormaps and D3 scales
      selectedValues.forEach((key) => {
        const color =
          typeof colorInput === "function"
            ? colorInput(key) // For D3 scales
            : colorInput[key]; // For plain colormap objects

        if (color) {
          const item = legend
            .append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "3px");

          item
            .append("div")
            .style("width", "18px")
            .style("height", "18px")
            .style("background-color", color)
            .style("margin-right", "8px");

          item.append("span").text(key);
        }
      });
    }

    // Add Dataset legend if map_data is enabled
    if (map_reg) {
      const selectedRegionValues = [...new Set(data.map((d) => d.reg))];
      createDiscreteLegend(
        legendContainer,
        "Region",
        reg_cmaps,
        selectedRegionValues
      );
    }

    if (map_data) {
      const selectedDataValues = [...new Set(data.map((d) => d.dat))];
      createDiscreteLegend(
        legendContainer,
        "Dataset",
        data_cmaps,
        selectedDataValues
      );
    }

    if (map_pop) {
      const selectedPopulationValues = [...new Set(data.map((d) => d.pop))];
      createDiscreteLegend(
        legendContainer,
        "Population",
        popColorScale,
        selectedPopulationValues
      );
    }

    return () => {
      map.remove();
      tooltip.remove();
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
    baseRadiusData,
    baseRadiusReg,
    baseRadiusPop,
    baseRadiusInd,
    col_unmapped,
    popColorScale,
  ]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={mapRef} id="mapid" style={{ height: "100%", width: "100%" }} />
      <div
        id="legend"
        style={{
          position: "absolute",
          bottom: "3%",
          left: "1%",
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
