// --- MAP INITIALIZATION ---
const map = L.map('map', { center: [30, 45], zoom: 5 });
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap, © CARTO', maxZoom: 20 }).addTo(map);

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
