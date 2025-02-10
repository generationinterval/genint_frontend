import { variables } from "@/assets/FilterOptions";
import { anc_cmaps, data_cmaps, reg_cmaps } from "@/assets/colormaps";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import * as d3 from "d3";
import React, { useCallback, useEffect, useRef } from "react";

// Define the props for a 2D density plot.
// Note: We now have two mapped variables and separate booleans for mean/median lines.
type TDDensityPlotProps = {
  data: DataPoint[];
  var_x_mapped: string;
  var_y_mapped: string;
  col: string[]; // You can later extend this to support grouping/coloring if needed.
  isSidebarVisible: boolean;
  mea_med_x: boolean;
  mea_med_y: boolean;
  x_axis: string;
  min_x_axis: number;
  max_x_axis: number;
  y_axis: string;
  min_y_axis: number;
  max_y_axis: number;
  bandwidth_divisor: number;
  thresholds: number;
};

const createColorScale = (
  data: DataPoint[],
  col: string[]
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

  // 1) If col length = 1 and it is empty => use default color
  if (col.length === 1 && col[0] === "") {
    const defaultColor = "steelblue";
    getColor = () => defaultColor;
    legendData = [{ label: "Default Color", color: defaultColor }];
    discreteOrContinuous = "default";
    globalColorOrder = [defaultColor];
  }
  // 2) If col length = 1 and col[0] is in { "reg", "dat", "anc" }, use your custom maps
  else if (col.length === 1 && ["reg", "dat", "anc"].includes(col[0])) {
    // Determine which colormap object to use
    let chosenMap: Record<string, string> = {};
    if (col[0] === "reg") {
      chosenMap = reg_cmaps;
    } else if (col[0] === "dat") {
      chosenMap = data_cmaps;
    } else if (col[0] === "anc") {
      chosenMap = anc_cmaps;
    }

    // Extract unique 'color' values from data
    const uniqueValues = [
      ...new Set(
        data
          .map((d) => d.color)
          .filter((c) => c !== null && c !== undefined)
          .map(String)
      ),
    ];

    // The getColor function looks up the color in the chosen map, fallback to "steelblue"
    getColor = (d) => {
      const val = d.color;
      if (!val) return "steelblue";
      return chosenMap[val] || "steelblue";
    };

    // Build legend data, using either the encountered uniqueValues or all keys from chosenMap
    // Here we just build from encountered uniqueValues to show only what's in data:
    legendData = uniqueValues.map((val) => ({
      label:
        variables.mappingToLong[
        val as keyof typeof variables.mappingToLong
        ] || String(val),             // Or a custom label if you have a mapping
      color: chosenMap[val] || "steelblue",
    }));

    discreteOrContinuous = "discrete";
    globalColorOrder = uniqueValues; // So your chart can order categories consistently
  }
  // 3) If col[0] is in continuousOptionsShort => use continuous colormap logic
  else if (variables.continuousOptionsShort.includes(col[0])) {
    const extent = d3.extent(data, (d) => +d[col[0] as keyof DataPoint]!);
    const isExtentValid = extent[0] !== undefined && extent[1] !== undefined;
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain(extent as [number, number]);

    getColor = (d) => {
      const value = d[col[0] as keyof DataPoint];
      return value !== null && value !== undefined
        ? colorScale(+value)
        : "steelblue";
    };

    legendData = isExtentValid
      ? [
        { label: `Min: ${extent[0]}`, color: colorScale(extent[0]!), extent },
        { label: `Max: ${extent[1]}`, color: colorScale(extent[1]!), extent },
      ]
      : [{ label: "No valid data", color: "steelblue" }];
    discreteOrContinuous = "continuous";
    globalColorOrder = [];
  }
  // 4) Otherwise, treat as discrete with the default d3.schemeCategory10 approach
  else {
    const uniqueValues = [
      ...new Set(
        data
          .map((d) => d.color)
          .filter((c) => c !== null && c !== undefined)
          .map(String)
      ),
    ];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueValues);

    getColor = (d) => {
      const value = d.color;
      return value !== null && value !== undefined
        ? colorScale(String(value))
        : "steelblue";
    };

    legendData = uniqueValues.map((value) => ({
      label: variables.mappingToLong[value as keyof typeof variables.mappingToLong] || value,
      color: colorScale(value),
    }));
    discreteOrContinuous = "discrete";
    globalColorOrder = uniqueValues;
  }

  return { getColor, legendData, discreteOrContinuous, globalColorOrder };
};

