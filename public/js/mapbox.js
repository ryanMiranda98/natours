export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1Ijoicnlhbm1pcmFuZGEiLCJhIjoiY2tkNXlmcjAwMDV3bTJybjVtcHMzamwxYyJ9.PS5yoJI1oNkqX6fYJFwoGQ";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/ryanmiranda/ckd5z4t4706mg1in4yjic7h5s",
    scrollZoom: false,
    // lng, lat
    //   center: [-118.113491, 34.111745],
    // zoom: 10,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement("div");
    el.className = "marker";

    // Add marker
    new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add a popup
    new mapboxgl.Popup({ anchor: "bottom", offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
