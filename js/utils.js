/**
 * Utility functions for the Weather Dashboard
 */

// Format date function
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time function
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Get weather condition background
function getWeatherBackground(temp, weatherCode, isDayTime = true) {
    // Weather conditions are mapped to their codes
    // Clear: 800, Clouds: 801-804, Rain: 500-531, etc.
    
    // Night mode colors are darker
    const timePrefix = isDayTime ? '' : 'night-';
    
    if (weatherCode === 800) {
        // Clear sky
        if (isDayTime) {
            return temp > 20 
                ? 'linear-gradient(165deg, #4facfe 0%, #00f2fe 100%)' 
                : 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
        } else {
            return 'linear-gradient(135deg, #0c2b4d 0%, #173559 100%)';
        }
    } else if (weatherCode >= 801 && weatherCode <= 804) {
        // Clouds
        return isDayTime
            ? 'linear-gradient(135deg, #E0E0E0 0%, #8E9EAB 100%)' 
            : 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    } else if ((weatherCode >= 500 && weatherCode <= 531) || (weatherCode >= 300 && weatherCode <= 321)) {
        // Rain or drizzle
        return isDayTime
            ? 'linear-gradient(135deg, #616161 0%, #9bc5c3 100%)'
            : 'linear-gradient(135deg, #252525 0%, #4a5859 100%)';
    } else if (weatherCode >= 600 && weatherCode <= 622) {
        // Snow
        return isDayTime
            ? 'linear-gradient(135deg, #E3FDF5 0%, #FFE6FA 100%)'
            : 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)';
    } else if (weatherCode >= 200 && weatherCode <= 232) {
        // Thunderstorm
        return 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';
    } else {
        // Default/Other
        return isDayTime
            ? 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)'
            : 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    }
}

// Create animated number counter
function animateCounter(element, targetValue, suffix = '') {
    const duration = 1000; // ms
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            // Use easeOutExpo for smoother animation
            const easeProgress = 1 - Math.pow(2, -10 * progress);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
            element.textContent = `${currentValue}${suffix}`;
            requestAnimationFrame(update);
        } else {
            element.textContent = `${targetValue}${suffix}`;
        }
    }
    
    requestAnimationFrame(update);
}

// Add CSS to highlight matched text in search results
function highlightMatch(text, query) {
    // Escape special regex characters in the query
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Convert temperature between units
function convertTemperature(temp, fromUnit = 'metric', toUnit = 'imperial') {
    if (fromUnit === toUnit) return temp;
    
    if (fromUnit === 'metric' && toUnit === 'imperial') {
        // Celsius to Fahrenheit
        return (temp * 9/5) + 32;
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        // Fahrenheit to Celsius
        return (temp - 32) * 5/9;
    }
    
    return temp; // Default fallback
}

// Format percentage
function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}

// Format wind direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Get time of day based on sunrise/sunset
function getTimeOfDay(currentTime, sunriseTime, sunsetTime) {
    if (currentTime < sunriseTime) return 'night';
    if (currentTime > sunsetTime) return 'night';
    
    // Calculate how far through the day we are
    const dayLength = sunsetTime - sunriseTime;
    const timeIntoDayNormalized = (currentTime - sunriseTime) / dayLength;
    
    if (timeIntoDayNormalized < 0.25) return 'morning';
    if (timeIntoDayNormalized > 0.75) return 'evening';
    return 'day';
}

// Get human-readable weather description
function getWeatherDescription(weatherId, temp, windSpeed, timeOfDay) {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    
    let baseDescription;
    
    if (weatherId === 800) {
        if (timeOfDay === 'night') return 'Clear night sky';
        return 'Sunny clear sky';
    } else if (weatherId >= 200 && weatherId < 300) {
        baseDescription = 'Thunderstorm';
    } else if (weatherId >= 300 && weatherId < 400) {
        baseDescription = 'Drizzle';
    } else if (weatherId >= 500 && weatherId < 600) {
        baseDescription = 'Rain';
    } else if (weatherId >= 600 && weatherId < 700) {
        baseDescription = 'Snow';
    } else if (weatherId >= 700 && weatherId < 800) {
        if (weatherId === 701) return 'Misty conditions';
        if (weatherId === 711) return 'Smoky air';
        if (weatherId === 721) return 'Hazy sunshine';
        if (weatherId === 731 || weatherId === 751) return 'Dusty conditions';
        if (weatherId === 741) return 'Foggy conditions';
        if (weatherId === 761 || weatherId === 762) return 'Dusty air';
        if (weatherId === 771) return 'Squally weather';
        if (weatherId === 781) return 'Tornado warning';
        return 'Atmospheric conditions';
    } else if (weatherId > 800 && weatherId < 900) {
        if (weatherId === 801) return 'Partly cloudy';
        if (weatherId === 802) return 'Scattered clouds';
        if (weatherId === 803) return 'Broken clouds';
        if (weatherId === 804) return 'Overcast clouds';
        return 'Cloudy conditions';
    }
    
    // Add temperature context
    let tempContext = '';
    if (temp < 0) {
        tempContext = ' with freezing temperatures';
    } else if (temp < 10) {
        tempContext = ' with cold temperatures';
    } else if (temp > 30) {
        tempContext = ' with hot temperatures';
    } else if (temp > 20) {
        tempContext = ' with warm temperatures';
    }
    
    // Add wind context
    let windContext = '';
    if (windSpeed > 10) {
        windContext = ' and windy conditions';
    }
    
    return `${baseDescription}${tempContext}${windContext}`;
}

// Add custom CSS style for highlights
(function() {
    const style = document.createElement('style');
    style.textContent = `
        mark {
            background-color: rgba(66, 133, 244, 0.2);
            color: inherit;
            font-weight: bold;
            padding: 0;
        }
    `;
    document.head.appendChild(style);
})();
