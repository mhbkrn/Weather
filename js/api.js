/**
 * API handling for OpenWeatherMap
 */

// API configuration
const API_KEY = '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache weather data to reduce unnecessary API calls
let weatherCache = {};
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Check if we have cached data for this city and unit
function getCachedWeatherData(city, units) {
    const cacheKey = `${city.toLowerCase()}-${units}`;
    const cachedData = weatherCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TIME)) {
        console.log('Using cached weather data');
        return cachedData.data;
    }
    
    return null;
}

// Store weather data in cache
function cacheWeatherData(city, units, data) {
    const cacheKey = `${city.toLowerCase()}-${units}`;
    weatherCache[cacheKey] = {
        data: data,
        timestamp: Date.now()
    };
}

// Get weather data with caching
async function getWeatherData(city, units = 'metric') {
    try {
        // Check cache first
        const cachedData = getCachedWeatherData(city, units);
        if (cachedData) {
            // Display cached data
            displayCurrentWeather(cachedData.current, cachedData.oneCall, units);
            displayForecast(cachedData.forecast, units);
            
            if (cachedData.oneCall && cachedData.oneCall.hourly) {
                displayHourlyForecast(cachedData.oneCall.hourly, units);
            }
            
            displayWeatherAlerts(cachedData.oneCall?.alerts);
            updateFavoriteButton(city);
            
            return cachedData;
        }
        
        // Show loading indicator
        document.getElementById('loading-indicator').style.display = 'flex';
        
        // Get current weather data
        const currentWeatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
        
        if (!currentWeatherResponse.ok) {
            throw new Error(currentWeatherResponse.status === 404 
                ? `City "${city}" not found. Please check the spelling and try again.` 
                : 'Unable to fetch weather data at this time.');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Get one call API for more detailed data
        const { lat, lon } = currentWeatherData.coord;
        const oneCallResponse = await fetch(`${BASE_URL}/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely&appid=${API_KEY}`);
        const oneCallData = await oneCallResponse.json();
        
        // Get 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
        // Save last searched city and coordinates
        localStorage.setItem('lastCity', city);
        localStorage.setItem('lastLat', lat);
        localStorage.setItem('lastLon', lon);
        
        // Update particles system based on weather condition
        updateWeatherBackground(currentWeatherData.weather[0].id);
        
        // Update favorite button state
        updateFavoriteButton(city);
        
        // Display weather data
        displayCurrentWeather(currentWeatherData, oneCallData, units);
        displayForecast(forecastData, units);
        
        // Display hourly forecast
        if (oneCallData && oneCallData.hourly) {
            displayHourlyForecast(oneCallData.hourly, units);
        }
        
        // Check and display alerts
        displayWeatherAlerts(oneCallData.alerts);
        
        // Update map if available
        const mapLayerType = document.getElementById('map-layer')?.value || 'temperature';
        if (typeof updateWeatherMap === 'function') {
            updateWeatherMap(lat, lon, city, mapLayerType);
        }
        
        // Cache the results
        const results = {
            current: currentWeatherData,
            oneCall: oneCallData,
            forecast: forecastData
        };
        
        cacheWeatherData(city, units, results);
        
        return results;
        
    } catch (error) {
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
        // Show error with toast notification
        showNotification(error.message, 'error');
        console.error('Weather API error:', error);
        return null;
    }
}

// Search for locations by name using geocoding API
async function searchLocations(query) {
    try {
        // Use geocoding API to find locations
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Unable to search for locations');
        }
        
        const locations = await response.json();
        return locations;
    } catch (error) {
        console.error('Location search error:', error);
        return [];
    }
}

