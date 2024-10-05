import React, { useEffect, useRef } from "react";
import L from "leaflet";
import * as d3 from "d3";
import "leaflet/dist/leaflet.css";

interface DataPoint {
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
  col: string;
  jitteredLat?: number; // Optional fields to store jittered positions
  jitteredLon?: number;
}

interface MapComponentProps {
  data: DataPoint[];
  isSidebarVisible: boolean;
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

const MapComponent: React.FC<MapComponentProps> = ({
  data,
  isSidebarVisible,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && Array.isArray(data) && data.length > 0) {
      Map(
        svgRef.current,
        data,
        map_data,
        map_data_rad,
        map_reg,
        map_reg_rad,
        map_pop,
        map_pop_rad,
        map_ind_rad,
        map_lat_jit,
        map_lon_jit
      );
    }
  }, [
    data,
    map_data,
    map_data_rad,
    map_reg,
    map_reg_rad,
    map_pop,
    map_pop_rad,
    map_ind_rad,
    map_lat_jit,
    map_lon_jit,
  ]);
  const handleResize = () => {
    if (containerRef.current && svgRef.current && data) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svgRef.current.setAttribute("width", String(width));
      svgRef.current.setAttribute("height", String(height));
      Map(
        svgRef.current,
        data,
        map_data,
        map_data_rad,
        map_reg,
        map_reg_rad,
        map_pop,
        map_pop_rad,
        map_ind_rad,
        map_lat_jit,
        map_lon_jit
      );
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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
export default MapComponent;

const Map = (
  svgElement: SVGSVGElement,
  data: DataPoint[],
  map_data: boolean,
  map_data_rad: number,
  map_reg: boolean,
  map_reg_rad: number,
  map_pop: boolean,
  map_pop_rad: number,
  map_ind_rad: number,
  map_lat_jit: number,
  map_lon_jit: number
) => {
  d3.select(svgElement).selectAll("*").remove();

  const container = svgElement.parentElement;
  const margin = { top: 30, right: 40, bottom: 40, left: 50 };
  const mapRef = useRef<HTMLDivElement | null>(null);
  const width = container
    ? container.clientWidth - margin.left - margin.right
    : 960;
  const height = container
    ? container.clientHeight - margin.top - margin.bottom
    : 600;


    // Initialize the map
    const map = L.map("mapid").setView([47, 2], 5);

    // Add a tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 10,
    }).addTo(map);

    // Add an SVG layer
    L.svg().addTo(map);

    // Function to project the lat/lon coordinates to pixels
    function projectPoint(lat: number, lon: number) {
      const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
      return point;
    }
    function applyJitter(
      lat: number,
      lon: number,
      map_lat_jit: number,
      map_lon_jit: number
    ) {
      const jitterLat = lat + (Math.random() - 0.5) * map_lat_jit;
      const jitterLon = lon + (Math.random() - 0.5) * map_lon_jit;
      return { jitterLat, jitterLon };
    }
    const jitteredData = data.map((d) => {
      const { jitterLat, jitterLon } = applyJitter(
        d.lat,
        d.lon,
        map_lat_jit,
        map_lon_jit
      );
      return { ...d, jitteredLat: jitterLat, jitteredLon: jitterLon };
    });

    let getDataColor: (d: DataPoint) => string;
    let getRegColor: (d: DataPoint) => string;
    let getPopColor: (d: DataPoint) => string;
    let legendDataDat: { label: string; color: string }[] = [];
    let legendDataReg: { label: string; color: string }[] = [];
    let legendDataPop: { label: string; color: string }[] = [];

    // Function to update the circles when the map moves
    function updateCircles() {
      d3.select(map.getPanes().overlayPane)
        .select("svg")
        .selectAll("circle")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y);
    }
    const svg = d3
      .select(map.getPanes().overlayPane)
      .select("svg")
      .attr("class", "leaflet-zoom-animated")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0");

      const itemWidth = 100;
    const legendDat = svg.append("g").attr(
      "transform",
      `translate(${(width - legendDataDat.length * itemWidth) / 2}, ${height - 20})` // Center horizontally and place at the bottom
    );

    const legendReg = svg.append("g").attr(
      "transform",
      `translate(${(width - legendDataReg.length * itemWidth) / 2}, ${height - 20})` // Center horizontally and place at the bottom
    );
    const legendPop = svg.append("g").attr(
      "transform",
      `translate(${(width - legendDataPop.length * itemWidth) / 2}, ${height - 20})` // Center horizontally and place at the bottom
    );


    // Bind the data to circles and set their initial positions and styles
    if (map_data) {
      const uniqueDataColors = [...new Set(data.map((d) => d.dat))];
      const dataColorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(uniqueDataColors);
      getDataColor = (d: DataPoint) => dataColorScale(d.dat);
      legendDataDat = uniqueDataColors.map((color) => ({
        label: color,
        color: dataColorScale(color),
      }));
      svg
        .selectAll(".circle_data")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_data_rad)
        .attr("fill", (d) => dataColorScale(d.dat))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.25);
    }
    if (map_reg) {
      const uniqueRegColors = [...new Set(data.map((d) => d.reg))];
      const regColorScale = d3
        .scaleOrdinal(d3.schemeSet2)
        .domain(uniqueRegColors);
      getRegColor = (d: DataPoint) => regColorScale(d.reg);
      legendDataReg = uniqueRegColors.map((color) => ({
        label: color,
        color: regColorScale(color),
      }));
      svg
        .selectAll(".circle_reg")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_reg_rad)
        .attr("fill", (d) => regColorScale(d.reg))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.4);
    }

    if (map_pop) {
      const uniquePopColors = [...new Set(data.map((d) => d.pop))];
      const popColorScale = d3
        .scaleOrdinal(d3.schemeTableau10)
        .domain(uniquePopColors);
      getPopColor = (d: DataPoint) => popColorScale(d.pop);
      legendDataPop = uniquePopColors.map((color) => ({
        label: color,
        color: popColorScale(color),
      }));
      svg
        .selectAll(".circle_pop")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_pop_rad)
        .attr("fill", (d) => popColorScale(d.pop))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.6);
      legendPop
        .selectAll("rect")
        .data(legendDataPop)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * itemWidth) // Horizontal positioning
        .attr("y", 0) // Align all items vertically
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", (d) => d.color);
        legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * itemWidth + 24) // Position text next to the rectangle
    .attr("y", 9) // Center the text vertically with the rectangle
    .attr("dy", ".35em")
    .text((d) => d.label);
    }

    svg
      .selectAll(".circe_ind")
      .data(jitteredData)
      .enter()
      .append("circle")
      .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
      .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
      .attr("r", map_ind_rad)
      .attr("fill", "red")
      .attr("stroke", "black")
      .attr("stroke-width", 0)
      .attr("fill-opacity", 0.7);

    // Update the circle positions when the map is zoomed or moved
    map.on("moveend", updateCircles);
    map.on("zoomend", updateCircles);

    return () => {
      map.off("moveend", updateCircles);
      map.off("zoomend", updateCircles);
      map.remove();
    };
  }, [data, map_lat_jit, map_lon_jit, map_data, map_reg, map_pop]);

  return (
    <div ref={mapRef} id="mapid" style={{ height: "100%", width: "100%" }} />
  );
};
