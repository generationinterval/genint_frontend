import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { variables } from "@/assets/FilterOptions";

export interface DataPoint {
  [key: string]: any;
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

type ViolinPlotProps = {
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

const ViolinComponent: React.FC<ViolinPlotProps> = ({
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
      fullViolin(
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
      fullViolin(
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
export default ViolinComponent;

const fullViolin = (
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
  const margin = { top: 30, right: 30, bottom: 40, left: 65 };
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

  const colPadding = 70;
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

  let getColor: (d: DataPoint | string) => string;
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

      getColor = (d: DataPoint | string) => {
        if (typeof d === "string") {
          // d is a string (sumstat key), use it directly with the color scale
          return colorScale(d);
        } else {
          // d is a DataPoint, so access d.color
          return colorScale(d.color);
        }
      };
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

      getColor = (d: DataPoint | string) => {
        if (typeof d === "string") {
          // d is a string (sumstat key), use it directly with the color scale
          return colorScale(d);
        } else {
          // d is a DataPoint, so access d.color
          return colorScale(d.color);
        }
      };
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

      getColor = (d: DataPoint | string) => {
        if (typeof d === "string") {
          // d is a string (sumstat key), use it directly with the color scale
          return colorScale(Number(d));
        } else {
          // d is a DataPoint, so access d.color
          return colorScale(+d[mappedCol as keyof DataPoint]!);
        }
      };
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
  // 2 functions needed for kernel density estimate
  function kernelDensityEstimator(
    kernel: { (v: any): number; (arg0: number): number | null | undefined },
    X: any[]
  ) {
    return function (V: Iterable<unknown>) {
      return X.map(function (x) {
        return [
          x,
          d3.mean(V, function (v) {
            return kernel(x - (v as number));
          }),
        ];
      });
    };
  }
  function kernelEpanechnikov(k: number) {
    return function (v: number) {
      return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
    };
  }

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

        var colorMeans = Array.from(
          d3.group(facetData, (d) => d.color),
          ([key, values]) => ({
            color: key,
            mean: d3.mean(values, (d) => d[var_x]),
          })
        );

        // Step 2: Sort the colors by their average var_x value
        colorMeans.sort((a, b) => d3.ascending(a.mean, b.mean));

        // Step 3: Extract the sorted colors
        var sortedColors = colorMeans.map((d) => d.color);

        // Step 4: Update xScale to use the sorted colors
        var xScale = d3
          .scaleBand()
          .range([0, plotWidth])
          .domain(sortedColors) // Use sorted colors as the domain
          .padding(0.05);

        // Update y-scale domain based on bins
        if (y_axis === "Define Range") {
          yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
        } else if (y_axis === "Shared Axis") {
          const minVal = d3.min(data, (d) => d[var_x]);
          const maxVal = d3.max(data, (d) => d[var_x]);
          const buffer = (maxVal - minVal) * 0.05;
          yScale
            .domain([minVal - buffer, maxVal + buffer])
            .range([plotHeight, 0]);
        } else if (y_axis === "Free Axis") {
          const minVal = d3.min(facetData, (d) => d[var_x]);
          const maxVal = d3.max(facetData, (d) => d[var_x]);
          const buffer = (maxVal - minVal) * 0.05;
          yScale
            .domain([minVal - buffer, maxVal + buffer])
            .range([plotHeight, 0]);
        }
        var kde = kernelDensityEstimator(
          kernelEpanechnikov(100),
          yScale.ticks(30)
        );

        var sumstat = Array.from(
          d3.group(facetData, (d) => d.color),
          ([key, value]) => ({
            key,
            value: kde(value.map((g) => g[var_x])),
          })
        );

        var maxNum = 0;
        for (const i in sumstat) {
          const allBins = sumstat[i].value;
          const kdeValues = allBins.map(function (a) {
            return a[1];
          });
          const biggest = d3.max(kdeValues);
          if (biggest > maxNum) {
            maxNum = biggest;
          }
        }

        // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
        var xNum = d3
          .scaleLinear()
          .range([0, xScale.bandwidth()])
          .domain([-maxNum, maxNum]);

        // Append a group for each facet
        const facetGroup = svg
          .append("g")
          .attr(
            "transform",
            `translate(${i * plotWidth + i * colPadding},${
              j * plotHeight + j * rowPadding
            })`
          );
        // Jittered scatter plot function
        const jitter = 0.5; // Adjust this value for more/less jitter

        facetGroup
          .selectAll("myCircles")
          .data(facetData)
          .enter()
          .append("circle")
          .attr("cx", (d) => {
            const xValue = xScale(d.color);
            return (
              (xValue !== undefined ? xValue : 0) +
              xScale.bandwidth() / 2 +
              (Math.random() - 0.5) * jitter * xScale.bandwidth()
            );
          })
          .attr("cy", (d) => yScale(d[var_x]))
          .attr("r", 1.2) // Radius of the circle
          .style("fill", (d) => getColor(d.color)) // Use the same color as the violin
          .style("opacity", 0.7);

        facetGroup
          .selectAll("myViolin")
          .data(sumstat)
          .enter() // So now we are working group per group
          .append("g")
          .attr("transform", function (d) {
            return "translate(" + xScale(d.key) + " ,0)";
          }) // Translation on the right to be at the group position
          .each(function (d) {
            // Store the key value for the current group
            const key = d.key;

            // Now append the path using the stored key for color
            d3.select(this)
              .append("path")
              .datum(d.value as [number, number][]) // Use the density values here
              .style(
                "fill",
                () =>
                  d3.color(getColor(key))?.copy({ opacity: 0.5 })?.toString() ||
                  ""
              ) // Set fill color with alpha as a string
              .style("stroke", () => d3.color(getColor(key))?.toString() || "") // Set stroke to the same color as fill as a string
              .style("stroke-width", 0.1) // Adjust stroke width as needed
              .attr(
                "d",
                d3
                  .area()
                  .x0(function (d) {
                    return xNum(-d[1]);
                  })
                  .x1(function (d) {
                    return xNum(d[1]);
                  })
                  .y(function (d) {
                    return yScale(d[0]);
                  })
                  .curve(d3.curveCatmullRom)
              );
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
          .text((col ?? []).join(", "));

        // Add Y Axis to the facet
        facetGroup.append("g").call(d3.axisLeft(yScale));
        facetGroup
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -plotHeight / 2) // Center the Y axis title along the axis
          .attr("y", -50) // Adjust this to position the label to the left of the axis
          .attr("text-anchor", "middle")
          .text(var_x);

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

      var colorMeans = Array.from(
        d3.group(facetData, (d) => d.color),
        ([key, values]) => ({
          color: key,
          mean: d3.mean(values, (d) => d[var_x]),
        })
      );

      // Step 2: Sort the colors by their average var_x value
      colorMeans.sort((a, b) => d3.ascending(a.mean, b.mean));

      // Step 3: Extract the sorted colors
      var sortedColors = colorMeans.map((d) => d.color);

      // Step 4: Update xScale to use the sorted colors
      var xScale = d3
        .scaleBand()
        .range([0, plotWidth])
        .domain(sortedColors) // Use sorted colors as the domain
        .padding(0.05);

      // Update y-scale domain based on bins
      if (y_axis === "Define Range") {
        yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
      } else if (y_axis === "Shared Axis") {
        const minVal = d3.min(data, (d) => d[var_x]);
        const maxVal = d3.max(data, (d) => d[var_x]);
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      } else if (y_axis === "Free Axis") {
        const minVal = d3.min(facetData, (d) => d[var_x]);
        const maxVal = d3.max(facetData, (d) => d[var_x]);
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      }
      var kde = kernelDensityEstimator(
        kernelEpanechnikov(100),
        yScale.ticks(30)
      );

      var sumstat = Array.from(
        d3.group(facetData, (d) => d.color),
        ([key, value]) => ({
          key,
          value: kde(value.map((g) => g[var_x])),
        })
      );

      var maxNum = 0;
      for (const i in sumstat) {
        const allBins = sumstat[i].value;
        const kdeValues = allBins.map(function (a) {
          return a[1];
        });
        const biggest = d3.max(kdeValues);
        if (biggest > maxNum) {
          maxNum = biggest;
        }
      }

      // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
      var xNum = d3
        .scaleLinear()
        .range([0, xScale.bandwidth()])
        .domain([-maxNum, maxNum]);

      // Append a group for each facet
      const facetGroup = svg
        .append("g")
        .attr("transform", `translate(${i * plotWidth + i * colPadding},0)`);
      // Jittered scatter plot function
      const jitter = 0.5; // Adjust this value for more/less jitter

      facetGroup
        .selectAll("myCircles")
        .data(facetData)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
          const xValue = xScale(d.color);
          return (
            (xValue !== undefined ? xValue : 0) +
            xScale.bandwidth() / 2 +
            (Math.random() - 0.5) * jitter * xScale.bandwidth()
          );
        })
        .attr("cy", (d) => yScale(d[var_x]))
        .attr("r", 1.2) // Radius of the circle
        .style("fill", (d) => getColor(d.color)) // Use the same color as the violin
        .style("opacity", 0.7);

      facetGroup
        .selectAll("myViolin")
        .data(sumstat)
        .enter() // So now we are working group per group
        .append("g")
        .attr("transform", function (d) {
          return "translate(" + xScale(d.key) + " ,0)";
        }) // Translation on the right to be at the group position
        .each(function (d) {
          // Store the key value for the current group
          const key = d.key;

          // Now append the path using the stored key for color
          d3.select(this)
            .append("path")
            .datum(d.value as [number, number][]) // Use the density values here
            .style(
              "fill",
              () =>
                d3.color(getColor(key))?.copy({ opacity: 0.5 })?.toString() ||
                ""
            ) // Set fill color with alpha as a string
            .style("stroke", () => d3.color(getColor(key))?.toString() || "") // Set stroke to the same color as fill as a string
            .style("stroke-width", 0.1) // Adjust stroke width as needed
            .attr(
              "d",
              d3
                .area()
                .x0(function (d) {
                  return xNum(-d[1]);
                })
                .x1(function (d) {
                  return xNum(d[1]);
                })
                .y(function (d) {
                  return yScale(d[0]);
                })
                .curve(d3.curveCatmullRom)
            );
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
        .text((col ?? []).join(", "));

      // Add Y Axis to the facet
      facetGroup.append("g").call(d3.axisLeft(yScale));
      facetGroup
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2) // Center the Y axis title along the axis
        .attr("y", -50) // Adjust this to position the label to the left of the axis
        .attr("text-anchor", "middle")
        .text(var_x);

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

      var colorMeans = Array.from(
        d3.group(facetData, (d) => d.color),
        ([key, values]) => ({
          color: key,
          mean: d3.mean(values, (d) => d[var_x]),
        })
      );

      // Step 2: Sort the colors by their average var_x value
      colorMeans.sort((a, b) => d3.ascending(a.mean, b.mean));

      // Step 3: Extract the sorted colors
      var sortedColors = colorMeans.map((d) => d.color);

      // Step 4: Update xScale to use the sorted colors
      var xScale = d3
        .scaleBand()
        .range([0, plotWidth])
        .domain(sortedColors) // Use sorted colors as the domain
        .padding(0.05);

      // Update y-scale domain based on bins
      if (y_axis === "Define Range") {
        yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
      } else if (y_axis === "Shared Axis") {
        const minVal = d3.min(data, (d) => d[var_x]);
        const maxVal = d3.max(data, (d) => d[var_x]);
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      } else if (y_axis === "Free Axis") {
        const minVal = d3.min(facetData, (d) => d[var_x]);
        const maxVal = d3.max(facetData, (d) => d[var_x]);
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      }
      var kde = kernelDensityEstimator(
        kernelEpanechnikov(100),
        yScale.ticks(30)
      );

      var sumstat = Array.from(
        d3.group(facetData, (d) => d.color),
        ([key, value]) => ({
          key,
          value: kde(value.map((g) => g[var_x])),
        })
      );

      var maxNum = 0;
      for (const i in sumstat) {
        const allBins = sumstat[i].value;
        const kdeValues = allBins.map(function (a) {
          return a[1];
        });
        const biggest = d3.max(kdeValues);
        if (biggest > maxNum) {
          maxNum = biggest;
        }
      }

      // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
      var xNum = d3
        .scaleLinear()
        .range([0, xScale.bandwidth()])
        .domain([-maxNum, maxNum]);

      // Append a group for each facet
      const facetGroup = svg
        .append("g")
        .attr("transform", `translate(0,${j * plotHeight + j * rowPadding})`);
      // Jittered scatter plot function
      const jitter = 0.5; // Adjust this value for more/less jitter

      facetGroup
        .selectAll("myCircles")
        .data(facetData)
        .enter()
        .append("circle")
        .attr("cx", (d) => {
          const xValue = xScale(d.color);
          return (
            (xValue !== undefined ? xValue : 0) +
            xScale.bandwidth() / 2 +
            (Math.random() - 0.5) * jitter * xScale.bandwidth()
          );
        })
        .attr("cy", (d) => yScale(d[var_x]))
        .attr("r", 1.2) // Radius of the circle
        .style("fill", (d) => getColor(d.color)) // Use the same color as the violin
        .style("opacity", 0.7);

      facetGroup
        .selectAll("myViolin")
        .data(sumstat)
        .enter() // So now we are working group per group
        .append("g")
        .attr("transform", function (d) {
          return "translate(" + xScale(d.key) + " ,0)";
        }) // Translation on the right to be at the group position
        .each(function (d) {
          // Store the key value for the current group
          const key = d.key;

          // Now append the path using the stored key for color
          d3.select(this)
            .append("path")
            .datum(d.value as [number, number][]) // Use the density values here
            .style(
              "fill",
              () =>
                d3.color(getColor(key))?.copy({ opacity: 0.5 })?.toString() ||
                ""
            ) // Set fill color with alpha as a string
            .style("stroke", () => d3.color(getColor(key))?.toString() || "") // Set stroke to the same color as fill as a string
            .style("stroke-width", 0.1) // Adjust stroke width as needed
            .attr(
              "d",
              d3
                .area()
                .x0(function (d) {
                  return xNum(-d[1]);
                })
                .x1(function (d) {
                  return xNum(d[1]);
                })
                .y(function (d) {
                  return yScale(d[0]);
                })
                .curve(d3.curveCatmullRom)
            );
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
        .text((col ?? []).join(", "));

      // Add Y Axis to the facet
      facetGroup.append("g").call(d3.axisLeft(yScale));
      facetGroup
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2) // Center the Y axis title along the axis
        .attr("y", -50) // Adjust this to position the label to the left of the axis
        .attr("text-anchor", "middle")
        .text(var_x);

      facetGroup
        .append("text")
        .attr("x", plotWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text(`${facYValue}`);
    });
  } else {
    var colorMeans = Array.from(
      d3.group(data, (d) => d.color),
      ([key, values]) => ({
        color: key,
        mean: d3.mean(values, (d) => d[var_x]),
      })
    );

    // Step 2: Sort the colors by their average var_x value
    colorMeans.sort((a, b) => d3.ascending(a.mean, b.mean));

    // Step 3: Extract the sorted colors
    var sortedColors = colorMeans.map((d) => d.color);

    // Step 4: Update xScale to use the sorted colors
    var xScale = d3
      .scaleBand()
      .range([0, plotWidth])
      .domain(sortedColors) // Use sorted colors as the domain
      .padding(0.05);

    // Update y-scale domain based on bins
    if (y_axis === "Define Range") {
      yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
    } else if (y_axis === "Shared Axis") {
      const minVal = d3.min(data, (d) => d[var_x]);
      const maxVal = d3.max(data, (d) => d[var_x]);
      const buffer = (maxVal - minVal) * 0.05;
      yScale.domain([minVal - buffer, maxVal + buffer]).range([plotHeight, 0]);
    } else if (y_axis === "Free Axis") {
      const minVal = d3.min(data, (d) => d[var_x]);
      const maxVal = d3.max(data, (d) => d[var_x]);
      const buffer = (maxVal - minVal) * 0.05;
      yScale.domain([minVal - buffer, maxVal + buffer]).range([plotHeight, 0]);
    }
    var kde = kernelDensityEstimator(kernelEpanechnikov(100), yScale.ticks(30));

    var sumstat = Array.from(
      d3.group(data, (d) => d.color),
      ([key, value]) => ({
        key,
        value: kde(value.map((g) => g[var_x])),
      })
    );

    var maxNum = 0;
    for (const i in sumstat) {
      const allBins = sumstat[i].value;
      const kdeValues = allBins.map(function (a) {
        return a[1];
      });
      const biggest = d3.max(kdeValues);
      if (biggest > maxNum) {
        maxNum = biggest;
      }
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3
      .scaleLinear()
      .range([0, xScale.bandwidth()])
      .domain([-maxNum, maxNum]);

    // Append a group for each facet
    const facetGroup = svg.append("g").attr("transform", `translate0,0)`);
    // Jittered scatter plot function
    const jitter = 0.5; // Adjust this value for more/less jitter

    facetGroup
      .selectAll("myCircles")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => {
        const xValue = xScale(d.color);
        return (
          (xValue !== undefined ? xValue : 0) +
          xScale.bandwidth() / 2 +
          (Math.random() - 0.5) * jitter * xScale.bandwidth()
        );
      })
      .attr("cy", (d) => yScale(d[var_x]))
      .attr("r", 1.2) // Radius of the circle
      .style("fill", (d) => getColor(d.color)) // Use the same color as the violin
      .style("opacity", 0.7);

    facetGroup
      .selectAll("myViolin")
      .data(sumstat)
      .enter() // So now we are working group per group
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + xScale(d.key) + " ,0)";
      }) // Translation on the right to be at the group position
      .each(function (d) {
        // Store the key value for the current group
        const key = d.key;

        // Now append the path using the stored key for color
        d3.select(this)
          .append("path")
          .datum(d.value as [number, number][]) // Use the density values here
          .style(
            "fill",
            () =>
              d3.color(getColor(key))?.copy({ opacity: 0.5 })?.toString() || ""
          ) // Set fill color with alpha as a string
          .style("stroke", () => d3.color(getColor(key))?.toString() || "") // Set stroke to the same color as fill as a string
          .style("stroke-width", 0.1) // Adjust stroke width as needed
          .attr(
            "d",
            d3
              .area()
              .x0(function (d) {
                return xNum(-d[1]);
              })
              .x1(function (d) {
                return xNum(d[1]);
              })
              .y(function (d) {
                return yScale(d[0]);
              })
              .curve(d3.curveCatmullRom)
          );
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
      .text((col ?? []).join(", "));

    // Add Y Axis to the facet
    facetGroup.append("g").call(d3.axisLeft(yScale));
    facetGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2) // Center the Y axis title along the axis
      .attr("y", -50) // Adjust this to position the label to the left of the axis
      .attr("text-anchor", "middle")
      .text(var_x);
  }
};
