/**
 * Main application file for the Weather Dashboard
 */

// DOM elements for event handlers
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const themeToggle = document.getElementById('theme-toggle');
const searchSuggestions = document.getElementById('search-suggestions');

// Additional DOM elements
const refreshBtn = document.getElementById('refresh-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const favoritesPanel = document.getElementById('favorites-panel');
const closeFavoritesBtn = document.getElementById('close-favorites');
const favoritesList = document.getElementById('favorites-list');
const forecastUnits = document.getElementById('forecast-units');
const mapLayer = document.getElementById('map-layer');
const locationResults = document.getElementById('location-results');
const locationResultsList = document.getElementById('location-results-list');
const closeLocationResults = document.getElementById('close-location-results');

// Popular cities for suggestions
const popularCities = [
    'New York', 'London', 'Tokyo', 'Paris', 'Sydney', 
    'Berlin', 'Moscow', 'Dubai', 'Singapore', 'Barcelona',
    'Mumbai', 'Cairo', 'Rio de Janeiro', 'Toronto', 'Seoul'
];

// Event listeners
searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (query) {
        hideSearchSuggestions();
        hideLocationResults();
        
        if (query.length >= 3) {
            const locations = await searchLocations(query);
            if (locations.length === 1) {
                // If only one result, use it directly
                const location = locations[0];
                getWeatherByGeoLocation(location.lat, location.lon, formatLocationName(location));
            } else if (locations.length > 1) {
                // If multiple results, show them for selection
                displayLocationResults(locations, query);
            } else {
                // No results - fall back to normal search
                getWeatherData(query);
            }
        } else {
            // Default to normal search for short queries
            getWeatherData(query);
        }
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
            hideSearchSuggestions();
        }
    }
});

searchInput.addEventListener('input', debounce(async function() {
    const query = this.value.trim().toLowerCase();
    
    if (query.length >= 3) {
        // First show quick popular city suggestions
        showSearchSuggestions(query);
        
        // Then fetch and display actual city results from API
        const locations = await searchLocations(query);
        if (locations.length > 0) {
            displayLocationResults(locations, query);
            // Hide the suggestions when showing location results
            searchSuggestions.classList.add('hide-for-results');
        } else {
            hideLocationResults();
        }
    } else {
        if (query.length >= 2) {
            // Just show quick suggestions for 2 characters
            showSearchSuggestions(query);
        } else {
            // Hide everything for 1 or 0 characters
            hideSearchSuggestions();
        }
        hideLocationResults();
    }
}, 300));

searchInput.addEventListener('focus', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length >= 2) {
        showSearchSuggestions(query);
    }
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
        hideSearchSuggestions();
    }
});

// Theme toggle functionality
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-theme');
    
    // Save preference to localStorage
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDarkTheme);
    
    // Update particles color if needed
    if (window.particleSystem) {
        window.particleSystem.updateTheme(isDarkTheme);
    }
});

// Event listener for refresh button
refreshBtn.addEventListener('click', () => {
    const city = searchInput.value.trim() || localStorage.getItem('lastCity') || 'London';
    refreshBtn.classList.add('refreshing');
    
    getWeatherData(city).finally(() => {
        setTimeout(() => {
            refreshBtn.classList.remove('refreshing');
        }, 1000);
    });
});

// Event listeners for favorites
favoriteBtn.addEventListener('click', toggleFavorite);
closeFavoritesBtn.addEventListener('click', toggleFavoritesPanel);

// Event listener for units change
forecastUnits.addEventListener('change', () => {
    const city = searchInput.value.trim() || localStorage.getItem('lastCity') || 'London';
    const units = forecastUnits.value;
    
    localStorage.setItem('units', units);
    getWeatherData(city, units);
});

// Event listener for map layer change
mapLayer.addEventListener('change', () => {
    const lat = localStorage.getItem('lastLat');
    const lon = localStorage.getItem('lastLon');
    const city = localStorage.getItem('lastCity');
    
    if (lat && lon && city) {
        const layer = mapLayer.value;
        updateWeatherMap(lat, lon, city, layer);
    }
});

// Close location results
closeLocationResults.addEventListener('click', () => {
    hideLocationResults();
});

// Show search suggestions
function showSearchSuggestions(query) {
    // Filter cities based on query
    const filteredCities = popularCities.filter(city => 
        city.toLowerCase().includes(query)
    );
    
    if (filteredCities.length) {
        searchSuggestions.innerHTML = '';
        searchSuggestions.classList.add('active');
        
        filteredCities.forEach(city => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `<i class="fas fa-map-marker-alt"></i>${highlightMatch(city, query)}`;
            
            item.addEventListener('click', () => {
                searchInput.value = city;
                getWeatherData(city);
                hideSearchSuggestions();
            });
            
            searchSuggestions.appendChild(item);
        });
    } else {
        hideSearchSuggestions();
    }
}

// Hide search suggestions
function hideSearchSuggestions() {
    searchSuggestions.classList.remove('active');
}

