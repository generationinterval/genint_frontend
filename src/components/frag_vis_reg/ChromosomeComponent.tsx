import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { variables } from "@/assets/FilterOptions";
import { chrlen } from "@/assets/StaticData";
import { stat } from "fs";

export interface DataPoint {
  chrom: string;
  start: number;
  end: number;
  reg: string;
  numind?: number;
  freq?: number;
  column_6?: number;
}

type ChromosomeProps = {
  data: any[];
  stat: string;
  isSidebarVisible: boolean;
  chrms: string[];
  regs: string[];
  anc: string;
  chrms_limits: [number, number];
  min_length: number;
};

type MappingKey = keyof typeof variables.mappingToLong;

const ChromosomeComponent: React.FC<ChromosomeProps> = ({
  data,
  stat,
  isSidebarVisible,
  chrms,
  regs,
  anc,
  chrms_limits,
  min_length,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      plotChromosomes(
        svgRef.current!,
        data,
        stat,
        chrms,
        regs,
        anc,
        chrms_limits,
        min_length
      );
    }
  }, [data, isSidebarVisible, chrms, anc, chrms_limits, min_length]);

  const handleResize = () => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      plotChromosomes(
        svgRef.current!,
        data,
        stat,
        chrms,
        regs,
        anc,
        chrms_limits,
        min_length
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
  }, [data, isSidebarVisible, chrms, anc, chrms_limits, min_length]);

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
  stat: string,
  chrms: string[],
  regs: string[],
  anc: string,
  chrms_limits: [number, number],
  min_length: number
) => {
  d3.select(svgElement).selectAll("*").remove();
  const container = svgElement.parentElement;
  d3.select(container).selectAll(".tooltip").remove();
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
  const tooltip = d3.select(container).append("div").attr("class", "tooltip");

  function handleMouseOver(event: any, d: DataPoint, stat: string) {
    tooltip.transition().duration(200).style("opacity", 0.9);

    const [mouseX, mouseY] = d3.pointer(event, container);

    // Check if "stat" is "freq" and set the tooltip content accordingly
    const htmlContent =
      stat === "freq"
        ? `
          <strong>Region:</strong> ${d.reg}<br/>
          <strong>Start:</strong> ${d.start}<br/>
          <strong>End:</strong> ${d.end}<br/>
          <strong>Length:</strong> ${d.end - d.start}<br/>
          <strong>Number of Individuals:</strong> ${d.numind}<br/>
          <strong>Frequency:</strong> ${d.freq}<br/>
        `
        : `
          <strong>Region:</strong> ${d.reg}<br/>
          <strong>Start:</strong> ${d.start}<br/>
          <strong>End:</strong> ${d.end}<br/>
          <strong>Length:</strong> ${d.end - d.start}<br/>
        `;

    tooltip
      .html(htmlContent)
      .style("left", mouseX + 10 + "px")
      .style("top", mouseY - 28 + "px");
  }

  function handleMouseMove(event: any, d: DataPoint) {
    const [mouseX, mouseY] = d3.pointer(event, container);
    tooltip.style("left", mouseX + 10 + "px").style("top", mouseY - 28 + "px");
  }

  function handleMouseOut(event: any, d: DataPoint) {
    tooltip.transition().duration(500).style("opacity", 0);
  }

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
  const partitionHeight = chrHeight / regs.length;

  let colorScaleDiscrete: d3.ScaleOrdinal<string, string> | null = null;

  colorScaleDiscrete = d3
    .scaleOrdinal<string>(d3.schemeCategory10)
    .domain(regs);

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

    const chromData = data.filter((d) => {
      if (chrom === "X Prime") {
        return d.chrom === "Xprime";
      }
      return d.chrom === chrom;
    });
    // For each individual, draw their respective rectangle
    regs.forEach((regValue, regIndex) => {
      // Filter data for the individual
      const individualRegData = chromData.filter(
        (d) =>
          d.reg === regValue && // Filter based on mean_prob
          d.end - d.start >= min_length * 1000 && // Filter based on length
          d.start >= chrms_limits[0] * 1000
      );

      individualRegData.forEach((d) => {
        const startX = xScale(d.start);
        const endX = xScale(d.end);
        const indYPos = yPos + regIndex * partitionHeight;

        let fillColor: string = "black"; // Default fallback color

        fillColor = colorScaleDiscrete(d.reg);

        svg
          .append("rect")
          .attr("x", startX)
          .attr("y", indYPos)
          .attr("width", endX - startX)
          .attr("height", partitionHeight)
          .attr("fill", fillColor)
          .on("mouseover", (event) => handleMouseOver(event, d, stat))
          .on("mousemove", (event) => handleMouseMove(event, d))
          .on("mouseout", (event) => handleMouseOut(event, d));
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

  const keys = regs;
  const legendItemWidth = 125;
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
      .text(variables.mappingToLong[key as MappingKey]);
  });
};
