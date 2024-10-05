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
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([47, 2], 5);

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
    const dataColorScale = d3
      .scaleOrdinal(d3.schemeCategory10) // You can replace with other schemes if needed
      .domain([...new Set(data.map((d) => d.dat))]);

    const regColorScale = d3
      .scaleOrdinal(d3.schemeSet2)
      .domain([...new Set(data.map((d) => d.reg))]);

    const popColorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain([...new Set(data.map((d) => d.pop))]);
    // Function to update the circles when the map moves
    function updateCircles() {
      d3.select(map.getPanes().overlayPane)
        .select("svg")
        .selectAll("circle")
        .attr("cx", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).x)
        .attr("cy", (d: any) => projectPoint(d.jitteredLat, d.jitteredLon).y);
    }

    // Select the SVG overlay for circles
    const svg = d3
      .select(map.getPanes().overlayPane)
      .select("svg")
      .attr("class", "leaflet-zoom-animated")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0");

    // Bind the data to circles and set their initial positions and styles
    if (map_data) {
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
      svg
        .selectAll(".circle_reg")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_reg_rad)
        .attr("fill", (d) => dataColorScale(d.reg))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.4);
    }

    if (map_pop) {
      svg
        .selectAll(".circle_pop")
        .data(jitteredData)
        .enter()
        .append("circle")
        .attr("cx", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).x)
        .attr("cy", (d) => projectPoint(d.jitteredLat!, d.jitteredLon!).y)
        .attr("r", map_pop_rad)
        .attr("fill", (d) => dataColorScale(d.pop))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .attr("fill-opacity", 0.6);
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
      // Clean up when the component unmounts
      map.off("moveend", updateCircles);
      map.off("zoomend", updateCircles);
      map.remove();
    };
  }, [data, map_lat_jit, map_lon_jit, map_data, map_reg, map_pop]);

  return (
    <div ref={mapRef} id="mapid" style={{ height: "100%", width: "100%" }} />
  );
};

export default MapComponent;
