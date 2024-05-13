import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import mapboxgl from "mapbox-gl";
import portLocations from "./data/port_location.json";
import shipLocations from "./data/ship_location2.json";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);
  const [theme, setTheme] = useState(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 18 ? "light" : "dark";
  });

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("style.load", () => {
      map.current.addSource("portLocations", {
        type: "geojson",
        data: portLocations,
      });

      map.current.addSource("shipLocations", {
        type: "geojson",
        data: shipLocations,
      });

      map.current.addLayer({
        id: "portLocations",
        type: "circle",
        source: "portLocations",
        paint: {
          "circle-radius": 3,
          "circle-color": "red",
        },
      });
      map.current.addLayer({
        id: "portNames",
        type: "symbol",
        source: "portLocations",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
        },
        paint: {
          "text-color": "red",
        },
        filter: ["<=", 8, ["zoom"]],
      });

      map.current.addLayer({
        id: "shipLocations",
        type: "circle",
        source: "shipLocations",
        paint: {
          "circle-radius": 3,
          "circle-color": "blue",
        },
      });

      map.current.on("click", "portLocations", function (e) {
        if (map.current.getZoom() < 8) {
          var features = map.current.queryRenderedFeatures(e.point, {
            layers: ["portLocations"],
          });

          if (!features.length) {
            return;
          }

          var feature = features[0];

          new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(feature.geometry.coordinates)
            .setHTML("<p>" + feature.properties.name + "</p>")
            .addTo(map.current);
        }
      });

      map.current.on("click", async function (e) {
        // Get the clicked location's coordinates
        const { lng, lat } = e.lngLat;

        // Fetch the timezone data from the Google Time Zone API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Math.floor(
            Date.now() / 1000
          )}&key=${apiKey}`
        );
        const data = await response.json();

        // Calculate the local time
        const date = new Date();
        const localTime = new Date(
          date.getTime() +
            date.getTimezoneOffset() * 60000 +
            data.dstOffset * 1000 +
            data.rawOffset * 1000
        );

        // Display the local time
        new mapboxgl.Popup({ offset: [0, -15] })
          .setLngLat(e.lngLat)
          .setHTML(`<p>Local time at this location is: ${localTime}</p>`)
          .addTo(map.current);
      });
    });

    map.current.setStyle("mapbox://styles/mapbox/" + theme + "-v11");

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });

  useEffect(() => {
    if (map.current) {
      map.current.setStyle("mapbox://styles/mapbox/" + theme + "-v11");
    }
  }, [theme]);

  return (
    <div className="App">
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div className="toggleTheme">
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>Theme:</span>
          <input
            type="radio"
            id="light"
            name="theme"
            value="light"
            onClick={() => setTheme("light")}
            checked={theme === "light"}
          />
          <label for="light">Light</label>
          <br />
          <input
            type="radio"
            id="dark"
            name="theme"
            value="dark"
            onClick={() => setTheme("dark")}
            checked={theme === "dark"}
          />
          <label for="dark">Dark</label>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 50,
          right: 12,
          zIndex: 1,
          backgroundColor: "rgb(35 55 75 / 90%)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "blue",
              marginRight: "5px",
            }}
          ></div>
          <div>Ship Location</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "red",
              marginRight: "5px",
            }}
          ></div>
          <div>Port Location</div>
        </div>
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
