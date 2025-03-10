/**
 * UI handling for the Weather Dashboard
 */

// DOM elements
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const currentDescription = document.getElementById('current-description');
const currentIcon = document.getElementById('current-icon');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feels-like');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');
const mapElement = document.getElementById('map');
const weatherHighlights = document.getElementById('weather-highlights');

// Display current weather data
function displayCurrentWeather(data, oneCallData, units = 'metric') {
    const { name } = data;
    const { icon, description, id: weatherCode } = data.weather[0];
    const { temp, feels_like, humidity: humid, pressure: press } = data.main;
    const { speed } = data.wind;
    
    // Update the title with unit indicator
    const unitSymbol = units === 'metric' ? '°C' : '°F';
    document.title = `${Math.round(temp)}${unitSymbol} | ${name} - WeatherScope`;
    
    // Update DOM elements with animated counters
    cityName.textContent = name;
    currentDate.textContent = formatDate(data.dt);
    animateCounter(currentTemp, Math.round(temp), unitSymbol);
    currentDescription.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    currentIcon.src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    
    // Convert speeds based on unit system
    const speedUnit = units === 'metric' ? ' km/h' : ' mph';
    const speedValue = units === 'metric' ? Math.round(speed * 3.6) : Math.round(speed * 2.237);
    animateCounter(windSpeed, speedValue, speedUnit);
    
    animateCounter(humidity, humid, '%');
    animateCounter(feelsLike, Math.round(feels_like), unitSymbol);
    animateCounter(pressure, press, ' hPa');
    
    // Update background gradient based on weather and time of day
    const isDayTime = isDay(data.dt, data.sys.sunrise, data.sys.sunset);
    const gradientStyle = getWeatherBackground(temp, weatherCode, isDayTime);
    document.querySelector('.background-gradient').style.background = gradientStyle;
    
    // Add weather highlights if oneCallData is available
    if (oneCallData) {
        displayWeatherHighlights(data, oneCallData, units);
    }
}

// Display weather highlights
function displayWeatherHighlights(currentData, oneCallData, units = 'metric') {
    if (!weatherHighlights) return;
    
    weatherHighlights.innerHTML = '';
    
    // Get data
    const { sunrise, sunset } = currentData.sys;
    const { uvi, dew_point } = oneCallData.current || {};
    const visibility = currentData.visibility;
    const { pop } = oneCallData.daily?.[0] || { pop: 0 };
    
    // Unit dependent value formatting
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const dewPoint = dew_point ? Math.round(dew_point) : null;
    const visibilityValue = visibility ? (units === 'metric' ? 
        `${(visibility / 1000).toFixed(1)} km` : 
        `${(visibility / 1609.34).toFixed(1)} mi`) : 'N/A';
    
    // Create highlight cards
    const highlights = [
        {
            title: 'UV Index',
            value: uvi ? `${uvi.toFixed(1)}` : 'N/A',
            icon: 'fa-sun',
            color: getUviColor(uvi)
        },
        {
            title: 'Sunrise',
            value: formatTime(sunrise),
            icon: 'fa-sunrise',
            color: '#FF9500'
        },
        {
            title: 'Sunset',
            value: formatTime(sunset),
            icon: 'fa-sunset',
            color: '#FF3B30'
        },
        {
            title: 'Visibility',
            value: visibilityValue,
            icon: 'fa-eye',
            color: '#5856D6'
        },
        {
            title: 'Dew Point',
            value: dewPoint ? `${dewPoint}${tempUnit}` : 'N/A',
            icon: 'fa-droplet',
            color: '#34C759'
        },
        {
            title: 'Precipitation',
            value: `${Math.round(pop * 100)}%`,
            icon: 'fa-cloud-rain',
            color: '#007AFF'
        }
    ];
    
    // Add each highlight to the DOM
    highlights.forEach(item => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        card.innerHTML = `
            <div class="stat-icon" style="background-color: ${item.color}20">
                <i class="fas ${item.icon}" style="color: ${item.color}"></i>
            </div>
            <div class="stat-content">
                <h4>${item.title}</h4>
                <p>${item.value}</p>
            </div>
        `;
        
        weatherHighlights.appendChild(card);
    });
}

