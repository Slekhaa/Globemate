/* ========================================
   GlobeMate — Maps Module
   ======================================== */

const MapExplorer = (() => {
  let map = null;
  let markers = [];
  let savedPlaces = loadFromLocal('savedPlaces') || [];

  function init() {
    try {
      // Check if map container exists
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }

      // Check if Leaflet is loaded
      if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        showToast('Map library not loaded. Please refresh.', 'error');
        return;
      }

      // Initialize Leaflet map
      map = L.map('map').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        noWrap: true,
        bounds: [[-85, -180], [85, 180]]
      }).addTo(map);
      map.setMaxBounds([[-85, -180], [85, 180]]);
      map.options.maxBoundsViscosity = 1.0;

      // Map click to add marker with location details
      map.on('click', async (e) => {
        await addMarkerWithLocation(e.latlng.lat, e.latlng.lng);
      });

      // Search
      const searchBtn = $('#mapSearchBtn');
      const searchInput = $('#mapSearch');
      const locateBtn = $('#locateMeBtn');
      const clearBtn = $('#clearMarkersBtn');
      
      if (searchBtn) searchBtn.addEventListener('click', searchLocation);
      if (searchInput) searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchLocation();
      });
      if (locateBtn) locateBtn.addEventListener('click', locateMe);
      if (clearBtn) clearBtn.addEventListener('click', clearMarkers);

      renderSavedPlaces();
    } catch (error) {
      console.error('MapExplorer initialization error:', error);
      showToast('Map failed to load. Please refresh the page.', 'error');
    }
  }

  function addMarker(lat, lng, name, locationDetails = null) {
    if (!map) return;
    
    const marker = L.marker([lat, lng]).addTo(map);
    
    let popupContent = `
      <div style="min-width:200px;">
        <strong style="font-size:14px;color:#1e293b;">${name}</strong><br>`;
    
    if (locationDetails) {
      if (locationDetails.city) {
        popupContent += `<small style="color:#64748b;"><i class="fas fa-city"></i> ${locationDetails.city}</small><br>`;
      }
      if (locationDetails.country) {
        popupContent += `<small style="color:#64748b;"><i class="fas fa-flag"></i> ${locationDetails.country}</small><br>`;
      }
      popupContent += `<small style="color:#94a3b8;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</small><br>`;
    } else {
      popupContent += `<small style="color:#94a3b8;">${lat.toFixed(4)}, ${lng.toFixed(4)}</small><br>`;
    }
    
    const displayName = locationDetails ? 
      `${locationDetails.city ? locationDetails.city + ', ' : ''}${locationDetails.country || name}` : 
      name;
    
    popupContent += `
        <button onclick="MapExplorer.savePlace(${lat}, ${lng}, '${displayName.replace(/'/g, "\\'")}', ${JSON.stringify(locationDetails).replace(/'/g, "\\'").replace(/"/g, '&quot;')})"
          style="margin-top:10px;padding:6px 14px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s;">
          <i class="fas fa-star"></i> Save Place
        </button>
      </div>
    `;
    
    marker.bindPopup(popupContent).openPopup();
    markers.push(marker);
  }

  async function addMarkerWithLocation(lat, lng) {
    try {
      // Show loading marker first
      const tempMarker = L.marker([lat, lng]).addTo(map);
      tempMarker.bindPopup('<div style="padding:10px;"><i class="fas fa-spinner fa-spin"></i> Getting location...</div>').openPopup();
      markers.push(tempMarker);
      
      // Reverse geocode to get location details
      const locationDetails = await reverseGeocode(lat, lng);
      
      // Remove temp marker
      map.removeLayer(tempMarker);
      markers = markers.filter(m => m !== tempMarker);
      
      // Add proper marker with details
      const name = locationDetails ? locationDetails.name || 'Dropped Pin' : 'Dropped Pin';
      addMarker(lat, lng, name, locationDetails);
      
    } catch (error) {
      console.error('Error getting location details:', error);
      addMarker(lat, lng, 'Dropped Pin');
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        return {
          name: data.name || addr.road || addr.suburb || addr.neighbourhood || 'Location',
          city: addr.city || addr.town || addr.village || addr.municipality || addr.county,
          country: addr.country,
          state: addr.state,
          fullAddress: data.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async function searchLocation() {
    const searchInput = $('#mapSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const results = await res.json();

      const resultsContainer = $('#mapSearchResults');
      if (!resultsContainer) return;
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">No results found</p>';
        return;
      }

      resultsContainer.innerHTML = results.map(r => {
        const addr = r.address || {};
        const city = addr.city || addr.town || addr.village || '';
        const country = addr.country || '';
        const locationDetails = {
          name: r.display_name.split(',')[0],
          city: city,
          country: country,
          fullAddress: r.display_name
        };
        
        return `
          <div class="map-result-item" onclick='MapExplorer.goToLocation(${r.lat}, ${r.lon}, "${r.display_name.split(',')[0].replace(/"/g, '\\"')}", ${JSON.stringify(locationDetails).replace(/'/g, "\\'").replace(/"/g, '&quot;')})'>
            <i class="fas fa-map-marker-alt"></i>
            <div style="flex:1;">
              <span style="display:block;font-weight:500;">${r.display_name.split(',')[0]}</span>
              ${city || country ? `<small style="display:block;color:#94a3b8;font-size:0.75rem;">${city}${city && country ? ', ' : ''}${country}</small>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Search error:', err);
      showToast('Search failed. Please try again.', 'error');
    }
  }

  function goToLocation(lat, lng, name, locationDetails = null) {
    if (!map) return;
    map.setView([lat, lng], 13);
    addMarker(lat, lng, name, locationDetails);
    const resultsContainer = $('#mapSearchResults');
    if (resultsContainer) resultsContainer.innerHTML = '';
  }

  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    showToast('Getting your location...', 'success');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (map) map.setView([latitude, longitude], 13);
        await addMarkerWithLocation(latitude, longitude);
        showToast('Location found!');
      },
      () => showToast('Unable to retrieve your location', 'error')
    );
  }

  function clearMarkers() {
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const resultsContainer = $('#mapSearchResults');
    if (resultsContainer) resultsContainer.innerHTML = '';
    showToast('All markers cleared');
  }

  function savePlace(lat, lng, name, locationDetails = null) {
    if (savedPlaces.find(p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001)) {
      showToast('Place already saved', 'warning');
      return;
    }
    savedPlaces.push({ 
      lat, 
      lng, 
      name, 
      locationDetails,
      id: Date.now() 
    });
    saveToLocal('savedPlaces', savedPlaces);
    renderSavedPlaces();
    showToast(`${name} saved successfully!`);
  }

  function renderSavedPlaces() {
    const container = $('#savedPlaces');
    if (!container) return;
    
    if (savedPlaces.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">Click on map to save places</p>';
      return;
    }

    container.innerHTML = savedPlaces.map(p => {
      const locationInfo = p.locationDetails ? 
        `<small style="display:block;color:#94a3b8;font-size:0.75rem;margin-top:2px;">${p.locationDetails.city || ''}</small>` : 
        '';
      
      return `
        <div class="saved-place-item" onclick="MapExplorer.goToLocation(${p.lat}, ${p.lng}, '${p.name.replace(/'/g, "\\'")}', ${JSON.stringify(p.locationDetails || null).replace(/'/g, "\\'").replace(/"/g, '&quot;')})">
          <i class="fas fa-star"></i>
          <div style="flex:1;">
            <span style="display:block;">${p.name}</span>
            ${locationInfo}
          </div>
          <button onclick="event.stopPropagation(); MapExplorer.deleteSavedPlace(${p.id})" 
            style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;" 
            title="Delete">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  function deleteSavedPlace(id) {
    savedPlaces = savedPlaces.filter(p => p.id !== id);
    saveToLocal('savedPlaces', savedPlaces);
    renderSavedPlaces();
    showToast('Place removed');
  }

  function cleanup() {
    // Clean up map when leaving page
    if (map) {
      map.remove();
      map = null;
      markers = [];
    }
  }

  return { init, goToLocation, savePlace, deleteSavedPlace, cleanup, get _map() { return map; } };
})();

// Expose to global scope
if (typeof window !== 'undefined') {
  window.MapExplorer = MapExplorer;
}

// Register with PageLoader
if (typeof PageLoader !== 'undefined') {
  PageLoader.registerModule('maps', MapExplorer);
} else {
  // Auto-initialize if PageLoader not available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MapExplorer.init());
  } else {
    MapExplorer.init();
  }
}