const drawTDDensity = (
  facetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  facetData: DataPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  plotHeight: number,
  plotWidth: number,
  var_x: string,
  var_y: string,
  getColor: (d: DataPoint) => string,
  globalColorOrder: string[], // Pass global color order
  mea_med_x: boolean,
  mea_med_y: boolean,
  title: string,
  x_label: string,
  y_label: string,
  bandwidth_divisor: number,
  thresholds: number
) => {

  // Compute 2D density contours using d3.contourDensity.

  const densityData = d3
    .contourDensity<DataPoint>()
    .x((d) => xScale(+d[var_x as keyof DataPoint]!))
    .y((d) => yScale(+d[var_y as keyof DataPoint]!))
    .size([plotWidth, plotHeight])
    .bandwidth(bandwidth_divisor)
    .thresholds(thresholds)(facetData);

  // Create a color scale for the density values.
  const densityValues = densityData.map((d) => d.value);
  const densityMin = d3.min(densityValues) || 0;
  const densityMax = d3.max(densityValues) || 1;
  const colorScale = d3
    .scaleSequential(d3.interpolateViridis)
    .domain([densityMin, densityMax]);

  facetGroup
    .append("g").attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format(".1e")));
  facetGroup
    .append("g")
    .call(d3.axisLeft(yScale).tickFormat(d3.format(".1e")));
  // X label
  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", plotHeight + 35)
    .attr("text-anchor", "middle")
    .text(x_label);

  // Y label
  facetGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -plotHeight / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text(y_label);
  // Plot title
  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text(title);
  // Draw the density contours.
  facetGroup
    .append("g")
    .selectAll("path")
    .data(densityData)
    .enter()
    .append("path")
    .attr("d", d3.geoPath())
    .attr("fill", (d) => colorScale(d.value))
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .attr("stroke-linejoin", "round");

  // Optionally, draw mean and median lines.

  if (mea_med_x || mea_med_y) {
    const colorGroups = d3.group(facetData, (d) => getColor(d));

    colorGroups.forEach((groupData, color) => {
      const container = d3.select("#plot-container"); // Assuming you have a div with this id
      const tooltip = container.append("div").attr("class", "tooltip");

      // Calculate mean and median for x and y
      if (mea_med_x) {
        const mean_x = d3.mean(
          groupData,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const median_x = d3.median(
          groupData,
          (d) => d[var_x as keyof DataPoint] as number
        )!;

        // Draw mean line for x (vertical line)
        facetGroup
          .append("line")
          .attr("x1", xScale(mean_x))
          .attr("x2", xScale(mean_x))
          .attr("y1", yScale.range()[0])
          .attr("y2", yScale.range()[1])
          .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4")
          .on("mouseenter", () => {
            tooltip.transition().duration(200).style("opacity", 1); // Show tooltip
            tooltip.html(
              `<strong>Group:</strong> ${groupData[0].color
              }<br/><strong>Mean X:</strong> ${mean_x.toFixed(2)}`
            );
          })
          .on("mousemove", (event) => {
            const [mouseX, mouseY] = d3.pointer(event, container.node()); // Ensure the mouse position is relative to the container
            tooltip
              .style("left", `${mouseX + 10}px`)
              .style("top", `${mouseY - 28}px`);
          })
          .on("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
          });

        // Draw median line for x (vertical line)
        facetGroup
          .append("line")
          .attr("x1", xScale(median_x))
          .attr("x2", xScale(median_x))
          .attr("y1", yScale.range()[0])
          .attr("y2", yScale.range()[1])
          .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "2,4")
          .on("mouseenter", () => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(
              `<strong>Group:</strong> ${groupData[0].color
              }<br/><strong>Median X:</strong> ${median_x.toFixed(2)}`
            );
          })
          .on("mousemove", (event) => {
            const [mouseX, mouseY] = d3.pointer(event, container.node());
            tooltip
              .style("left", `${mouseX + 10}px`)
              .style("top", `${mouseY - 28}px`);
          })
          .on("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0);
          });
      }

      if (mea_med_y) {
        const mean_y = d3.mean(
          groupData,
          (d) => d[var_y as keyof DataPoint] as number
        )!;
        const median_y = d3.median(
          groupData,
          (d) => d[var_y as keyof DataPoint] as number
        )!;

        // Draw mean line for y (horizontal line)
        facetGroup
          .append("line")
          .attr("x1", xScale.range()[0])
          .attr("x2", xScale.range()[1])
          .attr("y1", yScale(mean_y))
          .attr("y2", yScale(mean_y))
          .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4")
          .on("mouseenter", () => {
            tooltip.transition().duration(200).style("opacity", 1); // Show tooltip
            tooltip.html(
              `<strong>Group:</strong> ${groupData[0].color
              }<br/><strong>Mean Y:</strong> ${mean_y.toFixed(2)}`
            );
          })
          .on("mousemove", (event) => {
            const [mouseX, mouseY] = d3.pointer(event, container.node());
            tooltip
              .style("left", `${mouseX + 10}px`)
              .style("top", `${mouseY - 28}px`);
          })
          .on("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0);
          });

        // Draw median line for y (horizontal line)
        facetGroup
          .append("line")
          .attr("x1", xScale.range()[0])
          .attr("x2", xScale.range()[1])
          .attr("y1", yScale(median_y))
          .attr("y2", yScale(median_y))
          .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "2,4")
          .on("mouseenter", () => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(
              `<strong>Group:</strong> ${groupData[0].color
              }<br/><strong>Median Y:</strong> ${median_y.toFixed(2)}`
            );
          })
          .on("mousemove", (event) => {
            const [mouseX, mouseY] = d3.pointer(event, container.node());
            tooltip
              .style("left", `${mouseX + 10}px`)
              .style("top", `${mouseY - 28}px`);
          })
          .on("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0);
          });
      }
    });
  }



};

