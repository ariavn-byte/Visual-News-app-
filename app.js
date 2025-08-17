// --- MAP INITIALIZATION ---
const map = L.map('map', { center: [30, 45], zoom: 5 });
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 }).addTo(map);

// --- STATIC GEOJSON DATA ---
const eventData = {
    "UAE": [
        { "name": "Dubai", "lat": 25.2048, "lng": 55.2708, "event": "Firms find it tricky to retain talent as candidates ask for performance-based pay.", "newsVolume": 6, "connections": [{ "target": "Riyadh", "strength": 2, "chainId": "gulf-investment" }] },
        { "name": "Abu Dhabi", "lat": 24.4539, "lng": 54.3773, "event": "U.S. investors commit over $50 billion, focusing on AI and tech.", "newsVolume": 9, "connections": [{ "target": "Riyadh", "strength": 3, "chainId": "gulf-investment" }] }
    ],
    "Palestine": [
        { "name": "Gaza", "lat": 31.5, "lng": 34.46, "event": "UN Security Council to hold urgent meeting after Israel asserts control over Gaza City.", "newsVolume": 10, "connections": [{ "target": "London", "strength": 2, "chainId": "gaza-tensions" }] }
    ],
    "UK": [
         { "name": "London", "lat": 51.5072, "lng": -0.1276, "event": "Demonstrators plan to march demanding release of all remaining hostages in Gaza.", "newsVolume": 7 }
    ],
    "Saudi Arabia": [
        { "name": "Riyadh", "lat": 24.7136, "lng": 46.6753, "event": "Sovereign wealth funds adapt compensation packages to attract international talent.", "newsVolume": 8 }
    ],
    "India": [
        { "name": "New Delhi", "lat": 28.6139, "lng": 77.2090, "event": "India positioned as a key player in the India-Middle East-Europe Economic Corridor (IMEC).", "newsVolume": 8 }
    ],
    "Syria": [
        { "name": "Damascus", "lat": 33.5138, "lng": 36.2765, "event": "US Congressman discusses return of Kayla Mueller's remains with interim president.", "newsVolume": 7},
        { "name": "Baniyas", "lat": 35.1823, "lng": 35.9495, "event": "Syria's caretaker government moves to restore Kirkuk-Baniyas oil pipeline with Iraq.", "newsVolume": 8, "connections": [{ "target": "Baghdad", "strength": 3, "chainId": "pipeline-deal" }] }
    ],
    "Iraq": [
        { "name": "Baghdad", "lat": 33.3152, "lng": 44.3661, "event": "Iraq discusses pipeline restoration to provide an alternative oil export route to Europe.", "newsVolume": 8 }
    ],
    "Qatar": [
         { "name": "Doha", "lat": 25.2854, "lng": 51.5310, "event": "Al Jazeera staff hold vigil for colleagues slain in Gaza.", "newsVolume": 8 }
    ],
    "Iran": [
        { "name": "Tehran", "lat": 35.6892, "lng": 51.3890, "event": "Iran offers compromise on uranium enrichment levels but refuses total halt.", "newsVolume": 8 }
    ],
    "Azerbaijan": [
        { "name": "Baku", "lat": 40.4093, "lng": 49.8671, "event": "Azerbaijani FM and EU discuss Washington meeting with Armenia.", "newsVolume": 7, "connections": [{ "target": "Yerevan", "strength": 3, "chainId": "peace-deal" }] }
    ],
     "Armenia": [
        { "name": "Yerevan", "lat": 40.1792, "lng": 44.4991, "event": "Peace agreement signed with Azerbaijan in Washington.", "newsVolume": 7 }
    ]
};

