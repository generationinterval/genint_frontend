import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { variables } from "@/assets/FilterOptions";
import { c } from "vite/dist/node/types.d-aGj9QkWt";

export interface DataPoint {
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
}

type HistogramPlotProps = {
  data: any[];
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
  }, [data, col, var_1_mapped, n_bins]); // Re-render the histogram when any prop changes

  const handleResize = () => {
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
  };

  useEffect(() => {
    // Attach resize event listener
    window.addEventListener("resize", handleResize);
    // Run resize handler once to set initial sizes
    handleResize();
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data]); // Depend on plotData to ensure resizing occurs after data is loaded

  useEffect(() => {
    // Handle resize when the sidebar visibility changes
    handleResize();
  }, [isSidebarVisible]);
  return (
    <div
      id="histogram-container"
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
  col: string[] | null, // Color can be null or a list
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
  // Clear any existing content in the SVG
  d3.select(svgElement).selectAll("*").remove();

  const container = svgElement.parentElement;
  const margin = { top: 30, right: 40, bottom: 40, left: 50 };
  const width = container
    ? container.clientWidth - margin.left - margin.right
    : 960;
  const height = container
    ? container.clientHeight - margin.top - margin.bottom
    : 600;

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
      ? width - margin.right - margin.left
      : width / numCols - colPadding;
  const plotHeight =
    numRows === 1
      ? height - margin.bottom - margin.top
      : height / numRows - rowPadding;

  const svg = d3
    .select(svgElement)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  let getColor: (d: DataPoint) => string;
  let legendData: { label: string; color: string }[] = [];

  if (col === null) {
    // If no color column is provided, use a single default color
    const defaultColor = "steelblue"; // You can change this to any color you prefer
    getColor = () => defaultColor;
    legendData = [{ label: "Default Color", color: defaultColor }];
  } else if (col.length > 1) {
    const allDiscrete = col.every((c) =>
      variables.discreteOptionsShort.includes(c)
    );
    if (allDiscrete) {
      const uniqueColors = [...new Set(data.map((d) => d.color))];
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(uniqueColors);

      getColor = (d: DataPoint) => colorScale(d.color);
      legendData = uniqueColors.map((color) => ({
        label: color,
        color: colorScale(color),
      }));
    } else {
      throw new Error(
        "Color cannot be continuous and discrete or multiple continuous."
      );
    }
  } else if (col.length === 1) {
    const mappedCol =
      variables.mapping[col[0] as keyof typeof variables.mapping];

    if (variables.discreteOptionsShort.includes(col[0])) {
      const uniqueColors = [...new Set(data.map((d) => d.color))];
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(uniqueColors);

      getColor = (d: DataPoint) => colorScale(d.color);
      legendData = uniqueColors.map((color) => ({
        label: color,
        color: colorScale(color),
      }));
    } else if (variables.continuousOptions.includes(col[0]!)) {
      // Safely assert that mappedCol is not null or undefined
      const colDomain = d3.extent(
        data,
        (d) => +d[mappedCol as keyof DataPoint]!
      );
      const colorScale = d3
        .scaleSequential(d3.interpolateViridis)
        .domain(colDomain as [number, number]);

      getColor = (d: DataPoint) =>
        colorScale(+d[mappedCol as keyof DataPoint]!);
      legendData = [
        { label: String(colDomain![0]), color: colorScale(colDomain![0]!) },
        { label: String(colDomain![1]), color: colorScale(colDomain![1]!) },
      ];
    } else {
      throw new Error("Invalid color mapping provided.");
    }
  } else {
    throw new Error(
      "Color cannot be continuous and discrete or multiple continuous."
    );
  }
  const xScale = d3.scaleLinear().range([0, plotWidth]);

  const yScale = d3.scaleLinear().range([plotHeight, 0]);

  // Calculate the width of each legend entry (rectangle + text space)
  const itemWidth = 100; // Adjust based on the size of your legend items

  // Append the legend and place it at the bottom center of the SVG
  const legend = svg.append("g").attr(
    "transform",
    `translate(${(width - legendData.length * itemWidth) / 2}, ${height - 20})` // Center horizontally and place at the bottom
  );

  // Add the legend items (rectangles)
  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * itemWidth) // Horizontal positioning
    .attr("y", 0) // Align all items vertically
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d) => d.color);

  // Add the legend labels (text)
  legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * itemWidth + 24) // Position text next to the rectangle
    .attr("y", 9) // Center the text vertically with the rectangle
    .attr("dy", ".35em")
    .text((d) => d.label);

  if (facetingRequiredX && facetingRequiredY) {
    // Apply faceting on both fac_x and fac_y
    uniqueFacX.forEach((facXValue, i) => {
      uniqueFacY.forEach((facYValue, j) => {
        const facetData = data.filter(
          (d) => d.fac_x === facXValue && d.fac_y === facYValue
        );
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
        console.log(x_axis);
        console.log(xScale.domain());
        const histogram = d3
          .bin<DataPoint, number>()
          .value((d) => d[var_x as keyof DataPoint] as number)!
          .domain(xScale.domain() as [number, number])
          .thresholds(n_bins);
        const bins = histogram(facetData);
        // Update y-scale domain based on bins
        if (y_axis === "Define Range") {
          yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
        } else if (y_axis === "Shared Axis") {
          throw new Error("Shared Axis is not supported for y-axis.");
        } else if (y_axis === "Free Axis") {
          yScale
            .domain([0, d3.max(bins, (d) => d.length)!])
            .range([plotHeight, 0]);
        }

        // Append a group for each facet
        const facetGroup = svg
          .append("g")
          .attr(
            "transform",
            `translate(${i * plotWidth + i * colPadding},${
              j * plotHeight + j * rowPadding
            })`
          );

        bins.forEach((bin) => {
          const colorGroups = d3.group(bin, (d: DataPoint) => d.color);
          const totalPoints = bin.length;
          let accumulatedHeight = 0;

          // Check if the color is categorical or continuous and sort accordingly
          let sortedColorGroups: [string, DataPoint[]][] = [];
          if (col === null) {
            // If no color column is provided, use a single default color
            const defaultColor = "steelblue"; // You can change this to any color you prefer
            getColor = () => defaultColor;
            legendData = [{ label: "Default Color", color: defaultColor }];
          } else if (variables.discreteOptionsShort.includes(col[0])) {
            // Sort by the order of categorical colors in the color scale domain
            const uniqueColors = [...new Set(data.map((d) => d.color))];
            sortedColorGroups = Array.from(colorGroups).sort(
              ([colorA], [colorB]) =>
                uniqueColors.indexOf(colorA) - uniqueColors.indexOf(colorB)
            );
          } else if (variables.continuousOptions.includes(col[0])) {
            // Sort by the continuous values (increasing order)
            sortedColorGroups = Array.from(colorGroups).sort(
              ([colorA], [colorB]) => +colorA - +colorB // Assuming color is a numerical continuous value
            );
          }

          // Iterate over the sorted color groups
          sortedColorGroups.forEach(([color, groupData]) => {
            const proportion = groupData.length / totalPoints;
            const binHeight = proportion * (plotHeight - yScale(bin.length));

            facetGroup
              .append("rect")
              .attr("x", 1)
              .attr(
                "transform",
                `translate(${xScale(bin.x0!)}, ${
                  yScale(bin.length) + accumulatedHeight
                })`
              )
              .attr("width", xScale(bin.x1!) - xScale(bin.x0!) - 1)
              .attr("height", binHeight)
              .attr("fill", getColor(groupData[0]));

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
          .attr("y", plotHeight + 30) // Adjust this to move the label below the axis
          .attr("text-anchor", "middle")
          .text(var_x);

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
          .text(`${facXValue} / ${facYValue}`);
      });
    });
  } else if (facetingRequiredX) {
    // Apply faceting on fac_x only
    uniqueFacX.forEach((facXValue, i) => {
      const facetData = data.filter((d) => d.fac_x === facXValue);

      if (x_axis === "Define Range") {
        xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
      } else if (x_axis === "Shared Axis") {
        xScale
          .domain([
            0,
            d3.max(data, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      } else if (x_axis === "Free Axis") {
        xScale
          .domain([
            d3.min(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
            d3.max(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      }
      console.log(x_axis);
      console.log(xScale.domain());
      const histogram = d3
        .bin<DataPoint, number>()
        .value((d) => d[var_x as keyof DataPoint] as number)!
        .domain(xScale.domain() as [number, number])
        .thresholds(n_bins);
      const bins = histogram(facetData);
      // Update y-scale domain based on bins
      if (y_axis === "Define Range") {
        yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
      } else if (y_axis === "Shared Axis") {
        throw new Error("Shared Axis is not supported for y-axis.");
      } else if (y_axis === "Free Axis") {
        yScale
          .domain([0, d3.max(bins, (d) => d.length)!])
          .range([plotHeight, 0]);
      }

      // Append a group for each facet
      const facetGroup = svg.append("g").attr(
        "transform",
        `translate(${i * plotWidth + i * colPadding},0)
          `
      );

      bins.forEach((bin) => {
        const colorGroups = d3.group(bin, (d: DataPoint) => d.color);
        const totalPoints = bin.length;
        let accumulatedHeight = 0;

        // Check if the color is categorical or continuous and sort accordingly
        let sortedColorGroups: [string, DataPoint[]][] = [];
        if (col === null) {
          // If no color column is provided, use a single default color
          const defaultColor = "steelblue"; // You can change this to any color you prefer
          getColor = () => defaultColor;
          legendData = [{ label: "Default Color", color: defaultColor }];
        } else if (variables.discreteOptionsShort.includes(col[0])) {
          // Sort by the order of categorical colors in the color scale domain
          const uniqueColors = [...new Set(data.map((d) => d.color))];
          sortedColorGroups = Array.from(colorGroups).sort(
            ([colorA], [colorB]) =>
              uniqueColors.indexOf(colorA) - uniqueColors.indexOf(colorB)
          );
        } else if (variables.continuousOptions.includes(col[0])) {
          // Sort by the continuous values (increasing order)
          sortedColorGroups = Array.from(colorGroups).sort(
            ([colorA], [colorB]) => +colorA - +colorB // Assuming color is a numerical continuous value
          );
        }

        // Iterate over the sorted color groups
        sortedColorGroups.forEach(([color, groupData]) => {
          const proportion = groupData.length / totalPoints;
          const binHeight = proportion * (plotHeight - yScale(bin.length));

          facetGroup
            .append("rect")
            .attr("x", 1)
            .attr(
              "transform",
              `translate(${xScale(bin.x0!)}, ${
                yScale(bin.length) + accumulatedHeight
              })`
            )
            .attr("width", xScale(bin.x1!) - xScale(bin.x0!) - 1)
            .attr("height", binHeight)
            .attr("fill", getColor(groupData[0]));

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
        .attr("y", plotHeight + 30) // Adjust this to move the label below the axis
        .attr("text-anchor", "middle")
        .text(var_x);

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
        .text(`${facXValue}`);
    });
  } else if (facetingRequiredY) {
    // Apply faceting on fac_y only
    uniqueFacY.forEach((facYValue, j) => {
      const facetData = data.filter((d) => d.fac_y === facYValue);

      if (x_axis === "Define Range") {
        xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
      } else if (x_axis === "Shared Axis") {
        xScale
          .domain([
            0,
            d3.max(data, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      } else if (x_axis === "Free Axis") {
        xScale
          .domain([
            d3.min(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
            d3.max(facetData, (d) => d[var_x as keyof DataPoint] as number)!,
          ])
          .range([0, plotWidth]);
      }
      console.log(x_axis);
      console.log(xScale.domain());
      const histogram = d3
        .bin<DataPoint, number>()
        .value((d) => d[var_x as keyof DataPoint] as number)!
        .domain(xScale.domain() as [number, number])
        .thresholds(n_bins);
      const bins = histogram(facetData);
      // Update y-scale domain based on bins
      if (y_axis === "Define Range") {
        yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
      } else if (y_axis === "Shared Axis") {
        throw new Error("Shared Axis is not supported for y-axis.");
      } else if (y_axis === "Free Axis") {
        yScale
          .domain([0, d3.max(bins, (d) => d.length)!])
          .range([plotHeight, 0]);
      }

      // Append a group for each facet
      const facetGroup = svg.append("g").attr(
        "transform",
        `translate(0, ${j * plotHeight + j * rowPadding})
          `
      );

      bins.forEach((bin) => {
        const colorGroups = d3.group(bin, (d: DataPoint) => d.color);
        const totalPoints = bin.length;
        let accumulatedHeight = 0;

        // Check if the color is categorical or continuous and sort accordingly
        let sortedColorGroups: [string, DataPoint[]][] = [];
        if (col === null) {
          // If no color column is provided, use a single default color
          const defaultColor = "steelblue"; // You can change this to any color you prefer
          getColor = () => defaultColor;
          legendData = [{ label: "Default Color", color: defaultColor }];
        } else if (variables.discreteOptionsShort.includes(col[0])) {
          // Sort by the order of categorical colors in the color scale domain
          const uniqueColors = [...new Set(data.map((d) => d.color))];
          sortedColorGroups = Array.from(colorGroups).sort(
            ([colorA], [colorB]) =>
              uniqueColors.indexOf(colorA) - uniqueColors.indexOf(colorB)
          );
        } else if (variables.continuousOptions.includes(col[0])) {
          // Sort by the continuous values (increasing order)
          sortedColorGroups = Array.from(colorGroups).sort(
            ([colorA], [colorB]) => +colorA - +colorB // Assuming color is a numerical continuous value
          );
        }

        // Iterate over the sorted color groups
        sortedColorGroups.forEach(([color, groupData]) => {
          const proportion = groupData.length / totalPoints;
          const binHeight = proportion * (plotHeight - yScale(bin.length));

          facetGroup
            .append("rect")
            .attr("x", 1)
            .attr(
              "transform",
              `translate(${xScale(bin.x0!)}, ${
                yScale(bin.length) + accumulatedHeight
              })`
            )
            .attr("width", xScale(bin.x1!) - xScale(bin.x0!) - 1)
            .attr("height", binHeight)
            .attr("fill", getColor(groupData[0]));

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
        .attr("y", plotHeight + 30)
        .attr("text-anchor", "middle")
        .text(var_x);

      // Add Y Axis to the facet
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
        .text(`${facYValue}`);
    });
  } else {
    if (x_axis === "Define Range") {
      xScale.domain([min_x_axis, max_x_axis]).range([0, plotWidth]);
    } else if (x_axis === "Shared Axis") {
      xScale
        .domain([
          0,
          d3.max(data, (d) => d[var_x as keyof DataPoint] as number)!,
        ])
        .range([0, plotWidth]);
    } else if (x_axis === "Free Axis") {
      xScale
        .domain([
          d3.min(data, (d) => d[var_x as keyof DataPoint] as number)!,
          d3.max(data, (d) => d[var_x as keyof DataPoint] as number)!,
        ])
        .range([0, plotWidth]);
    }
    console.log(x_axis);
    console.log(xScale.domain());
    const histogram = d3
      .bin<DataPoint, number>()
      .value((d) => d[var_x as keyof DataPoint] as number)!
      .domain(xScale.domain() as [number, number])
      .thresholds(n_bins);
    const bins = histogram(data);
    // Update y-scale domain based on bins
    if (y_axis === "Define Range") {
      yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
    } else if (y_axis === "Shared Axis") {
      throw new Error("Shared Axis is not supported for y-axis.");
    } else if (y_axis === "Free Axis") {
      yScale.domain([0, d3.max(bins, (d) => d.length)!]).range([plotHeight, 0]);
    }

    // Append a group for each facet
    const facetGroup = svg.append("g").attr(
      "transform",
      `translate(0, 0)
        `
    );

    bins.forEach((bin) => {
      const colorGroups = d3.group(bin, (d: DataPoint) => d.color);
      const totalPoints = bin.length;
      let accumulatedHeight = 0;

      // Check if the color is categorical or continuous and sort accordingly
      let sortedColorGroups: [string, DataPoint[]][] = [];
      if (col === null) {
        // If no color column is provided, use a single default color
        const defaultColor = "steelblue"; // You can change this to any color you prefer
        getColor = () => defaultColor;
        legendData = [{ label: "Default Color", color: defaultColor }];
      } else if (variables.discreteOptionsShort.includes(col[0])) {
        // Sort by the order of categorical colors in the color scale domain
        const uniqueColors = [...new Set(data.map((d) => d.color))];
        sortedColorGroups = Array.from(colorGroups).sort(
          ([colorA], [colorB]) =>
            uniqueColors.indexOf(colorA) - uniqueColors.indexOf(colorB)
        );
      } else if (variables.continuousOptions.includes(col[0])) {
        // Sort by the continuous values (increasing order)
        sortedColorGroups = Array.from(colorGroups).sort(
          ([colorA], [colorB]) => +colorA - +colorB // Assuming color is a numerical continuous value
        );
      }

      // Iterate over the sorted color groups
      sortedColorGroups.forEach(([color, groupData]) => {
        const proportion = groupData.length / totalPoints;
        const binHeight = proportion * (plotHeight - yScale(bin.length));

        facetGroup
          .append("rect")
          .attr("x", 1)
          .attr(
            "transform",
            `translate(${xScale(bin.x0!)}, ${
              yScale(bin.length) + accumulatedHeight
            })`
          )
          .attr("width", xScale(bin.x1!) - xScale(bin.x0!) - 1)
          .attr("height", binHeight)
          .attr("fill", getColor(groupData[0]));

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
      .attr("y", plotHeight + 30) // Adjust this to move the label below the axis
      .attr("text-anchor", "middle")
      .text(var_x);

    facetGroup.append("g").call(d3.axisLeft(yScale));

    facetGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .text("Counts");
  }
};
