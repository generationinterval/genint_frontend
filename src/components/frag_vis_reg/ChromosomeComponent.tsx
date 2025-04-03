import { reg_cmaps } from "@/assets/colormaps";
import { chrlen } from "@/assets/StaticData";
import { DataPoint, mappingToLong } from "@/components/frag_vis_reg/fvrStatic";
import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

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
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
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
  const margin = { top: 0, right: 0, bottom: 0, left: 30 };
  const width = container
    ? container.clientWidth - margin.left - margin.right
    : 960;
  const height = container
    ? container.clientHeight - margin.top - margin.bottom
    : 600;

  const plotWidth = width * 0.95;
  const plotHeight = height * 0.95;

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
          <strong>Individuals with Archaic:</strong> ${d.pres_numind}<br/>
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
    .attr("transform", `translate(${margin.left},${margin.top})`);


  const xScale = d3
    .scaleLinear()
    .domain([chrms_limits[0] * 1000, chrms_limits[1] * 1000])
    .range([0, plotWidth]);
  const chrmsCount = chrms.length;
  const chrPadding = 10; // Padding between chromosomes
  const chrHeight = (plotHeight - (chrmsCount - 1) * chrPadding) / chrmsCount; // Space per chromosome minus padding
  const partitionHeight = chrHeight / regs.length;

  const colorScaleDiscrete: d3.ScaleOrdinal<string, string> = d3
    .scaleOrdinal<string>()
    .domain(Object.keys(reg_cmaps))
    .range(Object.values(reg_cmaps));

  // First, filter to ensure we only work with defined frequency values.
  const freqData = data.filter((d) => d.freq !== undefined) as DataPoint[];
  const minFreq = d3.min(freqData, (d) => d.freq)!;
  const maxFreq = d3.max(freqData, (d) => d.freq)!;

  // Use a power scale with an exponent less than 1 to boost lower values.
  // Here, we also set a minimum opacity (e.g., 0.2) to ensure that even the lowest frequency
  // gets some color, and maximum opacity is 1.
  const opacityScale = d3
    .scalePow()
    .exponent(0.5) // You can adjust this exponent to control the boost of low values.
    .domain([minFreq, maxFreq])
    .range([0.1, 1]);

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

        const fillColor = colorScaleDiscrete(d.reg);
        // Use d.freq as a number since we assume it's defined when stat === "freq"
        const opacityValue =
          stat === "freq" && opacityScale ? opacityScale(d.freq as number) : 1;


        svg
          .append("rect")
          .attr("x", startX)
          .attr("y", indYPos)
          .attr("width", endX - startX)
          .attr("height", partitionHeight)
          .attr("fill", fillColor)
          .attr("fill-opacity", opacityValue)
          .on("mouseover", (event) => handleMouseOver(event, d, stat))
          .on("mousemove", (event) => handleMouseMove(event, d))
          .on("mouseout", (event) => handleMouseOut(event, d));
      });
    });
  });

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));
  // Legend (for the bottom-center part)
  // Legend (for the bottom-center part)
  const legendHeight = 25; // Height of the legend area
  const legendY = height - legendHeight; // Position the legend vertically at the bottom

  const padding = 30;
  let cumulativeWidth = 0;
  const keys = regs;
  const legend = svg.append("g").attr(
    "transform",
    `translate(0, ${legendY})` // Start legend at the leftmost point of the container
  );

  keys.forEach((key, i) => {
    legend
      .append("rect")
      .attr("x", cumulativeWidth)
      .attr("y", 0)
      .attr("width", 18)
      .attr("height", 18)
      .style(
        "fill",
        colorScaleDiscrete ? (colorScaleDiscrete(key) as string) : "black"
      );
    // Append text label
    const text = legend
      .append("text")
      .attr("x", cumulativeWidth + 24) // Position text next to the rectangle
      .attr("y", 9) // Center text vertically with the rectangle
      .attr("dy", ".35em")
      .text(mappingToLong[key as keyof typeof mappingToLong]);

    const textNode = text.node();
    if (textNode) {
      const textWidth = textNode.getBBox().width;
      cumulativeWidth += 18 + textWidth + padding; // Update cumulative width with rectangle, text, and padding
    }

  });
};
