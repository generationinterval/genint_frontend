import { anc_cmaps, data_cmaps, reg_cmaps } from "@/assets/colormaps";
import { variables } from "@/assets/sharedOptions";
import { DataPoint } from "@/types/sum_stat_ind_datapoint";
import * as d3 from "d3";
import React, { useCallback, useEffect, useRef } from "react";

type HistogramPlotProps = {
  data: DataPoint[];
  var_1_mapped: string;
  col: string[];
  n_bins: number;
  isSidebarVisible: boolean;
  mea_med_1: boolean;
  x_axis: string;
  min_x_axis: number;
  max_x_axis: number;
  y_axis: string;
  min_y_axis: number;
  max_y_axis: number;
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

const drawHistogram = (
  facetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: DataPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  plotHeight: number,
  plotWidth: number,
  var_x: string,
  n_bins: number,
  getColor: (d: DataPoint) => string,
  discreteOrContinuous: string,
  globalColorOrder: string[], // Pass global color order
  showMeanMedian: boolean,
  title: string,
  x_label: string
) => {
  // Create histogram bins
  const histogram = d3
    .bin<DataPoint, number>()
    .value((d) => d[var_x as keyof DataPoint] as number)!
    .domain(xScale.domain() as [number, number])
    .thresholds(n_bins);

  const bins = histogram(data);
  if (y_axis === "Define Range") {
    yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
  } else if (y_axis === "Shared Axis") {
    throw new Error("Shared Axis is not supported for y-axis.");
  } else if (y_axis === "Free Axis") {
    yScale
      .domain([
        0,
        d3.max(bins, (d) => d.length)! + 0.05 * d3.max(bins, (d) => d.length)!,
      ])
      .range([plotHeight, 0]);
  }

  // Draw the histogram bars
  bins.forEach((bin) => {
    const colorGroups = d3.group(bin, (d: DataPoint) => getColor(d));
    const totalPoints = bin.length;
    let accumulatedHeight = 0;

    let sortedColorGroups: [string, DataPoint[]][] = [];

    if (discreteOrContinuous === "discrete") {
      // Sort by the global color order, not by the current bin
      sortedColorGroups = Array.from(colorGroups).sort(
        ([, groupDataA], [, groupDataB]) => {
          const dataColorA = groupDataA[0].color; // Accessing the color of the first DataPoint
          const dataColorB = groupDataB[0].color;

          const indexA = globalColorOrder.indexOf(dataColorA);
          const indexB = globalColorOrder.indexOf(dataColorB);

          return (
            (indexA === -1 ? Infinity : indexA) -
            (indexB === -1 ? Infinity : indexB)
          );
        }
      );
    } else if (discreteOrContinuous === "continuous") {
      // Sort by the continuous values (increasing order)
      sortedColorGroups = Array.from(colorGroups).sort(
        ([colorA], [colorB]) => +colorA - +colorB // Assuming color is a numerical continuous value
      );
    } else {
      // No color column provided, using a single default color for all groups
      const defaultColor = "steelblue"; // Default color if no specific color column
      getColor = () => defaultColor;

      // Sort by default with a single group
      sortedColorGroups = Array.from(colorGroups);
    }
    // Iterate over color groups within each bin
    sortedColorGroups.forEach(([, groupData]) => {
      const proportion = groupData.length / totalPoints;
      const binHeight = proportion * (yScale(0) - yScale(bin.length));

      facetGroup
        .append("rect")
        .attr("x", 1)
        .attr(
          "transform",
          `translate(${xScale(bin.x0!)}, ${yScale(bin.length) + accumulatedHeight
          })`
        )
        .attr("width", xScale(bin.x1!) - xScale(bin.x0!) - 1)
        .attr("height", binHeight)
        .attr("fill", getColor(groupData[0]))
        .attr("stroke", "none");

      accumulatedHeight += binHeight;
    });
  });
  facetGroup
    .append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale));
  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", plotHeight + 35) // Adjust this to move the label below the axis
    .attr("text-anchor", "middle")
    .text(x_label);

  // Add Y Axis to the facet
  facetGroup.append("g").call(d3.axisLeft(yScale));
  facetGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -plotHeight / 2) // Center the Y axis title along the axis
    .attr("y", -30) // Adjust this to position the label to the left of the axis
    .attr("text-anchor", "middle")
    .text("Counts");

  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text(`${title}`);

  // Draw mean and median lines if showMeanMedian is true
  if (showMeanMedian) {
    // Group data by color
    const colorGroups = d3.group(data, (d) => getColor(d));

    colorGroups.forEach((groupData, color) => {
      const container = d3.select("#plot-container"); // Assuming you have a div with this id
      const tooltip = container.append("div").attr("class", "tooltip");

      const mean = d3.mean(
        groupData,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const median = d3.median(
        groupData,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      facetGroup
        .append("line")
        .attr("x1", xScale(mean))
        .attr("x2", xScale(mean))
        .attr("y1", yScale.range()[0])
        .attr("y2", yScale.range()[1])
        .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4") // Striped pattern for mean
        .on("mouseenter", () => {
          tooltip.transition().duration(200).style("opacity", 1); // Show tooltip
          tooltip.html(
            `<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Mean:</strong> ${mean.toFixed(2)}`
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

      // Draw median line
      facetGroup
        .append("line")
        .attr("x1", xScale(median))
        .attr("x2", xScale(median))
        .attr("y1", yScale.range()[0])
        .attr("y2", yScale.range()[1])
        .attr("stroke", d3.color(color)!.darker(0.7).formatHex())
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "2,4")
        .on("mouseenter", () => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(
            `<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Median:</strong> ${median.toFixed(2)}`
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
    });
  }
};

const drawBarplot = (
  facetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  facetData: DataPoint[],
  xScale: d3.ScaleBand<string>,
  yScale: d3.ScaleLinear<number, number>,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  plotHeight: number,
  plotWidth: number,
  var_x: string,
  getColor: (d: DataPoint) => string,
  discreteOrContinuous: string,
  globalColorOrder: string[],
  title: string,
  x_label: string,
  globalCategoryOrder: string[]
) => {
  // Instead of extracting categories from facetData here, we just rely on the globalCategoryOrder.

  // Set the scale domain using the globalCategoryOrder
  xScale.domain(globalCategoryOrder).range([0, plotWidth]).padding(0.1);

  // Group data by category
  const categoryGroups = d3.group(
    facetData,
    (d) => d[var_x as keyof DataPoint] as string
  );

  // For y-axis domain, find max counts as before
  const categoryCounts = globalCategoryOrder.map((cat) => {
    const values = categoryGroups.get(cat) || [];
    return {
      category: cat,
      values,
      count: values.length,
    };
  });

  if (y_axis === "Define Range") {
    yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
  } else if (y_axis === "Free Axis") {
    const maxCount = d3.max(categoryCounts, (d) => d.count)!;
    yScale.domain([0, maxCount + 0.05 * maxCount]).range([plotHeight, 0]);
  } else {
    // Handle other cases or throw error
  }

  // Draw bars
  categoryCounts.forEach(({ category, values, count }) => {
    const colorGroups = d3.group(values, (d) => getColor(d));
    const totalPoints = values.length;

    let sortedColorGroups: [string, DataPoint[]][] = [];

    if (discreteOrContinuous === "discrete") {
      // Sort by globalColorOrder
      sortedColorGroups = Array.from(colorGroups).sort(
        ([, groupDataA], [, groupDataB]) => {
          const dataColorA = groupDataA[0].color;
          const dataColorB = groupDataB[0].color;

          const indexA = globalColorOrder.indexOf(dataColorA);
          const indexB = globalColorOrder.indexOf(dataColorB);

          return (
            (indexA === -1 ? Infinity : indexA) -
            (indexB === -1 ? Infinity : indexB)
          );
        }
      );
    } else if (discreteOrContinuous === "continuous") {
      // Sort by numeric color value
      sortedColorGroups = Array.from(colorGroups).sort(
        ([colorA], [colorB]) => +colorA - +colorB
      );
    } else {
      // Single default color if no grouping
      const defaultColor = "steelblue";
      getColor = () => defaultColor;
      sortedColorGroups = Array.from(colorGroups);
    }

    let accumulatedHeight = 0;
    const xPos = xScale(category);
    if (xPos === undefined) return;

    // If count == 0 (category not in facetData), no bars are drawn
    // but category order still preserved. If you want to show a zero-height bar:
    // you could draw a bar with height 0 or skip entirely.
    if (count > 0) {
      sortedColorGroups.forEach(([, groupData]) => {
        const proportion = groupData.length / totalPoints;
        const segmentHeight = proportion * (yScale(0) - yScale(totalPoints));

        facetGroup
          .append("rect")
          .attr("x", xPos)
          .attr("y", yScale(totalPoints) + accumulatedHeight)
          .attr("width", xScale.bandwidth())
          .attr("height", segmentHeight)
          .attr("fill", getColor(groupData[0]))
          .attr("stroke", "none");

        accumulatedHeight += segmentHeight;
      });
    }
  });

  // Add axes and titles as before
  facetGroup
    .append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale));

  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", plotHeight + 35)
    .attr("text-anchor", "middle")
    .text(x_label);

  facetGroup.append("g").call(d3.axisLeft(yScale));

  facetGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -plotHeight / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .text("Counts");

  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text(`${title}`);
};

const HistogramComponent: React.FC<HistogramPlotProps> = ({
  data,
  var_1_mapped,
  col,
  n_bins,
  isSidebarVisible,
  mea_med_1,
  x_axis,
  min_x_axis,
  max_x_axis,
  y_axis,
  min_y_axis,
  max_y_axis,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      fullHistogram(
        svgRef.current,
        data,
        col,
        var_1_mapped,
        n_bins,
        mea_med_1,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis
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
    n_bins,
    col,
  ]);

  const handleResize = useCallback(() => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      fullHistogram(
        svgRef.current!,
        data,
        col,
        var_1_mapped,
        n_bins,
        mea_med_1,
        x_axis,
        min_x_axis,
        max_x_axis,
        y_axis,
        min_y_axis,
        max_y_axis
      );
    }
  }, [
    containerRef,
    svgRef,
    data,
    col,
    var_1_mapped,
    n_bins,
    mea_med_1,
    x_axis,
    min_x_axis,
    max_x_axis,
    y_axis,
    min_y_axis,
    max_y_axis,
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
export default HistogramComponent;

const fullHistogram = (
  svgElement: SVGSVGElement,
  data: DataPoint[],
  col: string[],
  var_x: string,
  n_bins: number,
  showMeanMedian: boolean,
  x_axis: string,
  min_x_axis: number,
  max_x_axis: number,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number
) => {
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

  const container = svgElement.parentElement;
  const margin = { top: 0, right: 20, bottom: 60, left: 30 };
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
  console.log(uniqueFacX, uniqueFacY);
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

  if (discreteOrContinuous === "continuous") {
    const legendWidth = 400; // Width of the gradient
    const legendHeight = 20; // Height of the gradient
    const legend = svg.append("g").attr(
      "transform",
      `translate(${margin.left + colPadding / 2}, ${height - rowPadding / 1.5})` // Center horizontally and place at the bottom
    );
    const extent = legendData[0].extent;

    if (extent) {
      // Create a color scale with interpolateViridis
      const colorScale = d3
        .scaleSequential()
        .domain(extent) // Set the domain to the extent values
        .interpolator(d3.interpolateViridis);

      // Define a gradient
      const gradient = legend
        .append("defs")
        .append("linearGradient")
        .attr("id", "color-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      // Add gradient stops
      const numStops = 10; // Increase this number for smoother gradient
      for (let i = 0; i <= numStops; i++) {
        const t = i / numStops; // Calculate the position (0 to 1)
        gradient
          .append("stop")
          .attr("offset", `${t * 100}%`)
          .attr(
            "stop-color",
            colorScale(extent[0] + t * (extent[1] - extent[0]))
          ); // Interpolated color
      }

      // Draw the gradient rectangle
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 20) // Positioning it below the min/max labels
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#color-gradient)");

      // Add min and max labels
      legend
        .append("text")
        .attr("x", 0)
        .attr("y", 15)
        .text(`Min: ${extent[0].toFixed(3)}`)
        .style("font-size", "12px");

      legend
        .append("text")
        .attr("x", legendWidth)
        .attr("y", 15)
        .attr("text-anchor", "end")
        .text(`Max: ${extent[1].toFixed(3)}`)
        .style("font-size", "12px");
    }
  } else {
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
  }

  function getGlobalCategoryOrder(data: DataPoint[], var_x: keyof DataPoint) {
    // Extract all unique categories from the full dataset
    const categories = Array.from(
      new Set(
        data
          .map((d) => d[var_x])
          .filter((value): value is string => value !== null && value !== undefined)
          .map(String)  // Convert all values to strings
      )
    );

    // Sort them alphabetically or in any desired custom order
    categories.sort();

    return categories;
  }
  let globalCategoryOrder: string[] = [];

  if (variables.discreteOptionsShort.includes(var_x)) {
    globalCategoryOrder = getGlobalCategoryOrder(data, var_x as keyof DataPoint);
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
          var_x as keyof typeof variables.mappingToLong
          ];
        if (variables.discreteOptionsShort.includes(var_x)) {
          const xScale = d3
            .scaleBand()
            .domain(globalCategoryOrder)
            .range([0, plotWidth])
            .padding(0.1);

          drawBarplot(
            facetGroup,
            facetData,
            xScale, // Will be set using globalCategoryOrder as domain
            yScale,
            y_axis,
            min_y_axis,
            max_y_axis,
            plotHeight,
            plotWidth,
            var_x,
            getColor,
            discreteOrContinuous,
            globalColorOrder,
            title,
            x_label,
            globalCategoryOrder
          );
        } else if (variables.continuousOptionsShort.includes(var_x)) {
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
          // Since var_x is continuous, we draw a histogram
          drawHistogram(
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
            n_bins,
            getColor,
            discreteOrContinuous,
            globalColorOrder,
            showMeanMedian,
            title,
            x_label
          );
        } else {
          console.warn(
            `Variable ${var_x} not found in discrete or continuous options.`
          );
        }
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
      if (variables.discreteOptionsShort.includes(var_x)) {
        const xScale = d3
          .scaleBand()
          .domain(globalCategoryOrder)
          .range([0, plotWidth])
          .padding(0.1);

        drawBarplot(
          facetGroup,
          facetData,
          xScale, // Will be set using globalCategoryOrder as domain
          yScale,
          y_axis,
          min_y_axis,
          max_y_axis,
          plotHeight,
          plotWidth,
          var_x,
          getColor,
          discreteOrContinuous,
          globalColorOrder,
          title,
          x_label,
          globalCategoryOrder
        );
      } else if (variables.continuousOptionsShort.includes(var_x)) {
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
        drawHistogram(
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
          n_bins,
          getColor,
          discreteOrContinuous,
          globalColorOrder,
          showMeanMedian,
          title,
          x_label
        );
      } else {
        console.warn(
          `Variable ${var_x} not found in discrete or continuous options.`
        );
      }
    });
  } else if (facetingRequiredY) {
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
      if (variables.discreteOptionsShort.includes(var_x)) {
        const xScale = d3
          .scaleBand()
          .domain(globalCategoryOrder)
          .range([0, plotWidth])
          .padding(0.1);

        drawBarplot(
          facetGroup,
          facetData,
          xScale, // Will be set using globalCategoryOrder as domain
          yScale,
          y_axis,
          min_y_axis,
          max_y_axis,
          plotHeight,
          plotWidth,
          var_x,
          getColor,
          discreteOrContinuous,
          globalColorOrder,
          title,
          x_label,
          globalCategoryOrder
        );
      } else if (variables.continuousOptionsShort.includes(var_x)) {
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
        drawHistogram(
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
          n_bins,
          getColor,
          discreteOrContinuous,
          globalColorOrder,
          showMeanMedian,
          title,
          x_label
        );
      } else {
        console.warn(
          `Variable ${var_x} not found in discrete or continuous options.`
        );
      }
    });
  } else {
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
    if (variables.discreteOptionsShort.includes(var_x)) {
      const xScale = d3
        .scaleBand()
        .domain(globalCategoryOrder)
        .range([0, plotWidth])
        .padding(0.1);

      drawBarplot(
        facetGroup,
        data,
        xScale, // Will be set using globalCategoryOrder as domain
        yScale,
        y_axis,
        min_y_axis,
        max_y_axis,
        plotHeight,
        plotWidth,
        var_x,
        getColor,
        discreteOrContinuous,
        globalColorOrder,
        title,
        x_label,
        globalCategoryOrder
      );
    } else if (variables.continuousOptionsShort.includes(var_x)) {
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
      drawHistogram(
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
        n_bins,
        getColor,
        discreteOrContinuous,
        globalColorOrder,
        showMeanMedian,
        title,
        x_label
      );
    } else {
      console.warn(
        `Variable ${var_x} not found in discrete or continuous options.`
      );
    }
  }
};