// Get appropriate color for UV index
function getUviColor(uvi) {
    if (uvi >= 11) return '#CC0033';    // Extreme
    if (uvi >= 8) return '#FF0066';     // Very High
    if (uvi >= 6) return '#FF9500';     // High
    if (uvi >= 3) return '#FFCC00';     // Moderate
    return '#34C759';                  // Low
}

// Check if it's daytime at given location
function isDay(currentTime, sunriseTime, sunsetTime) {
    return currentTime > sunriseTime && currentTime < sunsetTime;
}

// Display 5-day forecast
function displayForecast(data, units = 'metric') {
    forecastContainer.innerHTML = '';
    
    // Group forecast data by day (taking readings at noon)
    const dailyData = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toDateString();
        const hour = date.getHours();
        
        // We use the reading around noon to represent the day
        if (hour >= 11 && hour <= 13 && !dailyData[day]) {
            dailyData[day] = item;
        }
    });
    
    // Unit settings
    const unitSymbol = units === 'metric' ? '°C' : '°F';
    const speedUnit = units === 'metric' ? 'km/h' : 'mph';
    const speedMultiplier = units === 'metric' ? 3.6 : 2.237; // Convert m/s to appropriate unit
    
    // Create forecast cards (limit to 5 days)
    Object.values(dailyData).slice(0, 4).forEach((day, index) => {
        const { icon, description } = day.weather[0];
        const { temp, humidity } = day.main;
        const { speed } = day.wind;
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.style.setProperty('--i', index); // For staggered animation
        
        card.innerHTML = `
            <p class="date">${formatDate(day.dt)}</p>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <p class="temp">${Math.round(temp)}${unitSymbol}</p>
            <p>${description.charAt(0).toUpperCase() + description.slice(1)}</p>
            <div class="forecast-details">
                <span><i class="fas fa-water"></i> ${humidity}%</span>
                <span><i class="fas fa-wind"></i> ${Math.round(speed * speedMultiplier)} ${speedUnit}</span>
            </div>
        `;
        
        forecastContainer.appendChild(card);
    });
}

// Display hourly forecast
function displayHourlyForecast(hourlyData, units = 'metric') {
    const hourlyContainer = document.getElementById('hourly-container');
    if (!hourlyContainer || !hourlyData) return;
    
    hourlyContainer.innerHTML = '';
    
    // Unit settings
    const unitSymbol = units === 'metric' ? '°C' : '°F';
    
    // Display next 24 hours of data (first 24 items)
    hourlyData.slice(0, 24).forEach((hour, index) => {
        const time = formatTime(hour.dt);
        const temp = Math.round(hour.temp);
        const { icon, description } = hour.weather[0];
        
        const hourCard = document.createElement('div');
        hourCard.className = 'hourly-item';
        hourCard.style.setProperty('--i', index); // For staggered animation if needed
        
        hourCard.innerHTML = `
            <p class="time">${time}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
            <p class="temp">${temp}${unitSymbol}</p>
            <p class="pop">${Math.round(hour.pop * 100)}%</p>
        `;
        
        hourlyContainer.appendChild(hourCard);
    });
}

// Update weather map
function updateWeatherMap(lat, lon, cityName, layer = 'temperature') {
    if (!mapElement) return;
    
    // Clear existing content
    mapElement.innerHTML = '';
    
    // Validate layer parameter
    const validLayers = ['temperature', 'precipitation', 'clouds', 'wind'];
    const selectedLayer = validLayers.includes(layer) ? layer : 'temperature';
    
    // Create iframe with OpenWeatherMap layer
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.title = `Weather map for ${cityName}`;
    iframe.src = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${selectedLayer}&lat=${lat}&lon=${lon}&zoom=10`;
    
    mapElement.appendChild(iframe);
    
    // Set the map layer selector if it exists
    const mapLayerSelect = document.getElementById('map-layer');
    if (mapLayerSelect) {
        mapLayerSelect.value = selectedLayer;
    }
}

// Apply ripple effect to buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.ripple');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});