// Get weather data by coordinates with location name
async function getWeatherByGeoLocation(lat, lon, locationName) {
    try {
        document.getElementById('loading-indicator').style.display = 'flex';
        
        // Use existing functionality but with coordinates
        const units = localStorage.getItem('units') || 'metric';
        
        // Get current weather data
        const currentWeatherResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Unable to fetch weather data for this location');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Get one call API for more detailed data
        const oneCallResponse = await fetch(`${BASE_URL}/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely&appid=${API_KEY}`);
        const oneCallData = await oneCallResponse.json();
        
        // Get 5-day forecast - using the nearest city from coordinates
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        // Hide loading indicator
        document.getElementById('loading-indicator').style.display = 'none';
        
        // Save last searched location
        const displayName = locationName || currentWeatherData.name;
        localStorage.setItem('lastCity', displayName);
        localStorage.setItem('lastLat', lat);
        localStorage.setItem('lastLon', lon);
        
        // Update search input with the proper name
        if (document.getElementById('search-input')) {
            document.getElementById('search-input').value = displayName;
        }
        
        // Update particles system based on weather condition
        updateWeatherBackground(currentWeatherData.weather[0].id);
        
        // Update favorite button state
        updateFavoriteButton(displayName);
        
        // Display weather data
        displayCurrentWeather(currentWeatherData, oneCallData, units);
        displayForecast(forecastData, units);
        
        if (oneCallData && oneCallData.hourly) {
            displayHourlyForecast(oneCallData.hourly, units);
        }
        
        displayWeatherAlerts(oneCallData.alerts);
        
        const mapLayerType = document.getElementById('map-layer')?.value || 'temperature';
        if (typeof updateWeatherMap === 'function') {
            updateWeatherMap(lat, lon, displayName, mapLayerType);
        }
        
        // Cache the results
        const results = {
            current: currentWeatherData,
            oneCall: oneCallData,
            forecast: forecastData
        };
        
        return results;
        
    } catch (error) {
        document.getElementById('loading-indicator').style.display = 'none';
        showNotification(error.message, 'error');
        console.error('Weather API error:', error);
        return null;
    }
}

// Update the particle system based on weather condition
function updateWeatherBackground(weatherCode) {
    let weatherType = 'clear';
    
    if (weatherCode === 800) {
        weatherType = 'clear';
    } else if (weatherCode >= 801 && weatherCode <= 804) {
        weatherType = 'clouds';
    } else if ((weatherCode >= 500 && weatherCode <= 531) || (weatherCode >= 300 && weatherCode <= 321)) {
        weatherType = 'rain';
    } else if (weatherCode >= 600 && weatherCode <= 622) {
        weatherType = 'snow';
    } else if (weatherCode >= 200 && weatherCode <= 232) {
        weatherType = 'thunderstorm';
    }
    
    // Update particle system if it exists
    if (window.particleSystem) {
        window.particleSystem.setWeatherType(weatherType);
    }
}

// Show toast notification
function showNotification(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
        
        // Add styles dynamically
        const style = document.createElement('style');
        style.textContent = `
            #toast-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--background-light);
                color: var(--text-primary);
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 80%;
                opacity: 0;
                transition: opacity 0.3s, bottom 0.3s;
            }
            #toast-notification.visible {
                opacity: 1;
                bottom: 30px;
            }
            #toast-notification.info i { color: var(--primary-color); }
            #toast-notification.error i { color: var(--danger-color); }
            #toast-notification.success i { color: var(--accent-color); }
        `;
        document.head.appendChild(style);
    }
    
    // Set content and style based on type
    let icon;
    switch (type) {
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'success':
            icon = 'fa-check-circle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    toast.className = type;
    
    // Show the toast
    setTimeout(() => toast.classList.add('visible'), 100);
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 5000);
}

// Display weather alerts if present
function displayWeatherAlerts(alerts) {
    const alertElement = document.getElementById('weather-alert');
    const alertMessage = document.getElementById('alert-message');
    
    if (!alertElement || !alertMessage) return;
    
    if (alerts && alerts.length > 0) {
        // Show the first alert
        const alert = alerts[0];
        
        // Format the alert description to be more concise
        let description = alert.description;
        if (description.length > 100) {
            description = description.substring(0, 100) + '...';
        }
        
        alertMessage.innerHTML = `
            <strong>${alert.event}</strong>: ${description}
            ${alerts.length > 1 ? `<br><small>(+${alerts.length - 1} more alerts)</small>` : ''}
        `;
        
        alertElement.style.display = 'flex';
        
        // Allow alert to be dismissed
        alertElement.onclick = () => {
            alertElement.style.display = 'none';
        };
    } else {
        alertElement.style.display = 'none';
    }
}
