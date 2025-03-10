// Get your free API key from https://openweathermap.org/api
const API_KEY = ''; // Replace with your actual OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
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

// Event listeners
searchButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

// Format date function
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Get weather data from OpenWeatherMap API
async function getWeatherData(city) {
    try {
        // Get current weather data
        const currentWeatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Display current weather
        displayCurrentWeather(currentWeatherData);
        
        // Get 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        // Display forecast
        displayForecast(forecastData);
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Display current weather data
function displayCurrentWeather(data) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, feels_like, humidity: humid, pressure: press } = data.main;
    const { speed } = data.wind;
    
    cityName.textContent = name;
    currentDate.textContent = formatDate(data.dt);
    currentTemp.textContent = `${Math.round(temp)}°C`;
    currentDescription.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    currentIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    windSpeed.textContent = `${Math.round(speed * 3.6)} km/h`; // Convert m/s to km/h
    humidity.textContent = `${humid}%`;
    feelsLike.textContent = `${Math.round(feels_like)}°C`;
    pressure.textContent = `${press} hPa`;
    
    // Update background gradient based on temperature
    const hue = Math.min(200, Math.max(240 - temp * 2, 170));
    document.body.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${hue - 60}, 70%, 45%) 100%)`;
}

// Display 5-day forecast
function displayForecast(data) {
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
    
    // Create forecast cards (limit to 5 days)
    Object.values(dailyData).slice(0, 4).forEach(day => {
        const { icon, description } = day.weather[0];
        const { temp } = day.main;
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        card.innerHTML = `
            <p class="date">${formatDate(day.dt)}</p>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <p class="temp">${Math.round(temp)}°C</p>
            <p>${description.charAt(0).toUpperCase() + description.slice(1)}</p>
        `;
        
        forecastContainer.appendChild(card);
    });
}

// Default city on load
window.addEventListener('load', () => {
    getWeatherData('London');
});
