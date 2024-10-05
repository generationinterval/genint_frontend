import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { variables } from "@/assets/FilterOptions";
import { chrlen } from "@/assets/StaticData";

export interface DataPoint {
  alt: number; // 1
  anc: string; // "AmbigNean"
  arc: number; // 1
  car: number; // 0
  cha: number; // 1
  chrom: string; // "4"
  cne: number; // 1
  dat: string; // "1KGP"
  den: number; // 0
  end: number; // 43288000
  hap: number; // 1
  length: number; // 30000
  lin: string; // "HG02351_1KGP"
  mean_prob: number; // 0.85356
  name: string; // "HG02351"
  oda: string; // "1KGP"
  pal: number; // 0
  pch: number; // 0
  pde: number; // 0
  pop: string; // "CDX"
  pvi: number; // 0
  reg: string; // "EAS"
  snps: number; // 10
  start: number; // 43258000
  vin: number; // 1
}

type ChromosomeProps = {
  data: any[];
  isSidebarVisible: boolean;
  lin: string[];
  chrms: string[];
  ancs: string[];
  mpp: number;
  chrms_limits: [number, number];
  min_length: number;
  color: string;
};

const ChromosomeComponent: React.FC<ChromosomeProps> = ({
  data,
  isSidebarVisible,
  lin,
  chrms,
  ancs,
  mpp,
  chrms_limits,
  min_length,
  color,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      plotChromosomes(
        svgRef.current!,
        data,
        lin,
        chrms,
        ancs,
        mpp,
        chrms_limits,
        min_length,
        color
      );
    }
  }, [data, chrms, chrms_limits, mpp, min_length, color]);

  const handleResize = () => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      plotChromosomes(
        svgRef.current!,
        data,
        lin,
        chrms,
        ancs,
        mpp,
        chrms_limits,
        min_length,
        color
      );
    }
  };

  useEffect(() => {
    // Attach resize event listener
    window.addEventListener("resize", handleResize);
    // Run resize handler once to set initial sizes
    handleResize();
    console.log(data, chrms, chrms_limits, mpp, min_length, color);
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, chrms, chrms_limits, mpp, min_length, color]);

  useEffect(() => {
    // Handle resize when the sidebar visibility changes
    handleResize();
  }, [isSidebarVisible]);

  return (
    <div
      id="chromosome-container"
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <svg id="chromplot" ref={svgRef} />
    </div>
  );
};
export default ChromosomeComponent;

