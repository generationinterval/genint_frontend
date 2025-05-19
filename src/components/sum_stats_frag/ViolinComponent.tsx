import { anc_cmaps, data_cmaps, reg_cmaps } from "@/assets/colormaps";
import { variables } from "@/assets/sharedOptions";
import { kernelDensityEstimator, kernelEpanechnikov } from "@/components/sum_stats_frag/densityUtils";
import { DataPoint } from "@/types/sum_stat_frag_datapoint";
import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

type ViolinPlotProps = {
  data: any[];
  var_1_mapped: string;
  bandwidth_divisor: number;
  col: string[];
  isSidebarVisible: boolean;
  mea_med_1: boolean;
  y_axis: string;
  min_y_axis: number;
  max_y_axis: number;
};

const createColorScale = (
  data: DataPoint[],
  col: string[],
  var_x: string // Add var_x as an argument
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

  if (col.length === 1 && col[0] === "") {
    const defaultColor = "steelblue";
    getColor = () => defaultColor;
    legendData = [{ label: "Default Color", color: defaultColor }];
    discreteOrContinuous = "default";
    globalColorOrder = [defaultColor]; // Only one color, steelblue
  } else {
    // Step 1: Group data by the 'col' variable
    const groupedData = Array.from(
      d3.group(data, (d) => d.color),
      ([key, values]) => ({
        key,
        values,
        mean: d3.mean(values, (v) => v[var_x as keyof DataPoint] as number)!,
      })
    );

    // Step 2: Sort the groups by the mean value of var_x
    const sortedGroups = groupedData.sort((a, b) =>
      d3.ascending(a.mean, b.mean)
    );

    // Step 3: Set globalColorOrder based on the sorted groups
    globalColorOrder = sortedGroups.map((group) => group.key);

    if (col.length === 1 && ["reg", "dat", "anc"].includes(col[0])) {
      // Determine which colormap object to use
      let chosenMap: Record<string, string> = {};
      if (col[0] === "reg") {
        chosenMap = reg_cmaps;
      } else if (col[0] === "dat") {
        chosenMap = data_cmaps;
      } else if (col[0] === "anc") {
        chosenMap = anc_cmaps;
      }
      getColor = (d) => {
        const val = d.color;
        if (!val) return "steelblue";
        return chosenMap[val] || "steelblue";
      };
      // Step 5: Generate legend data
      legendData = globalColorOrder.map((val) => ({
        label:
          variables.mappingToLong[
          val as keyof typeof variables.mappingToLong
          ] || String(val),             // Or a custom label if you have a mapping
        color: chosenMap[val] || "steelblue",
      }));
      discreteOrContinuous = "discrete";
    }
    else {
      // Step 4: Create a color scale using the sorted color order
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(globalColorOrder);

      getColor = (d) => {
        const value = d.color;
        return value !== null && value !== undefined
          ? colorScale(String(value))
          : "steelblue"; // Fallback color if value is undefined
      };
      // Step 5: Generate legend data
      legendData = globalColorOrder.map((value) => ({
        label:
          variables.mappingToLong[
          value as keyof typeof variables.mappingToLong
          ] || String(value),
        color: colorScale(value),
      }));
      discreteOrContinuous = "discrete";
    }
  }
  return { getColor, legendData, discreteOrContinuous, globalColorOrder };
};