// This function clears the SVG and draws the 2D density plot.
const fullTDDensity = (
  svgElement: SVGSVGElement,
  data: DataPoint[],
  var_x_mapped: string,
  var_y_mapped: string,
  col: string[],
  mea_med_x: boolean,
  mea_med_y: boolean,
  x_axis: string,
  min_x_axis: number,
  max_x_axis: number,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  bandwidth_divisor: number,
  thresholds: number
) => {

  // (1) Filter data for ancestry rules if needed
  const ancFields = [
    "ancAMR",
    "ancEAS",
    "ancSAS",
    "ancAFR",
    "ancEUR",
    "ancOCE",
  ];

  let filteredData = data;

  // Check if either of the two mapped variables is an ancestry field.
  const varXIsAnc = ancFields.includes(var_x_mapped);
  const varYIsAnc = ancFields.includes(var_y_mapped);
  // Also check if any field in col is an ancestry field.
  const colHasAnc = col.some((c) => ancFields.includes(c));

  if (varXIsAnc || varYIsAnc || colHasAnc) {
    filteredData = data.filter((d) => {
      let keep = true;

      // If var_x_mapped is an ancestry field, ensure it is not null.
      if (varXIsAnc && d[var_x_mapped as keyof DataPoint] === null) {
        keep = false;
      }

      // If var_y_mapped is an ancestry field, ensure it is not null.
      if (varYIsAnc && d[var_y_mapped as keyof DataPoint] === null) {
        keep = false;
      }

      // If any column in col is an ancestry field, ensure its value is not null.
      if (colHasAnc) {
        for (const c of col) {
          if (ancFields.includes(c) && d[c as keyof DataPoint] === null) {
            keep = false;
            break;
          }
        }
      }

      return keep;
    });
  }

  // Proceed with filteredData instead of data
  data = filteredData;
  // Clear any existing content.
  d3.select(svgElement).selectAll("*").remove();

  // Set up margins and dimensions.
  const container = svgElement.parentElement;

  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const width = container ? container.clientWidth : 960;
  const height = container ? container.clientHeight : 600;
  const { getColor, legendData, discreteOrContinuous, globalColorOrder } =
    createColorScale(data, col);
  // Extract unique values for faceting directly from the data
  const uniqueFacX = [...new Set(data.map((d) => d.fac_x))].filter(
    (val) => val !== null
  );
  const uniqueFacY = [...new Set(data.map((d) => d.fac_y))].filter(
    (val) => val !== null
  );

  // Determine if faceting is needed
  const facetingRequiredX = uniqueFacX.length > 1;
  const facetingRequiredY = uniqueFacY.length > 1;

  // Determine number of rows and columns in the grid based on faceting
  const numCols = facetingRequiredX ? uniqueFacX.length : 1;
  const numRows = facetingRequiredY ? uniqueFacY.length : 1;

  const colPadding = 60;
  const rowPadding = 70;

  const plotWidth =
    numCols === 1
      ? width - margin.right - margin.left - colPadding
      : (width - margin.right - margin.left) / numCols - colPadding;
  const plotHeight =
    numRows === 1
      ? height - margin.bottom - margin.top - rowPadding
      : (height - margin.bottom - margin.top) / numRows - rowPadding;
  // Append a group element to respect the margins.
  const svg = d3
    .select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(0,0)`);
  // Define the x and y scales.
  const xScale = d3.scaleLinear().range([0, plotWidth]);
  const yScale = d3.scaleLinear().range([plotHeight, 0]);

  // Discrete legend
  const padding = 30;
  let cumulativeWidth = 0;
  const legend = svg.append("g").attr(
    "transform",
    `translate(${margin.left + colPadding / 2}, ${height - rowPadding / 1.5})` // Start legend at the leftmost point of the container
  );
  // Create legend items dynamically
  if (mea_med_x || mea_med_y) {
    legendData.forEach((d) => {
      // Append rectangle for the color box
      legend
        .append("rect")
        .attr("x", cumulativeWidth)
        .attr("y", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d.color);

      // Append text label
      const text = legend
        .append("text")
        .attr("x", cumulativeWidth + 24) // Position text next to the rectangle
        .attr("y", 9) // Center text vertically with the rectangle
        .attr("dy", ".35em")
        .text(d.label);

      const textNode = text.node();
      if (textNode) {
        const textWidth = textNode.getBBox().width;
        cumulativeWidth += 18 + textWidth + padding; // Update cumulative width with rectangle, text, and padding
      }
    });
  }
  if (x_axis === "Shared Axis") {
    const xExtent = d3.extent(data, d => +d[var_x_mapped as keyof DataPoint]!) as [number, number];
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% of the range
    xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([0, plotWidth]);
  }
  else if (x_axis === "Define Range") {
    xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
  }
  if (y_axis === "Shared Axis") {
    const yExtent = d3.extent(data, d => +d[var_y_mapped as keyof DataPoint]!) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% of the range
    yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([plotHeight, 0]);
  }
  else if (y_axis === "Define Range") {
    yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
  }

  if (facetingRequiredX && facetingRequiredY) {
    // Apply faceting on both fac_x and fac_y
    uniqueFacX.forEach((facXValue, i) => {
      uniqueFacY.forEach((facYValue, j) => {
        const facetData = data.filter(
          (d) => d.fac_x === facXValue && d.fac_y === facYValue
        );

        const facetGroup = svg
          .append("g")
          .attr(
            "transform",
            `translate(${margin.left +
            (i * plotWidth +
              i * (colPadding / 2) +
              (i + 1) * (colPadding / 2))
            },${margin.top +
            j * plotHeight +
            j * (rowPadding / 2) +
            (j + 1) * (rowPadding / 2)
            })`
          );
        const title = `${facXValue} / ${facYValue}`;
        const x_label =
          variables.mappingToLong[
          var_x_mapped as keyof typeof variables.mappingToLong
          ];
        const y_label =
          variables.mappingToLong[
          var_y_mapped as keyof typeof variables.mappingToLong
          ];

        if (x_axis === "Free Axis") {
          const xExtent = d3.extent(facetData, d => +d[var_x_mapped as keyof DataPoint]!) as [number, number];
          const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% of the range
          xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([0, plotWidth]);
        }
        if (y_axis === "Free Axis") {
          const yExtent = d3.extent(facetData, d => +d[var_y_mapped as keyof DataPoint]!) as [number, number];
          const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% of the range
          yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([plotHeight, 0]);
        };

        drawTDDensity(
          facetGroup,
          facetData,
          xScale,
          yScale,
          plotHeight,
          plotWidth,
          var_x_mapped,
          var_y_mapped,
          getColor,
          globalColorOrder,
          mea_med_x,
          mea_med_y,
          title,
          x_label,
          y_label,
          bandwidth_divisor,
          thresholds,
        );
      });
    });
  } else if (facetingRequiredX) {
    // Apply faceting on fac_x only
    uniqueFacX.forEach((facXValue, i) => {
      const facetData = data.filter((d) => d.fac_x === facXValue);
      const j = 0;
      // Append a group for each facet
      const facetGroup = svg.append("g").attr(
        "transform",
        `translate(${margin.left +
        (i * plotWidth + i * (colPadding / 2) + (i + 1) * (colPadding / 2))
        },${margin.top +
        j * plotHeight +
        j * (rowPadding / 2) +
        (j + 1) * (rowPadding / 2)
        })
          `
      );

      const title = `${facXValue}`;
      const x_label =
        variables.mappingToLong[
        var_x_mapped as keyof typeof variables.mappingToLong
        ];
      const y_label =
        variables.mappingToLong[
        var_y_mapped as keyof typeof variables.mappingToLong
        ];

      if (x_axis === "Free Axis") {
        const xExtent = d3.extent(facetData, d => +d[var_x_mapped as keyof DataPoint]!) as [number, number];
        const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% of the range
        xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([0, plotWidth]);
      }
      if (y_axis === "Free Axis") {
        const yExtent = d3.extent(facetData, d => +d[var_y_mapped as keyof DataPoint]!) as [number, number];
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% of the range
        yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([plotHeight, 0]);
      };

      drawTDDensity(
        facetGroup,
        facetData,
        xScale,
        yScale,
        plotHeight,
        plotWidth,
        var_x_mapped,
        var_y_mapped,
        getColor,
        globalColorOrder,
        mea_med_x,
        mea_med_y,
        title,
        x_label,
        y_label,
        bandwidth_divisor,
        thresholds
      );
    });
  } else if (facetingRequiredY) {
    // Apply faceting on fac_x only
    uniqueFacX.forEach((facYValue, j) => {
      const facetData = data.filter((d) => d.fac_y === facYValue);
      const i = 0;

      // Append a group for each facet
      const facetGroup = svg.append("g").attr(
        "transform",
        `translate(${margin.left +
        (i * plotWidth + i * (colPadding / 2) + (i + 1) * (colPadding / 2))
        },${margin.top +
        j * plotHeight +
        j * (rowPadding / 2) +
        (j + 1) * (rowPadding / 2)
        })
          `
      );

      const title = `${facYValue}`;
      const x_label =
        variables.mappingToLong[
        var_x_mapped as keyof typeof variables.mappingToLong
        ];
      const y_label =
        variables.mappingToLong[
        var_y_mapped as keyof typeof variables.mappingToLong
        ];

      if (x_axis === "Free Axis") {
        const xExtent = d3.extent(facetData, d => +d[var_x_mapped as keyof DataPoint]!) as [number, number];
        const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% of the range
        xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([0, plotWidth]);
      }
      if (y_axis === "Free Axis") {
        const yExtent = d3.extent(facetData, d => +d[var_y_mapped as keyof DataPoint]!) as [number, number];
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% of the range
        yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([plotHeight, 0]);
      };

      drawTDDensity(
        facetGroup,
        facetData,
        xScale,
        yScale,
        plotHeight,
        plotWidth,
        var_x_mapped,
        var_y_mapped,
        getColor,
        globalColorOrder,
        mea_med_x,
        mea_med_y,
        title,
        x_label,
        y_label,
        bandwidth_divisor,
        thresholds
      );
    });
  }
  else {
    const i = 0;
    const j = 0;
    const facetGroup = svg.append("g").attr(
      "transform",
      `translate(${margin.left +
      (i * plotWidth + i * (colPadding / 2) + (i + 1) * (colPadding / 2))
      },${margin.top +
      j * plotHeight +
      j * (rowPadding / 2) +
      (j + 1) * (rowPadding / 2)
      })
          `
    );
    const title = ``;
    const x_label =
      variables.mappingToLong[
      var_x_mapped as keyof typeof variables.mappingToLong
      ];
    const y_label =
      variables.mappingToLong[
      var_y_mapped as keyof typeof variables.mappingToLong
      ];

    if (x_axis === "Free Axis") {
      const xExtent = d3.extent(data, d => +d[var_x_mapped as keyof DataPoint]!) as [number, number];
      const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% of the range
      xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([0, plotWidth]);
    }
    if (y_axis === "Free Axis") {
      const yExtent = d3.extent(data, d => +d[var_y_mapped as keyof DataPoint]!) as [number, number];
      const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% of the range
      yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([plotHeight, 0]);
    };

    drawTDDensity(
      facetGroup,
      data,
      xScale,
      yScale,
      plotHeight,
      plotWidth,
      var_x_mapped,
      var_y_mapped,
      getColor,
      globalColorOrder,
      mea_med_x,
      mea_med_y,
      title,
      x_label,
      y_label,
      bandwidth_divisor,
      thresholds
    );
  }
}


const TDDensityComponent: React.FC<TDDensityPlotProps> = ({
  data,
  var_x_mapped,
  var_y_mapped,
  col,
  isSidebarVisible,
  mea_med_x,
  mea_med_y,
  x_axis,
  min_x_axis,
  max_x_axis,
  y_axis,
  min_y_axis,
  max_y_axis,
  bandwidth_divisor,
  thresholds
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      fullTDDensity(
        svgRef.current,
        data,
        var_x_mapped,
        var_y_mapped,
        col,
        mea_med_x,
        mea_med_y,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis,
        bandwidth_divisor,
        thresholds
      );

    }
  }, [
    data,
    var_x_mapped,
    var_y_mapped,
    col,
    mea_med_x,
    mea_med_y,
    x_axis,
    min_x_axis,
    max_x_axis,
    y_axis,
    min_y_axis,
    max_y_axis,
    bandwidth_divisor,
    thresholds
  ]);

  const handleResize = useCallback(() => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      fullTDDensity(
        svgRef.current,
        data,
        var_x_mapped,
        var_y_mapped,
        col,
        mea_med_x,
        mea_med_y,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis,
        bandwidth_divisor,
        thresholds
      );

    }
  }, [
    data,
    var_x_mapped,
    var_y_mapped,
    col,
    mea_med_x,
    mea_med_y,
    x_axis,
    min_x_axis,
    max_x_axis,
    y_axis,
    min_y_axis,
    max_y_axis,
    bandwidth_divisor,
    thresholds
  ]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    // Call handleResize immediately to initialize size
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, handleResize]);

  useEffect(() => {
    handleResize();
  }, [isSidebarVisible, handleResize,]);
  return (
    <div
      id="plot-container"
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <svg id="histogram" ref={svgRef} />
    </div>
  );
};
export default TDDensityComponent;