const plotChromosomes = (
  svgElement: SVGSVGElement,
  data: DataPoint[],
  lin: string[],
  chrms: string[],
  ancs: string[],
  mpp: number,
  chrms_limits: [number, number],
  min_length: number,
  color: string
) => {
  d3.select(svgElement).selectAll("*").remove();
  const container = svgElement.parentElement;
  const containerMargin = { top: 0, right: 0, bottom: 0, left: -10 };
  const plotMargin = { top: 20, right: -30, bottom: 90, left: 75 };
  const width = container
    ? container.clientWidth - containerMargin.left - containerMargin.right
    : 960;
  const height = container
    ? container.clientHeight - containerMargin.top - containerMargin.bottom
    : 600;

  const plotHeight = height - plotMargin.top - plotMargin.bottom;

  const plotWidth = width - plotMargin.left - plotMargin.right;

  function reorderChromosomes(chromList: string[]): string[] {
    // Define the desired order
    const desiredOrder = [...Array(22).keys()]
      .map((i) => (i + 1).toString())
      .concat(["X", "XPrime"]);

    // Sort the input list based on the desired order
    return chromList.sort((a, b) => {
      const indexA = desiredOrder.indexOf(a);
      const indexB = desiredOrder.indexOf(b);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  const orderedChrms = reorderChromosomes(chrms);

  const svg = d3
    .select(svgElement)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${plotMargin.left},${plotMargin.top})`);

  const maxChromLength = Math.max(
    ...orderedChrms.map((chrom) => chrlen[chrom] || min_length)
  );

  const xScale = d3
    .scaleLinear()
    .domain([chrms_limits[0] * 1000, chrms_limits[1] * 1000])
    .range([0, plotWidth * 0.95]);

  const chrmsCount = chrms.length;
  const chrPadding = 10; // Padding between chromosomes
  const chrHeight = (plotHeight - (chrmsCount - 1) * chrPadding) / chrmsCount; // Space per chromosome minus padding
  const partitionHeight = chrHeight / lin.length;

  let colorScaleDiscrete: d3.ScaleOrdinal<string, string> | null = null;
  let colorScaleContinous: ((value: number) => string) | null = null;

  if (color === "Ancestry") {
    colorScaleDiscrete = d3
      .scaleOrdinal<string>(d3.schemeCategory10)
      .domain(ancs);
  } else if (color === "Individual") {
    colorScaleDiscrete = d3
      .scaleOrdinal<string>(d3.schemeCategory10)
      .domain(lin);
  } else if (color === "Mean Posterior Probability") {
    // Scale maps from 0.5 to 1, and the result of the scale will be a number between 0 and 1.
    const mppScale = d3
      .scaleLinear<number>()
      .domain([0.5, 1]) // Input domain
      .range([0, 1]); // Range for the interpolator

    // The color scale uses `interpolateBlues` to map the number to a color
    colorScaleContinous = (value: number) =>
      d3.interpolateBlues(mppScale(value));
  }

  // Draw chromosomes
  orderedChrms.forEach((chrom, index) => {
    const chromLength = chrlen[chrom];
    const scaledChromWidth = xScale(chromLength);

    // Calculate the y position for the chromosome based on the index
    const yPos = index * (chrHeight + chrPadding);

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", yPos)
      .attr("width", scaledChromWidth)
      .attr("height", chrHeight)
      .attr("fill", "white")
      .attr("stroke", "black");
    svg
      .append("text")
      .attr("x", -10) // Position the label slightly to the left of the chromosome
      .attr("y", yPos + chrHeight / 2) // Center label vertically
      .attr("dy", "0.35em") // Small adjustment for text baseline
      .style("text-anchor", "end") // Align text to the right
      .text(`${chrom}`);
    // Filter data for this chromosome
    const chromData = data.filter((d) => {
      if (chrom === "X Prime") {
        return d.chrom === "Xprime";
      }
      return d.chrom === chrom;
    });

    // For each individual, draw their respective rectangle
    lin.forEach((linValue, linIndex) => {
      // Filter data for the individual
      const individualData = chromData.filter(
        (d) =>
          d.lin === linValue &&
          d.mean_prob >= mpp && // Filter based on mean_prob
          d.length >= min_length * 1000 && // Filter based on length
          d.start >= chrms_limits[0] * 1000
      );

      individualData.forEach((d) => {
        const startX = xScale(d.start);
        const endX = xScale(d.end);
        const indYPos = yPos + linIndex * partitionHeight;

        let fillColor: string = "black"; // Default fallback color

        if (color === "Individual" && colorScaleDiscrete) {
          fillColor = colorScaleDiscrete(d.lin);
        } else if (
          color === "Mean Posterior Probability" &&
          colorScaleContinous
        ) {
          fillColor = colorScaleContinous(d.mean_prob);
        } else if (color === "Ancestry" && colorScaleDiscrete) {
          fillColor = colorScaleDiscrete(d.anc);
        }

        svg
          .append("rect")
          .attr("x", startX)
          .attr("y", indYPos)
          .attr("width", endX - startX)
          .attr("height", partitionHeight)
          .attr("fill", fillColor);
      });
    });
  });

  svg
    .append("g")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale));
  // Legend (for the bottom-center part)
  // Legend (for the bottom-center part)
  const legendHeight = 50; // Height of the legend area
  const legendY = plotHeight + plotMargin.bottom - legendHeight; // Position the legend vertically at the bottom

  const legend = svg.append("g").attr("transform", `translate(0,${legendY})`); // Initial Y translation for legend

  if (color === "Ancestry" || color === "Individual") {
    const keys = color === "Ancestry" ? ancs : lin;
    const legendItemWidth =
      color === "Ancestry" ? 125 : color === "Individual" ? 200 : 150;
    // Width per item, including spacing
    const totalLegendWidth = keys.length * legendItemWidth; // Total width of all legend items
    const legendX = (plotWidth - totalLegendWidth) / 2; // Calculate X position to center the legend

    legend.attr("transform", `translate(${legendX},${legendY})`); // Adjust legend X and Y position

    keys.forEach((key, i) => {
      legend
        .append("rect")
        .attr("x", i * legendItemWidth) // Position horizontally
        .attr("y", 0) // Keep y the same to align all items in one row
        .attr("width", 18)
        .attr("height", 18)
        .style(
          "fill",
          colorScaleDiscrete ? (colorScaleDiscrete(key) as string) : "black"
        );

      legend
        .append("text")
        .attr("x", i * legendItemWidth + 24) // Position text next to the rectangle
        .attr("y", 9) // Align text vertically with the rectangles
        .attr("dy", "0.35em")
        .style("text-anchor", "start")
        .text(key);
    });
  } else if (color === "Mean Posterior Probability") {
    // Continuous legend for mean_prob
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "lightblue");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "darkblue");

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 100)
      .attr("height", 18)
      .style("fill", "url(#gradient)");

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 30)
      .style("text-anchor", "start")
      .text("0.5");

    legend
      .append("text")
      .attr("x", 100)
      .attr("y", 30)
      .style("text-anchor", "end")
      .text("1");
  }
};
