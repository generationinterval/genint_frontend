import { anc_cmaps, data_cmaps, reg_cmaps } from "@/assets/colormaps";
import { variables } from "@/assets/sharedOptions";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import * as d3 from "d3";
import React, { useCallback, useEffect, useRef } from "react";
import { kernelDensityEstimator, kernelEpanechnikov } from "../static/densityUtils";


type IDDensityPlotProps = {
  data: DataPoint[];
  var_1_mapped: string;
  col: string[];
  isSidebarVisible: boolean;
  mea_med_1: boolean;
  x_axis: string;
  min_x_axis: number;
  max_x_axis: number;
  y_axis: string;
  min_y_axis: number;
  max_y_axis: number;
  bandwidth_divisor: number;
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

const drawIDDensity = (
  facetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  facetData: DataPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  plotHeight: number,
  plotWidth: number,
  var_x: string,
  getColor: (d: DataPoint) => string,
  globalColorOrder: string[], // Pass global color order
  showMeanMedian: boolean,
  title: string,
  x_label: string,
  bandwidth_divisor: number
) => {

  // Group by color (just like in the histogram approach)
  const colorGroups = d3.group(facetData, (d) => getColor(d));

  // Decide the domain for the x-scale externally (already set).
  // We'll sample across that domain for the density function:
  const sampleX = xScale.ticks(100); // number of points along x

  // For setting yScale, we need to compute all densities and find the max
  let maxDensity = 0;
  const densitiesPerGroup: Map<string, [number, number][]> = new Map();
  // 1) Compute extent of your variable
  const extent = d3.extent(facetData, (d) => d[var_x as keyof DataPoint] as number);
  // extent is [number | undefined, number | undefined]

  if (extent[0] == null || extent[1] == null) {
    console.log(`Skipping drawIDDensity for facet "${title}", no valid extent found.`);
    return; // <-- just return here instead of throwing
  }

  const [minValue, maxValue] = extent;

  const bandwidth = (maxValue - minValue) / bandwidth_divisor;
  colorGroups.forEach((groupData, colorKey) => {
    const values = groupData.map((d) => d[var_x as keyof DataPoint] as number);
    const estimator = kernelDensityEstimator(kernelEpanechnikov(bandwidth), sampleX);
    const density = estimator(values).map(d => [d[0], d[1]] as [number, number]);
    densitiesPerGroup.set(colorKey, density);
    const localMax = d3.max(density, (d) => d[1]) || 0;
    if (localMax > maxDensity) maxDensity = localMax;
  });
  // Now set yScale domain according to your y-axis rules
  if (y_axis === "Define Range") {
    yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
  } else if (y_axis === "Free Axis") {
    yScale.domain([0, maxDensity * 1.05]).range([plotHeight, 0]);
  } else {
    throw new Error("Only 'Define Range' or 'Free Axis' are shown here for density.");
  }
  // Draw axes
  facetGroup
    .append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale));
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
    .text("Density");

  // Plot title
  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text(title);

  // Render one density curve per color group, overlaid
  densitiesPerGroup.forEach((density, colorKey) => {
    // Create the area under the density curve
    const areaGenerator = d3
      .area<[number, number]>()
      .x((d) => xScale(d[0]))
      .y0(yScale(0)) // Base of the area (y=0)
      .y1((d) => yScale(d[1])); // Top of the area (density)

    facetGroup
      .append("path")
      .datum(density)
      .attr("fill", d3.color(colorKey)?.copy({ opacity: 0.1 }).toString() || "rgba(0,0,255,0.1)")
      .attr("d", areaGenerator);
    facetGroup
      .append("path")
      .datum(density)
      .attr("fill", "none")
      .attr("stroke", colorKey) // each colorKey is the actual color from getColor
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line<[number, number]>()
          .x((d) => xScale(d[0]))
          .y((d) => yScale(d[1]))
      );
  });

  // Mean/Median lines if desired
  if (showMeanMedian) {
    colorGroups.forEach((groupData, color) => {
      const container = d3.select("#plot-container");
      const tooltip = container.append("div").attr("class", "tooltip");

      const mean = d3.mean(groupData, (d) => d[var_x as keyof DataPoint] as number) || 0;
      const median = d3.median(groupData, (d) => d[var_x as keyof DataPoint] as number) || 0;

      // Mean line
      facetGroup
        .append("line")
        .attr("x1", xScale(mean))
        .attr("x2", xScale(mean))
        .attr("y1", yScale.range()[0])
        .attr("y2", yScale.range()[1])
        .attr("stroke", d3.color(color)?.darker(0.7).formatHex() || "#000")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .on("mouseenter", () => {
          tooltip.style("opacity", 1);
          tooltip.html(`<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Mean:</strong> ${mean.toFixed(2)}`);
        })
        .on("mousemove", (event) => {
          const [mouseX, mouseY] = d3.pointer(event, container.node());
          tooltip.style("left", `${mouseX + 10}px`).style("top", `${mouseY - 28}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

      // Median line
      facetGroup
        .append("line")
        .attr("x1", xScale(median))
        .attr("x2", xScale(median))
        .attr("y1", yScale.range()[0])
        .attr("y2", yScale.range()[1])
        .attr("stroke", d3.color(color)?.darker(0.7).formatHex() || "#000")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "2,4")
        .on("mouseenter", () => {
          tooltip.style("opacity", 1);
          tooltip.html(`<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Median:</strong> ${median.toFixed(2)}`);
        })
        .on("mousemove", (event) => {
          const [mouseX, mouseY] = d3.pointer(event, container.node());
          tooltip.style("left", `${mouseX + 10}px`).style("top", `${mouseY - 28}px`);
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    });
  }
};

const fullDensity = (
  svgElement: SVGSVGElement,
  data: DataPoint[],
  col: string[],
  var_x: string,
  showMeanMedian: boolean,
  x_axis: string,
  min_x_axis: number,
  max_x_axis: number,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  bandwidth_divisor: number
) => {
  // (1) Filter data for ancestry rules if needed, same as your histogram version
  const ancFields = [
    "ancAMR",
    "ancEAS",
    "ancSAS",
    "ancAFR",
    "ancEUR",
    "ancOCE",
  ];

  let filteredData = data;
  const varIsAnc = ancFields.includes(var_x);
  const colHasAnc = col.some((c) => ancFields.includes(c));

  if (varIsAnc || colHasAnc) {
    filteredData = data.filter((d) => {
      let keep = true;

      // If var_x is an ancestry field, ensure it's not null
      if (varIsAnc && d[var_x as keyof DataPoint] === null) {
        keep = false;
      }

      // If any column in col is an ancestry field, ensure none are null
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
  d3.select(svgElement).selectAll("*").remove();

  // (2) Set up margins, container width/height
  d3.select(svgElement).selectAll("*").remove();
  const container = svgElement.parentElement;
  const margin = { top: 0, right: 20, bottom: 60, left: 50 };
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

  const svg = d3
    .select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(0,0)`);

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
          var_x as keyof typeof variables.mappingToLong
          ];

        if (x_axis === "Define Range") {
          xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
        } else if (x_axis === "Shared Axis") {
          const minVal = d3.min(
            data,
            (d) => d[var_x as keyof DataPoint] as number
          )!;
          const maxVal = d3.max(
            data,
            (d) => d[var_x as keyof DataPoint] as number
          )!;
          const buffer = (maxVal - minVal) * 0.05;

          xScale
            .domain([minVal - buffer, maxVal + buffer])
            .range([0, plotWidth]);
        } else if (x_axis === "Free Axis") {
          xScale
            .domain([
              d3.min(
                facetData,
                (d) => d[var_x as keyof DataPoint] as number
              )!,
              d3.max(
                facetData,
                (d) => d[var_x as keyof DataPoint] as number
              )!,
            ])
            .range([0, plotWidth]);
        }

        drawIDDensity(
          facetGroup,
          facetData,
          xScale,
          yScale,
          y_axis,
          min_y_axis,
          max_y_axis,
          plotHeight,
          plotWidth,
          var_x,
          getColor,
          globalColorOrder,
          showMeanMedian,
          title,
          x_label,
          bandwidth_divisor
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
        variables.mappingToLong[var_x as keyof typeof variables.mappingToLong];
      if (x_axis === "Define Range") {
        xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
      } else if (x_axis === "Shared Axis") {
        const minVal = d3.min(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const maxVal = d3.max(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const buffer = (maxVal - minVal) * 0.05;

        xScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([0, plotWidth]);
      } else if (x_axis === "Free Axis") {
        xScale
          .domain([
            d3.min(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
            d3.max(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      }
      // Since var_x is continuous, we draw a histogram
      drawIDDensity(
        facetGroup,
        facetData,
        xScale,
        yScale,
        y_axis,
        min_y_axis,
        max_y_axis,
        plotHeight,
        plotWidth,
        var_x,
        getColor,
        globalColorOrder,
        showMeanMedian,
        title,
        x_label,
        bandwidth_divisor
      );
    });
  }
  else if (facetingRequiredY) {
    // Apply faceting on fac_y only
    uniqueFacY.forEach((facYValue, j) => {
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
        variables.mappingToLong[var_x as keyof typeof variables.mappingToLong];
      if (x_axis === "Define Range") {
        xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
      } else if (x_axis === "Shared Axis") {
        const minVal = d3.min(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const maxVal = d3.max(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const buffer = (maxVal - minVal) * 0.05;

        xScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([0, plotWidth]);
      } else if (x_axis === "Free Axis") {
        xScale
          .domain([
            d3.min(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
            d3.max(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      }
      // Since var_x is continuous, we draw a histogram
      drawIDDensity(
        facetGroup,
        facetData,
        xScale,
        yScale,
        y_axis,
        min_y_axis,
        max_y_axis,
        plotHeight,
        plotWidth,
        var_x,
        getColor,
        globalColorOrder,
        showMeanMedian,
        title,
        x_label,
        bandwidth_divisor
      );
    });
  }
  else {
    const i = 0;
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
    const title = ``;
    const x_label =
      variables.mappingToLong[var_x as keyof typeof variables.mappingToLong];

    if (x_axis === "Define Range") {
      xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
    } else if (x_axis === "Shared Axis") {
      const minVal = d3.min(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const maxVal = d3.max(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const buffer = (maxVal - minVal) * 0.05;

      xScale.domain([minVal - buffer, maxVal + buffer]).range([0, plotWidth]);
    } else if (x_axis === "Free Axis") {
      xScale
        .domain([
          d3.min(data, (d) => d[var_x as keyof DataPoint] as number)!,
          d3.max(data, (d) => d[var_x as keyof DataPoint] as number)!,
        ])
        .range([0, plotWidth]);
    }
    // Since var_x is continuous, we draw a histogram
    drawIDDensity(
      facetGroup,
      data,
      xScale,
      yScale,
      y_axis,
      min_y_axis,
      max_y_axis,
      plotHeight,
      plotWidth,
      var_x,
      getColor,
      globalColorOrder,
      showMeanMedian,
      title,
      x_label,
      bandwidth_divisor
    );
  }
};



const IDDensityComponent: React.FC<IDDensityPlotProps> = ({
  data,
  var_1_mapped,
  col,
  isSidebarVisible,
  mea_med_1,
  x_axis,
  min_x_axis,
  max_x_axis,
  y_axis,
  min_y_axis,
  max_y_axis,
  bandwidth_divisor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      fullDensity(
        svgRef.current,
        data,
        col,
        var_1_mapped,
        mea_med_1,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis,
        bandwidth_divisor
      );

    }
  }, [
    data,
    mea_med_1,
    x_axis,
    min_x_axis,
    max_x_axis,
    y_axis,
    min_y_axis,
    max_y_axis,
    var_1_mapped,
    col,
    bandwidth_divisor
  ]);

  const handleResize = useCallback(() => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      fullDensity(
        svgRef.current,
        data,
        col,
        var_1_mapped,
        mea_med_1,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis,
        bandwidth_divisor
      );
    }
  }, [
    data,
    mea_med_1,
    x_axis,
    min_x_axis,
    max_x_axis,
    y_axis,
    min_y_axis,
    max_y_axis,
    var_1_mapped,
    col,
    bandwidth_divisor
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
  }, [isSidebarVisible, handleResize]);
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
export default IDDensityComponent;