const drawViolin = (
  facetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: DataPoint[],
  xScale: d3.ScaleBand<string>,
  yScale: d3.ScaleLinear<number, number>,
  y_axis: string,
  min_y_axis: number,
  max_y_axis: number,
  bandwidth_divisor: number,
  plotHeight: number,
  plotWidth: number,
  var_x: string,
  col: string[],
  getColor: (d: DataPoint) => string,
  discreteOrContinuous: string,
  globalColorOrder: string[], // Pass global color order
  showMeanMedian: boolean,
  title: string,
  x_label: string,
  y_label: string,
  jitter: number,
  showYAxis: boolean
) => {
  facetGroup
    .append("line")
    .attr("x1", 0)
    .attr("x2", plotWidth)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "black");

  // Draw the right line
  facetGroup
    .append("line")
    .attr("x1", plotWidth)
    .attr("x2", plotWidth)
    .attr("y1", -30)
    .attr("y2", plotHeight)
    .attr("stroke", "black");
  // 1) Compute extent of your variable
  const extent = d3.extent(data, (d) => d[var_x as keyof DataPoint] as number);
  // extent is [number | undefined, number | undefined]

  if (extent[0] == null || extent[1] == null) {
    // Handle the case where extent is undefined (e.g., empty data)
    // Provide a fallback or throw an error
    throw new Error("No valid extent found for data");
  }

  const [minValue, maxValue] = extent;

  // 2) Pick a bandwidth based on data range (simplistic example)
  const bandwidth = (maxValue - minValue) / bandwidth_divisor;

  // 3) Create sample points in that range
  const samplePoints = d3.range(minValue, maxValue, (maxValue - minValue) / 3000);

  // 4) Define your KDE with dynamic bandwidth
  const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), samplePoints);


  const sumstat = Array.from(
    d3.group(data, (d) => d.color),
    ([key, value]) => ({
      key,
      value: kde(value.map((g) => g[var_x as keyof DataPoint] as number)),
    })
  );
  const maxNum = d3.max(sumstat, (d) => d3.max(d.value, (v) => v[1])) || 0;

  const xNum = d3
    .scaleLinear()
    .range([0, xScale.bandwidth()])
    .domain([-maxNum, maxNum]);
  const container = d3.select("#plot-container"); // Assuming you have a div with this id
  const tooltip = container.append("div").attr("class", "tooltip");

  // Draw violin shapes
  facetGroup
    .selectAll("g.violin")
    .data(sumstat)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${xScale(d.key)},0)`)
    .each(function (d) {
      d3.select(this)
        .append("path")
        .datum(d.value as [number, number][])
        .style("fill", () => {
          const foundItem = data.find((item) => item.color === d.key);
          return foundItem ? getColor(foundItem) : "steelblue"; // fallback color
        })
        .style("stroke", () => {
          const foundItem = data.find((item) => item.color === d.key);
          return foundItem ? getColor(foundItem) : "steelblue"; // fallback color
        })
        .style("fill-opacity", 0.5) // Set fill opacity
        .style("stroke-opacity", 0) // Keep stroke opacity full
        .attr(
          "d",
          d3
            .area<[number, number]>()
            .x0((d) => xNum(-d[1]))
            .x1((d) => xNum(d[1]))
            .y((d) => yScale(d[0]))
            .curve(d3.curveCatmullRom)
        );
    });
  facetGroup
    .selectAll("circle")
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
    .attr("cy", (d) => yScale(d[var_x as keyof DataPoint] as number))
    .attr("r", 1.2)
    .style("fill", (d) => getColor(d))
    .style("opacity", 0.7)
    .on("mouseenter", function (event, d) {
      // Use 'function' to have access to d
      tooltip.transition().duration(200).style("opacity", 1); // Show tooltip
      tooltip.html(
        `<strong>Individual:</strong> ${d.ind}<br/>
        <strong>Dataset:</strong> ${d.dat}<br/>
        <strong>Region:</strong> ${d.reg}<br/>
        <strong>Population:</strong> ${d.pop}<br/>
        <strong>Chromosome:</strong> ${d.chrom}<br/>
        <strong>Haplotype:</strong> ${d.hap}<br/>
        <strong>Start:</strong> ${d.start}<br/>
        <strong>End:</strong> ${d.end}<br/>
        <strong>Length:</strong> ${d.length}<br/>
        <strong>Mean Post. Prob.:</strong> ${d.mean_prob}<br/>
        <strong>Ancestry:</strong> ${d.anc}<br/>
        <strong>SNPs:</strong> ${d.snps}<br/>
        <strong>Archaic:</strong> ${d.arc}<br/>
        <strong>Vindija:</strong> ${d.vin}<br/>
        <strong>Chagyrskaya:</strong> ${d.cha}<br/>
        <strong>Altai:</strong> ${d.alt}<br/>
        <strong>Denisova:</strong> ${d.den}<br/>
        <strong>Common Archaics:</strong> ${d.car}<br/>
        <strong>Common Neanderthals:</strong> ${d.cne}<br/>
        <strong>Private Vindija:</strong> ${d.pvi}<br/>
        <strong>Private Chagyrskaya:</strong> ${d.pch}<br/>
        <strong>Private Altai:</strong> ${d.pal}<br/>
        <strong>Private Denisova:</strong> ${d.pde}<br/>`
      );
    })
    .on("mousemove", function (event, d) {
      const [mouseX, mouseY] = d3.pointer(event, container.node()); // Ensure the mouse position is relative to the container
      tooltip
        .style("left", `${mouseX + 10}px`)
        .style("top", `${mouseY - 28}px`);
    })
    .on("mouseleave", function () {
      tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
    });

  facetGroup
    .append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale));

  // Add Y Axis to the facet
  if (showYAxis) {
    facetGroup.append("g").call(d3.axisLeft(yScale));
    facetGroup
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text(y_label);
    facetGroup
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", -30)
      .attr("y2", plotHeight)
      .attr("stroke", "black");
  }

  facetGroup
    .append("text")
    .attr("x", plotWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .each(function () {
      const titleText = d3.select(this);
      const lines = title.split("\n");
      lines.forEach((line, i) => {
        titleText
          .append("tspan")
          .attr("x", plotWidth / 2)
          .attr("y", -25 + i * 5) // Adjust line height (15 can be replaced with your preference)
          .attr("dy", `${i * 1.1}em`)
          .text(line);
      });
    });
  // Draw mean/median lines if needed
  if (showMeanMedian) {
    const colorGroups = d3.group(data, (d) => getColor(d));

    colorGroups.forEach((groupData, color) => {
      const container = d3.select("#violin-container"); // Assuming you have a div with this id
      const meaMedTooltip = container.append("div").attr("class", "tooltip");
      const mean = d3.mean(
        groupData,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const median = d3.median(
        groupData,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      // Function to find the closest density value in sumstat
      function getDensityAtValue(
        sumstat: { key: string; value: any[][] } | undefined,
        yValue: number
      ) {
        // Find the closest y-tick in sumstat
        if (!sumstat) return 0; // Return a default value or handle the case when sumstat is undefined
        const closest = sumstat.value.reduce((prev, curr) => {
          return Math.abs(curr[0] - yValue) < Math.abs(prev[0] - yValue)
            ? curr
            : prev;
        });
        return closest[1]; // Return the density (second element)
      }

      // Get the corresponding density for the mean/median from sumstat
      const sumstatForGroup = sumstat.find((d) => d.key === groupData[0].color); // Find the correct group
      const densityForMean = getDensityAtValue(sumstatForGroup, mean);
      const densityForMedian = getDensityAtValue(sumstatForGroup, median);

      // Scale for density to control line width
      const densityScale = d3
        .scaleLinear()
        .domain([0, maxNum]) // maxNum is the maximum density value
        .range([0, xScale.bandwidth()]); // Scale density to match violin width

      // Draw mean line

      facetGroup
        .append("line")
        .attr("x1", () => {
          const xPosition = xScale(groupData[0].color);
          return xPosition !== undefined
            ? xPosition +
            xScale.bandwidth() / 2 -
            densityScale(densityForMean) / 2
            : 0;
        })
        .attr("x2", () => {
          const xPosition = xScale(groupData[0].color);
          return xPosition !== undefined
            ? xPosition +
            xScale.bandwidth() / 2 +
            densityScale(densityForMean) / 2
            : 0;
        })
        .attr("y1", () => yScale(mean))
        .attr("y2", () => yScale(mean))
        .attr(
          "stroke",
          d3.color(getColor(groupData[0]))!.darker(0.7).formatHex()
        )
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .on("mouseenter", (event) => {
          meaMedTooltip.transition().duration(200).style("opacity", 1); // Show tooltip
          meaMedTooltip.html(
            `<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Mean:</strong> ${mean.toFixed(2)}`
          );
        })
        .on("mousemove", (event) => {
          const [mouseX, mouseY] = d3.pointer(event, container.node()); // Ensure the mouse position is relative to the container
          meaMedTooltip
            .style("left", `${mouseX + 10}px`)
            .style("top", `${mouseY - 28}px`);
        })
        .on("mouseleave", () => {
          meaMedTooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
        });

      // Draw median line
      facetGroup
        .append("line")
        .attr("x1", () => {
          const xPosition = xScale(groupData[0].color);
          return xPosition !== undefined
            ? xPosition +
            xScale.bandwidth() / 2 -
            densityScale(densityForMedian) / 2
            : 0;
        })
        .attr("x2", () => {
          const xPosition = xScale(groupData[0].color);
          return xPosition !== undefined
            ? xPosition +
            xScale.bandwidth() / 2 +
            densityScale(densityForMedian) / 2
            : 0;
        })
        .attr("y1", () => yScale(median))
        .attr("y2", () => yScale(median))
        .attr(
          "stroke",
          d3.color(getColor(groupData[0]))!.darker(0.7).formatHex()
        )
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "2,4")
        .on("mouseenter", (event) => {
          meaMedTooltip.transition().duration(200).style("opacity", 1);
          meaMedTooltip.html(
            `<strong>Group:</strong> ${groupData[0].color
            }<br/><strong>Median:</strong> ${median.toFixed(2)}`
          );
        })
        .on("mousemove", (event) => {
          const [mouseX, mouseY] = d3.pointer(event, container.node());
          meaMedTooltip
            .style("left", `${mouseX + 10}px`)
            .style("top", `${mouseY - 28}px`);
        })
        .on("mouseleave", () => {
          meaMedTooltip.transition().duration(200).style("opacity", 0);
        });
    });
  }
};

const ViolinComponent: React.FC<ViolinPlotProps> = ({
  data,
  var_1_mapped,
  bandwidth_divisor,
  col,
  isSidebarVisible,
  mea_med_1,
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
        bandwidth_divisor,
        mea_med_1,
        y_axis,
        min_y_axis,
        max_y_axis
      );
    }
  }, [data, col, var_1_mapped, bandwidth_divisor]); // Re-render the histogram when any prop changes

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
        bandwidth_divisor,
        mea_med_1,
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
      id="plot-container"
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
  col: string[],
  var_x: string,
  bandwidth_divisor: number,
  showMeanMedian: boolean,
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
  // Clear any existing content in the SVG
  d3.select(svgElement).selectAll("*").remove();
  const container = svgElement.parentElement;

  const margin = { top: 50, right: 30, bottom: 80, left: 75 };
  const width = container ? container.clientWidth : 960;
  const height = container ? container.clientHeight : 600;
  const { getColor, legendData, discreteOrContinuous, globalColorOrder } =
    createColorScale(data, col, var_x);

  // Extract unique values for faceting directly from the data
  const uniqueFacX = [...new Set(data.map((d) => d.fac_x))].filter(
    (val) => val !== null
  );

  // Determine if faceting is needed
  const facetingRequiredX = uniqueFacX.length > 1;

  // Determine number of rows and columns in the grid based on faceting
  const numCols = facetingRequiredX ? uniqueFacX.length : 1;

  const plotWidth =
    numCols === 1
      ? width - margin.left - margin.right
      : (width - margin.left - margin.right) / numCols;
  // Step 1: Group data by `fac_x`
  const groupedByFacX: { [key: string]: Array<DataPoint> } = data.reduce(
    (acc, point) => {
      if (point.fac_x) {
        // Ensure that fac_x is not null
        if (!acc[point.fac_x]) {
          acc[point.fac_x] = [];
        }
        acc[point.fac_x].push(point);
      }
      return acc;
    },
    {} as { [key: string]: Array<DataPoint> }
  );

  // Step 2: For each `fac_x` group, accumulate unique `color` values using a Set
  let totalUniqueColors = 0;

  for (const facXValue in groupedByFacX) {
    const uniqueColorsSet = new Set<string>();

    groupedByFacX[facXValue].forEach((point) => {
      uniqueColorsSet.add(point.color); // Add the color value to the set
    });

    // Add the size of the unique colors for this `fac_x` group to the total
    totalUniqueColors += uniqueColorsSet.size;
  }

  const xTickWidth = (width - margin.left - margin.right) / totalUniqueColors;
  const plotHeight = height - margin.bottom - margin.top;

  const svg = d3
    .select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(0,0)`);

  const yScale = d3.scaleLinear().range([plotHeight, 0]);
  const xScale = d3
    .scaleBand()
    .range([0, plotWidth])
    .domain(globalColorOrder)
    .padding(0.05);

  const padding = 30;
  let cumulativeWidth = 0;
  const legend = svg.append("g").attr(
    "transform",
    `translate(${margin.left}, ${height - margin.bottom / 1.5})` // Start legend at the leftmost point of the container
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
  const x_title = svg.append("g").attr(
    "transform",
    `translate(${width / 2}, ${height - margin.bottom / 1.5})` // Center horizontally and place at the bottom
  );
  const x_label = col
    .map(
      (value) =>
        variables.mappingToLong[value as keyof typeof variables.mappingToLong]
    )
    .join("-");
  x_title
    .append("text")
    .attr("x", 0)
    .attr("y", 9) // Adjust this to move the label below the axis
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .text(x_label);

  if (facetingRequiredX) {
    // Apply faceting on fac_x only
    let accX = margin.left;
    uniqueFacX.forEach((facXValue, i) => {
      const facetData = data.filter((d) => d.fac_x === facXValue);
      const xAxRange = Array.from(new Set(facetData.map((d) => d.color)));
      const reorderedXAxRange = globalColorOrder.filter((color) =>
        xAxRange.includes(color)
      );

      const plotWidth = reorderedXAxRange.length * xTickWidth;
      const xScale = d3
        .scaleBand()
        .range([0, plotWidth])
        .domain(reorderedXAxRange)
        .padding(0.05);

      if (y_axis === "Define Range") {
        yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
      } else if (y_axis === "Shared Axis") {
        const minVal = d3.min(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const maxVal = d3.max(
          data,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      } else if (y_axis === "Free Axis") {
        const minVal = d3.min(
          facetData,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const maxVal = d3.max(
          facetData,
          (d) => d[var_x as keyof DataPoint] as number
        )!;
        const buffer = (maxVal - minVal) * 0.05;
        yScale
          .domain([minVal - buffer, maxVal + buffer])
          .range([plotHeight, 0]);
      }

      const facetGroup = svg.append("g").attr(
        "transform",
        `translate(${accX},${margin.top})
          `
      );
      accX += plotWidth;

      const title = `${facXValue.replace(/_/g, "\n")}`;

      const y_label =
        variables.mappingToLong[var_x as keyof typeof variables.mappingToLong];
      const x_label = col
        .map(
          (value) =>
            variables.mappingToLong[
            value as keyof typeof variables.mappingToLong
            ]
        )
        .join("-");
      const showYaxis = i === 0;
      drawViolin(
        facetGroup,
        facetData,
        xScale,
        yScale,
        y_axis,
        min_y_axis,
        max_y_axis,
        bandwidth_divisor,
        plotHeight,
        plotWidth,
        var_x,
        col,
        getColor,
        discreteOrContinuous,
        globalColorOrder,
        showMeanMedian,
        title,
        x_label,
        y_label,
        0.5,
        showYaxis
      );
    });
  } else {
    if (y_axis === "Define Range") {
      yScale.domain([min_y_axis, max_y_axis]).range([plotHeight, 0]);
    } else if (y_axis === "Shared Axis") {
      const minVal = d3.min(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const maxVal = d3.max(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const buffer = (maxVal - minVal) * 0.05;
      yScale.domain([minVal - buffer, maxVal + buffer]).range([plotHeight, 0]);
    } else if (y_axis === "Free Axis") {
      const minVal = d3.min(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const maxVal = d3.max(
        data,
        (d) => d[var_x as keyof DataPoint] as number
      )!;
      const buffer = (maxVal - minVal) * 0.05;
      yScale.domain([minVal - buffer, maxVal + buffer]).range([plotHeight, 0]);
    }

    const facetGroup = svg.append("g").attr(
      "transform",
      `translate(${margin.left},${margin.top})
        `
    );
    const title = ``;
    const y_label =
      variables.mappingToLong[var_x as keyof typeof variables.mappingToLong];
    const x_label = col
      .map(
        (value) =>
          variables.mappingToLong[value as keyof typeof variables.mappingToLong]
      )
      .join("-");
    drawViolin(
      facetGroup,
      data,
      xScale,
      yScale,
      y_axis,
      min_y_axis,
      max_y_axis,
      bandwidth_divisor,
      plotHeight,
      plotWidth,
      var_x,
      col,
      getColor,
      discreteOrContinuous,
      globalColorOrder,
      showMeanMedian,
      title,
      x_label,
      y_label,
      0.5,
      true
    );
  }
};
