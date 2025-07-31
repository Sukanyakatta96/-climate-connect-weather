class WeatherApp {
    constructor() {
        this.API_KEY = 'DB6LQ9GQRNEEWZMJ58LYCAY77';
        this.BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/[location]/[date1]/[date2]?key=YOUR_API_KEY';
        this.currentTheme = localStorage.getItem('theme') || (new Date().getHours() >= 18 || new Date().getHours() < 6 ? 'dark' : 'light');
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.demoMode = true;
    }

    initializeElements() {
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        this.loading = document.getElementById('loading');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.themeToggle = document.getElementById('themeToggle');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.temperature = document.getElementById('temperature');
        this.location = document.getElementById('location');
        this.description = document.getElementById('description');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.visibility = document.getElementById('visibility');
        this.feelsLike = document.getElementById('feelsLike');
        this.forecastContainer = document.getElementById('forecastContainer');
        this.weatherModal = document.getElementById('weatherModal');
        this.closeModal = document.getElementById('closeModal');
        this.modalDate = document.getElementById('modalDate');
        this.modalWeatherIcon = document.getElementById('modalWeatherIcon');
        this.modalDescription = document.getElementById('modalDescription');
        this.modalTemps = document.getElementById('modalTemps');
        this.modalHumidity = document.getElementById('modalHumidity');
        this.modalWind = document.getElementById('modalWind');
        this.modalSunrise = document.getElementById('modalSunrise');
        this.hourlyForecast = document.getElementById('hourlyForecast');
    }

    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.locationBtn.addEventListener('click', () => this.handleLocation());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        this.closeModal.addEventListener('click', () => this.closeWeatherModal());
        this.weatherModal.addEventListener('click', (e) => {
            if (e.target === this.weatherModal) {
                this.closeWeatherModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.weatherModal.style.display === 'block') {
                this.closeWeatherModal();
            }
        });
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeToggleText();
    }

    updateThemeToggleText() {
        this.themeToggle.textContent = this.currentTheme === 'dark' ? '🌞' : '🌙';
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeToggleText();
        localStorage.setItem('theme', this.currentTheme);
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.weatherDisplay.style.display = 'none';
        this.hideMessages();
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
        setTimeout(() => this.hideMessages(), 5000);
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
        setTimeout(() => this.hideMessages(), 3000);
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        try {
            this.showLoading();
            await this.fetchWeatherByCity(city);
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async handleLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await this.fetchWeatherByCoords(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                } catch (error) {
                    this.showError(error.message);
                    this.hideLoading();
                }
            },
            (error) => {
                let message = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                this.showError(message);
                this.hideLoading();
            }
        );
    }

    async fetchWeatherByCity(city) {
        if (this.demoMode) {
            await this.showDemoWeather(city);
            return;
        }
        const currentWeatherUrl = `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=metric`;
        const forecastUrl = `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&units=metric`;
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);
        if (!currentResponse.ok) {
            throw new Error(currentResponse.status === 404 ? 'City not found' : 'Weather data unavailable');
        }
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        this.displayWeather(currentData, forecastData);
    }

    async fetchWeatherByCoords(lat, lon) {
        if (this.demoMode) {
            await this.showDemoWeather('Current Location');
            return;
        }
        const currentWeatherUrl = `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
        const forecastUrl = `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`;
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);
        if (!currentResponse.ok) {
            throw new Error('Weather data unavailable for your location');
        }
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        this.displayWeather(currentData, forecastData);
    }

    async showDemoWeather(cityName) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const demoCurrentData = {
            name: cityName,
            sys: { country: 'IND' },
            main: {
                temp: Math.round(Math.random() * 30 + 20),
                feels_like: Math.round(Math.random() * 35 + 20),
                humidity: Math.round(Math.random() * 40 + 40)
            },
            weather: [{
                main: 'Clear',
                description: 'clear sky',
                icon: '01d'
            }],
            wind: {
                speed: Math.round(Math.random() * 20 + 5)
            },
            visibility: Math.round(Math.random() * 5000 + 5000)
        };
        const demoForecastData = {
            list: Array.from({ length: 56 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 1 + Math.floor(i / 8));
                return {
                    dt: date.getTime() / 1000 + (i % 8 * 3 * 3600),
                    main: {
                        temp_max: Math.round(Math.random() * 30 + 20),
                        temp_min: Math.round(Math.random() * 20 + 15),
                        temp: Math.round(Math.random() * 25 + 20),
                        humidity: Math.round(Math.random() * 40 + 40)
                    },
                    weather: [{
                        main: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
                        description: ['clear sky', 'scattered clouds', 'light rain', 'light snow'][Math.floor(Math.random() * 4)],
                        icon: ['01d', '02d', '10d', '13d'][Math.floor(Math.random() * 4)]
                    }],
                    wind: {
                        speed: Math.round(Math.random() * 20 + 5)
                    }
                };
            })
        };
        this.displayWeather(demoCurrentData, demoForecastData);
    }

    displayWeather(currentData, forecastData) {
        this.weatherIcon.textContent = this.getWeatherIcon(currentData.weather[0].main);
        this.temperature.textContent = `${Math.round(currentData.main.temp)}°C`;
        this.location.textContent = `${currentData.name}, ${currentData.sys.country}`;
        this.description.textContent = currentData.weather[0].description;
        this.humidity.textContent = `${currentData.main.humidity}%`;
        this.windSpeed.textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`;
        this.visibility.textContent = `${Math.round(currentData.visibility / 1000)} km`;
        this.feelsLike.textContent = `${Math.round(currentData.main.feels_like)}°C`;
        this.displayForecast(forecastData);
        this.hideLoading();
        this.weatherDisplay.style.display = 'block';
        this.weatherDisplay.classList.add('fade-in');
        this.showSuccess(`Weather data loaded for ${currentData.name}`);
    }

    displayForecast(forecastData) {
        const dailyForecasts = this.groupForecastByDay(forecastData.list);
        this.forecastContainer.innerHTML = '';
        dailyForecasts.slice(0, 7).forEach((day, index) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.dataset.dayIndex = index;
            const dayLabel = index === 0 ? 'Yesterday' : day.day;
            const isYesterday = index === 0;
            forecastCard.innerHTML = `
                <div class="forecast-day" style="${isYesterday ? 'color: var(--text-light); font-style: italic;' : ''}">${dayLabel}</div>
                <div class="forecast-icon">${this.getWeatherIcon(day.weather)}</div>
                <div class="forecast-temps">
                    <span class="forecast-high">${day.high}°</span>
                    <span class="forecast-low">${day.low}°</span>
                </div>
                <div class="forecast-desc">${day.description}</div>
            `;
            forecastCard.addEventListener('click', () => {
                this.showDayDetails(day, dailyForecasts[index], index);
                document.querySelectorAll('.forecast-card').forEach(card => {
                    card.classList.remove('active');
                });
                forecastCard.classList.add('active');
            });
            this.forecastContainer.appendChild(forecastCard);
        });
    }

    groupForecastByDay(forecastList) {
        const dailyData = {};
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    day: this.formatDayName(date),
                    date: date,
                    high: item.main.temp_max,
                    low: item.main.temp_min,
                    weather: item.weather[0].main,
                    description: item.weather[0].description,
                    humidity: item.main.humidity,
                    windSpeed: item.wind?.speed || 0,
                    hourlyData: []
                };
            } else {
                dailyData[dayKey].high = Math.max(dailyData[dayKey].high, item.main.temp_max);
                dailyData[dayKey].low = Math.min(dailyData[dayKey].low, item.main.temp_min);
            }
            dailyData[dayKey].hourlyData.push({
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                temp: Math.round(item.main.temp),
                weather: item.weather[0].main,
                icon: this.getWeatherIcon(item.weather[0].main)
            });
        });
        return Object.values(dailyData).map(day => ({
            ...day,
            high: Math.round(day.high),
            low: Math.round(day.low)
        })).sort((a, b) => a.date - b.date);
    }

    formatDayName(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
    }

    showDayDetails(dayData, fullDayData, dayIndex) {
        this.modalDate.textContent = dayData.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        this.modalWeatherIcon.textContent = this.getWeatherIcon(dayData.weather);
        this.modalDescription.textContent = dayData.description;
        this.modalTemps.textContent = `${dayData.high}° / ${dayData.low}°`;
        this.modalHumidity.textContent = `${dayData.humidity}%`;
        this.modalWind.textContent = `${Math.round(dayData.windSpeed * 3.6)} km/h`;
        const sunrise = new Date(dayData.date);
        sunrise.setHours(6, Math.floor(Math.random() * 60), 0);
        this.modalSunrise.textContent = sunrise.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        this.hourlyForecast.innerHTML = '';
        if (fullDayData.hourlyData && fullDayData.hourlyData.length > 0) {
            fullDayData.hourlyData.slice(0, 8).forEach(hourData => {
                const hourlyCard = document.createElement('div');
                hourlyCard.className = 'hourly-card';
                hourlyCard.innerHTML = `
                    <div class="hourly-time">${hourData.time}</div>
                    <div class="hourly-icon">${hourData.icon}</div>
                    <div class="hourly-temp">${hourData.temp}°</div>
                `;
                this.hourlyForecast.appendChild(hourlyCard);
            });
        } else {
            this.hourlyForecast.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">Hourly data not available</p>';
        }
        this.weatherModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeWeatherModal() {
        this.weatherModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.querySelectorAll('.forecast-card').forEach(card => {
            card.classList.remove('active');
        });
    }

    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': '🌞 ',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Haze': '🌫️',
            'Fog': '🌫️'
        };
        return iconMap[weatherMain] || '🌤️';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const weatherApp = new WeatherApp();
    weatherApp.handleLocation();
});