const countryPolygons = {
    "type": "FeatureCollection",
    "features": [
        { "type": "Feature", "properties": { "name": "Syria" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 35.7, 37.3 ], [ 42.3, 37.2 ], [ 42.2, 33.3 ], [ 38.8, 32.3 ], [ 35.7, 32.5 ], [ 35.7, 37.3 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Iraq" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 38.8, 37.3 ], [ 48.3, 34.4 ], [ 47.9, 29.9 ], [ 42.5, 30.1 ], [ 39.1, 33 ], [ 38.8, 37.3 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Palestine" }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 34.2, 31.2 ], [ 34.5, 31.6 ], [ 34.3, 31.2 ], [ 34.2, 31.2 ] ] ], [ [ [ 35.0, 31.5 ], [ 35.5, 32.6 ], [ 35.2, 31.5 ], [ 35.0, 31.5 ] ] ] ] } },
        { "type": "Feature", "properties": { "name": "UK" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.6, 49.9 ], [ 1.8, 55.8 ], [ -4.5, 60.8 ], [ -8.6, 49.9 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Saudi Arabia" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 34.8, 28.2 ], [ 48.5, 29.5 ], [ 55.6, 24.1 ], [ 52.2, 16.9 ], [ 42.6, 16.7 ], [ 34.5, 22.4 ], [ 34.8, 28.2 ] ] ] } },
        { "type": "Feature", "properties": { "name": "India" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 68.1, 7.9 ], [ 97.4, 35.5 ], [ 76.8, 35.5 ], [ 68.1, 7.9 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Iran" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 44.8, 39.7 ], [ 63.3, 37.2 ], [ 61.6, 25.1 ], [ 50.8, 26.6 ], [ 48.3, 30.1 ], [ 44.8, 39.7 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Qatar" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 50.7, 24.6 ], [ 51.6, 26.2 ], [ 51.0, 24.6 ], [ 50.7, 24.6 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Azerbaijan" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 44.8, 38.4 ], [ 50.4, 41.9 ], [ 46.6, 38.7 ], [ 44.8, 38.4 ] ] ] } },
        { "type": "Feature", "properties": { "name": "Armenia" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 43.5, 38.8 ], [ 46.6, 41.3 ], [ 44.0, 39.2 ], [ 43.5, 38.8 ] ] ] } },
        { "type": "Feature", "properties": { "name": "UAE" }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 51.2, 24.2 ], [ 56.4, 25.9 ], [ 54.0, 22.7 ], [ 51.2, 24.2 ] ] ] } }
    ]
};

// --- STYLING AND HELPER FUNCTIONS ---
function getVolumeColor(v) { return v > 8 ? '#08519c' : v > 6 ? '#3182bd' : v > 4 ? '#6baed6' : '#bdd7e7'; }
function getVolumeRadius(v) { return v * 2 + 5; }
function getConnectionStyle(strength) {
    switch (strength) {
        case 3: return { color: '#e74c3c', weight: 3, opacity: 0.85 };
        case 2: return { color: '#3498db', weight: 2, opacity: 0.8, dashArray: '8, 8' };
        case 1: return { color: '#95a5a6', weight: 1.5, opacity: 0.7, dashArray: '3, 12' };
        default: return { color: '#95a5a6', weight: 1, opacity: 0.6, dashArray: '3, 12' };
    }
}
const chainHighlightStyle = { color: '#9b59b6', weight: 4, opacity: 1, dashArray: null };

// --- MAP LAYERS AND DATA PARSING ---
const connectionLayer = L.layerGroup();
const locationData = {};
const chains = {};
const hotspotLayer = L.markerClusterGroup();
const focusGroup = L.featureGroup().addTo(map);
const countryLayer = L.geoJson(null, {
    style: (feature) => ({
        fillColor: getVolumeColor(feature.properties.avgNewsVolume),
        weight: 1, color: 'white', dashArray: '3', fillOpacity: 0.55
    }),
    onEachFeature: (feature, layer) => {
        layer.on('click', (e) => {
            map.fitBounds(layer.getBounds());
            displayCountryNews(feature.properties.name);
        });
        layer.bindTooltip(`<strong>${feature.properties.name}</strong><br>Avg. News Volume: ${feature.properties.avgNewsVolume.toFixed(1)}`);
    }
}).addTo(map);

// First pass: store all location data and calculate country averages
Object.entries(eventData).forEach(([country, locations]) => {
    let totalVolume = 0;
    locations.forEach(loc => {
        locationData[loc.name] = { ...loc, country };
        totalVolume += loc.newsVolume;
    });
    const avgVolume = totalVolume / locations.length;
    const countryFeature = countryPolygons.features.find(f => f.properties.name === country);
    if (countryFeature) {
        countryFeature.properties.avgNewsVolume = avgVolume;
        countryLayer.addData(countryFeature);
    }
});

