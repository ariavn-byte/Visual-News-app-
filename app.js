document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    const map = L.map('map', { center: [30, 45], zoom: 5 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 }).addTo(map);

    // --- STATE VARIABLES ---
    let isCompareMode = false;
    let eventsToCompare = [];

    // --- DOM ELEMENTS ---
    const compareBtn = document.getElementById('compare-btn');
    const analysisPanel = document.getElementById('analysis-panel');
    const panelBody = document.getElementById('panel-body');
    const panelTitle = document.getElementById('panel-title');
    const mapContainer = document.getElementById('map');

    // --- DATA FETCHING ---
    async function getMapData() {
        try {
            const response = await fetch('http://localhost:3000/api/events');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Could not fetch map data:", error);
            panelBody.innerHTML = `<p style="color: red;">Error: Could not load map data. Please ensure the backend server is running.</p>`;
            openAnalysisPanel();
            return { eventData: {}, countryPolygons: { features: [] } };
        }
    }

    const { eventData, countryPolygons } = await getMapData();

    // --- STYLING AND HELPER FUNCTIONS ---
    function getVolumeColor(v) { return v > 8 ? '#08519c' : v > 6 ? '#3182bd' : v > 4 ? '#6baed6' : '#bdd7e7'; }
    function getVolumeRadius(v) { return v * 2 + 5; }
    const selectedStyle = { color: '#8e44ad', weight: 3, fillColor: '#9b59b6', fillOpacity: 1 };

    // --- MAP LAYERS AND DATA PARSING ---
    const locationData = {};
    const hotspotLayers = {}; // To store references to layers
    const hotspotLayer = L.markerClusterGroup();

    const countryLayer = L.geoJson(null, {
        style: (feature) => ({
            fillColor: getVolumeColor(feature.properties.avgNewsVolume),
            weight: 1, color: 'white', dashArray: '3', fillOpacity: 0.55
        }),
        onEachFeature: (feature, layer) => {
            layer.on('click', (e) => {
                if (isCompareMode) return; // Disable country click in compare mode
                map.fitBounds(layer.getBounds());
                displayCountryNews(feature.properties.name);
            });
            layer.bindTooltip(`<strong>${feature.properties.name}</strong><br>Avg. News Volume: ${feature.properties.avgNewsVolume.toFixed(1)}`);
        }
    }).addTo(map);

    Object.entries(eventData).forEach(([country, locations]) => {
        let totalVolume = 0;
        locations.forEach(loc => {
            locationData[loc.name] = { ...loc, country };
            totalVolume += loc.newsVolume;
        });
        const avgVolume = locations.length > 0 ? totalVolume / locations.length : 0;
        const countryFeature = countryPolygons.features.find(f => f.properties.name === country);
        if (countryFeature) {
            countryFeature.properties.avgNewsVolume = avgVolume;
            countryLayer.addData(countryFeature);
        }
    });

    Object.values(locationData).forEach(loc => {
        const originalStyle = {
            fillColor: getVolumeColor(loc.newsVolume), radius: getVolumeRadius(loc.newsVolume),
            color: '#1a202c', weight: 1.5, fillOpacity: 0.8, title: loc.name
        };
        const hotspot = L.circleMarker([loc.lat, loc.lng], originalStyle);
        hotspot.originalStyle = originalStyle; // Store original style

        hotspot.on('click', () => handleHotspotClick(loc, hotspot));

        hotspot.bindPopup(`<h4>${loc.name}</h4><p>${loc.event}</p>`);
        hotspotLayer.addLayer(hotspot);
        hotspotLayers[loc.name] = hotspot; // Store layer reference
    });

    // --- EVENT HANDLERS ---
    function handleHotspotClick(loc, layer) {
        if (!isCompareMode) {
            layer.openPopup();
            return;
        }

        const isSelected = eventsToCompare.some(e => e.location.name === loc.name);
        if (isSelected) {
            // Deselect
            eventsToCompare = eventsToCompare.filter(e => e.location.name !== loc.name);
            layer.setStyle(layer.originalStyle);
        } else {
            // Select
            if (eventsToCompare.length < 2) {
                eventsToCompare.push({ location: loc, layer: layer });
                layer.setStyle(selectedStyle);
            }
        }

        if (eventsToCompare.length === 2) {
            analyzeEvents();
        }
    }

    compareBtn.addEventListener('click', () => {
        isCompareMode = !isCompareMode;
        compareBtn.classList.toggle('active', isCompareMode);
        if (isCompareMode) {
            compareBtn.textContent = 'Exit Compare Mode';
            map.closePopup();
        } else {
            resetComparison();
        }
    });

    // --- CORE LOGIC ---
    async function analyzeEvents() {
        panelTitle.innerText = 'Analyzing Connection...';
        panelBody.innerHTML = '<div class="loader"></div>';
        openAnalysisPanel();

        const [event1, event2] = eventsToCompare;

        try {
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event1: event1.location,
                    event2: event2.location
                })
            });
            if (!response.ok) throw new Error(`Analysis failed with status: ${response.status}`);

            const result = await response.json();
            console.log("Analysis Result:", result); // Log for now

            panelTitle.innerText = `Analysis: ${event1.location.name} & ${event2.location.name}`;
            panelBody.innerHTML = `
                <h5>Likelihood of Connection: ${result.likelihood}</h5>
                <p>${result.narrative}</p>
            `;

        } catch (error) {
            console.error('Analysis Error:', error);
            panelBody.innerHTML = `<p style="color: red;">Error during analysis. Please try again.</p>`;
        } finally {
            // Exit compare mode after analysis
            isCompareMode = false;
            compareBtn.classList.remove('active');
            resetComparison();
        }
    }

    function resetComparison() {
        compareBtn.textContent = 'Compare Events';
        eventsToCompare.forEach(e => e.layer.setStyle(e.layer.originalStyle));
        eventsToCompare = [];
    }

    // --- ZOOM-BASED LAYER VISIBILITY ---
    function updateLayers() { /* ... existing code ... */ }
    map.on('zoomend', updateLayers);
    updateLayers();

    // --- ANALYSIS PANEL ---
    window.openAnalysisPanel = function() { /* ... existing code ... */ }
    window.closeAnalysisPanel = function() { /* ... existing code ... */ }
    function displayCountryNews(countryName) { /* ... existing code ... */ }

    // --- PLUGINS ---
    const minimapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { minZoom: 0, maxZoom: 13 });
    new L.Control.MiniMap(minimapLayer, { toggleDisplay: true, position: 'bottomleft' }).addTo(map);
    L.control.measure({ position: 'topleft', primaryLengthUnit: 'kilometers', secondaryLengthUnit: 'miles' }).addTo(map);
}