// Function to toggle favorite status
function toggleFavorite() {
    const cityName = document.getElementById('city-name').textContent;
    const currentTemp = document.getElementById('current-temp').textContent;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    const isFavorite = favorites.some(fav => fav.name === cityName);
    
    if (isFavorite) {
        // Remove from favorites
        const newFavorites = favorites.filter(fav => fav.name !== cityName);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        favoriteBtn.classList.remove('active');
        favoriteBtn.querySelector('i').className = 'far fa-heart';
        
        // Show removal notification
        showNotification(`${cityName} removed from favorites`, 'info');
    } else {
        // Add to favorites
        const weather = {
            name: cityName,
            temp: currentTemp,
            date: new Date().toISOString()
        };
        favorites.push(weather);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        favoriteBtn.classList.add('active');
        favoriteBtn.querySelector('i').className = 'fas fa-heart';
        
        // Show success notification
        showNotification(`${cityName} added to favorites`, 'success');
    }
    
    // Update favorites list if panel is open
    if (favoritesPanel.classList.contains('active')) {
        renderFavorites();
    }
}

// Function to toggle favorites panel
function toggleFavoritesPanel() {
    favoritesPanel.classList.toggle('active');
    
    // Create or toggle overlay
    let overlay = document.querySelector('.panel-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'panel-overlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
            favoritesPanel.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    if (favoritesPanel.classList.contains('active')) {
        overlay.classList.add('active');
        renderFavorites();
    } else {
        overlay.classList.remove('active');
    }
}

// Render the favorites list
function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-favorites">
                <i class="far fa-heart"></i>
                <p>No favorite locations yet.<br>Click the heart icon to save locations.</p>
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = '';
    favorites.forEach(favorite => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        
        const formattedDate = new Date(favorite.date).toLocaleDateString();
        
        item.innerHTML = `
            <div class="favorite-item-info">
                <h4>${favorite.name}</h4>
                <p>Saved on ${formattedDate}</p>
            </div>
            <div class="favorite-item-temp">${favorite.temp}</div>
        `;
        
        item.addEventListener('click', () => {
            getWeatherData(favorite.name);
            toggleFavoritesPanel();
        });
        
        favoritesList.appendChild(item);
    });
}

// Update favorite button state
function updateFavoriteButton(cityName) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.some(fav => fav.name === cityName);
    
    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.querySelector('i').className = 'fas fa-heart';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.querySelector('i').className = 'far fa-heart';
    }
}

// Initialize the app
function initializeApp() {
    console.log('Weather Dashboard initialized');
    
    // Apply saved theme preference or use system preference
    if (localStorage.getItem('darkTheme') === 'true' || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
         localStorage.getItem('darkTheme') === null)) {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
        
        // Update particles if they exist
        if (window.particleSystem) {
            window.particleSystem.updateTheme(true);
        }
    }
    
    // Apply saved units preference
    const savedUnits = localStorage.getItem('units') || 'metric';
    if (forecastUnits) {
        forecastUnits.value = savedUnits;
    }
    
    // Set up auto-detection by geolocation or IP
    if (navigator.geolocation && !localStorage.getItem('lastCity')) {
        showNotification('Detecting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            position => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.log('Geolocation error:', error);
                showNotification('Location access denied. Using default city.', 'error');
                
                // Fall back to default or saved city
                const savedCity = localStorage.getItem('lastCity') || 'London';
                getWeatherData(savedCity, savedUnits);
            },
            { timeout: 10000 } // 10 seconds timeout
        );
    } else {
        // Load saved city or default
        const savedCity = localStorage.getItem('lastCity') || 'London';
        getWeatherData(savedCity, savedUnits);
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', e => {
        // Ctrl+K or Cmd+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape key to close panels
        if (e.key === 'Escape') {
            if (favoritesPanel.classList.contains('active')) {
                toggleFavoritesPanel();
            }
        }
    });
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        document.getElementById('loading-indicator').style.display = 'flex';
        
        // Get location name from coordinates
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Unable to get location');
        }
        
        const data = await response.json();
        const city = data.name;
        
        // Update search field
        searchInput.value = city;
        
        // Get complete weather data using the enhanced function
        getWeatherByGeoLocation(lat, lon, city);
        
    } catch (error) {
        document.getElementById('loading-indicator').style.display = 'none';
        showNotification(error.message, 'error');
        
        // Fall back to default city
        getWeatherData('London');
    }
}

// Format location name
function formatLocationName(location) {
    let name = location.name || '';
    
    if (location.state) {
        name += `, ${location.state}`;
    }
    
    if (location.country) {
        name += `, ${location.country}`;
    }
    
    return name;
}

// Display location search results
function displayLocationResults(locations, query) {
    locationResultsList.innerHTML = '';
    
    if (locations.length === 0) {
        locationResultsList.innerHTML = `
            <div class="empty-locations">
                <i class="fas fa-map-marker-slash"></i>
                <p>No locations found for "${query}"</p>
            </div>
        `;
    } else {
        locations.forEach(location => {
            const item = document.createElement('div');
            item.className = 'location-item';
            
            // Format location display with state and country if available
            const cityName = location.name || '';
            const country = location.country || '';
            
            // Get state or province name for display
            let state = '';
            if (location.state) {
                state = location.state;
            }
            
            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div class="location-item-content">
                    <h4>${cityName}</h4>
                    <p>${state ? state + ', ' : ''}${country}</p>
                </div>
            `;
            
            // Add click handler to select this location
            item.addEventListener('click', () => {
                getWeatherByGeoLocation(location.lat, location.lon, formatLocationName(location));
                hideLocationResults();
            });
            
            locationResultsList.appendChild(item);
        });
    }
    
    // Show the results container
    locationResults.classList.add('active');
}

// Hide location results
function hideLocationResults() {
    locationResults.classList.remove('active');
    searchSuggestions.classList.remove('hide-for-results');
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