// Second pass: create hotspots (but don't add to map yet)
Object.values(locationData).forEach(loc => {
    const relevantChainIds = [];
    if (loc.connections) {
        loc.connections.forEach(conn => {
            const chainId = conn.chainId || `${loc.name}-${conn.target}`;
            if (!chains[chainId]) {
                chains[chainId] = { locations: new Set(), connections: [] };
            }
            chains[chainId].locations.add(loc.name);
            chains[chainId].locations.add(conn.target);
            chains[chainId].connections.push({ from: loc.name, to: conn.target, strength: conn.strength });
            if(!relevantChainIds.includes(chainId)) relevantChainIds.push(chainId);
        });
    }
    
    const hotspot = L.circleMarker([loc.lat, loc.lng], {
        fillColor: getVolumeColor(loc.newsVolume), radius: getVolumeRadius(loc.newsVolume),
        color: '#1a202c', weight: 1.5, fillOpacity: 0.8, title: loc.name
    });

    let popupContent = `<h4>${loc.name}</h4><p>${loc.event}</p><div id="popup-actions-${loc.name.replace(/\s+/g, '')}">`;
    if (relevantChainIds.length > 0) {
        popupContent += `<button class="popup-btn show-connections-btn" onclick="showConnections('${relevantChainIds[0]}', '${loc.name.replace(/\s+/g, '')}')">Show Connections</button>`;
    }
    popupContent += `</div>`;

    hotspot.bindPopup(popupContent);
    hotspotLayer.addLayer(hotspot);
});

// --- ZOOM-BASED LAYER VISIBILITY ---
function updateLayers() {
    const zoom = map.getZoom();
    if (zoom >= 6) {
        if (!map.hasLayer(hotspotLayer)) {
            map.addLayer(hotspotLayer);
            map.removeLayer(countryLayer);
        }
    } else {
        if (map.hasLayer(hotspotLayer)) {
            map.removeLayer(hotspotLayer);
            map.addLayer(countryLayer);
        }
    }
}
map.on('zoomend', updateLayers);
updateLayers(); // Initial check

// --- ANALYSIS PANEL & AI LOGIC ---
const analysisPanel = document.getElementById('analysis-panel');
const panelBody = document.getElementById('panel-body');
const panelTitle = document.getElementById('panel-title');
const followUpSection = document.getElementById('follow-up-section');

function openAnalysisPanel() {
    analysisPanel.classList.add('visible');
    mapContainer.classList.add('panel-visible');
    setTimeout(() => map.invalidateSize(), 500);
}
function closeAnalysisPanel() {
    analysisPanel.classList.remove('visible');
    mapContainer.classList.remove('panel-visible');
    setTimeout(() => map.invalidateSize(), 500);
}

function displayCountryNews(countryName) {
    const countryEvents = Object.values(locationData).filter(loc => loc.country === countryName);
    panelTitle.innerText = `Recent Events in ${countryName}`;
    
    let content = '';
    if (countryEvents.length > 0) {
        countryEvents.forEach(loc => {
            content += `
                <div class="country-news-item">
                    <h5>${loc.name}</h5>
                    <p>${loc.event}</p>
                </div>
            `;
        });
    } else {
        content = '<p>No specific events on file for this country.</p>';
    }
    panelBody.innerHTML = content;
    followUpSection.style.display = 'none';
    openAnalysisPanel();
}

window.showConnections = function(chainId, locId) {
    // This function would be built out to show connections
}

window.triggerChainAnalysis = async function(chainId) {
    // This function would be built out for AI analysis
}

// --- INITIALIZE PLUGINS ---
const minimapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { minZoom: 0, maxZoom: 13 });
new L.Control.MiniMap(minimapLayer, { toggleDisplay: true, position: 'bottomleft' }).addTo(map);
L.control.measure({ position: 'topleft', primaryLengthUnit: 'kilometers', secondaryLengthUnit: 'miles' }).addTo(map);
