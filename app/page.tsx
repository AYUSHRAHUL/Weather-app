'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin, Thermometer, Droplets, Wind, Eye, Sunrise, Sunset, Cloud, Sun, CloudRain, Zap, Snowflake } from 'lucide-react';

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  useEffect(() => {
    getCurrentLocationWeather();
    startParticleAnimation();
  }, []);

  useEffect(() => {
    if (weather) {
      updateParticleEffect(weather.weather[0].main.toLowerCase());
    }
  }, [weather]);

  const startParticleAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.speed = Math.random() * 2 + 1;
        this.size = Math.random() * 3 + 1;
      }

      update() {
        this.y += this.speed;
        this.x += Math.sin(this.y * 0.01) * 0.5;
        
        if (this.y > canvas.height) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  const updateParticleEffect = (condition) => {
    // Different particle effects based on weather condition
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (condition.includes('rain')) {
      // Rain effect - faster, vertical particles
      ctx.globalCompositeOperation = 'lighter';
    } else if (condition.includes('snow')) {
      // Snow effect - slower, larger particles
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Default effect
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const getCurrentLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          fetchWeatherByCity('New York');
        }
      );
    } else {
      fetchWeatherByCity('New York');
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
      ]);

      setWeather(currentResponse.data);
      setForecast(forecastResponse.data);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`)
      ]);

      setWeather(currentResponse.data);
      setForecast(forecastResponse.data);
    } catch (err) {
      setError('City not found. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      fetchWeatherByCity(searchLocation.trim());
      setSearchLocation('');
    }
  };

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDailyForecast = () => {
    if (!forecast) return [];
    
    const dailyData = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          dt: item.dt,
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          weather: item.weather[0],
          description: item.weather[0].description
        };
      } else {
        dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
        dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
      }
    });
    
    return Object.values(dailyData).slice(0, 5);
  };

  const getHourlyForecast = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8);
  };

  const getWeatherBackground = () => {
    if (!weather) return 'cosmic-gradient';
    
    const condition = weather.weather[0].main.toLowerCase();
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;

    if (condition.includes('clear')) {
      return isNight ? 'night-gradient' : 'sunny-gradient';
    } else if (condition.includes('cloud')) {
      return 'cloudy-gradient';
    } else if (condition.includes('rain')) {
      return 'rainy-gradient';
    } else if (condition.includes('snow')) {
      return 'snowy-gradient';
    } else if (condition.includes('thunderstorm')) {
      return 'stormy-gradient';
    } else {
      return 'cosmic-gradient';
    }
  };

  const getWeatherEmoji = (condition) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('thunderstorm')) return '⛈️';
    return '🌤️';
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-32 h-32 border-4 border-white/30 rounded-full animate-spin border-t-white/80 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Cloud className="w-16 h-16 text-white animate-bounce" />
            </div>
          </div>
          <div className="text-white text-2xl font-bold animate-pulse mb-4">
            ✨ Fetching Weather Magic ✨
          </div>
          <div className="text-white/80 text-lg animate-fade-in-up animation-delay-500">
            Please wait while we gather the latest weather data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getWeatherBackground()} relative overflow-hidden transition-all duration-1000`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-60" />
      
      {/* Floating Weather Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          >
            {weather ? getWeatherEmoji(weather.weather[0].main) : '☁️'}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-4 relative z-10">
        {/* Glassmorphism Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="glass-ultra rounded-3xl p-8 mb-8 border border-white/20">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 animate-gradient-text mb-6">
              WeatherPro
            </h1>
            <p className="text-white/90 text-xl md:text-2xl font-medium">
              🌍 Discover weather around the world with stunning visuals
            </p>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="glass-ultra rounded-2xl p-6 mb-8 border border-white/30 animate-slide-in-left">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-6 h-6 group-focus-within:text-white group-focus-within:scale-110 transition-all duration-300" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="🔍 Enter city name (e.g., London, Tokyo, New York)..."
                className="w-full pl-14 pr-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:ring-4 focus:ring-white/30 focus:bg-white/20 transition-all duration-300 text-lg font-medium border border-white/20 focus:border-white/40"
              />
            </div>
            <button
              type="submit"
              className="neon-button px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 text-lg"
            >
              <Search className="w-6 h-6" />
              Search
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-lg text-red-200 animate-shake">
              ⚠️ {error}
            </div>
          )}
        </div>

        {weather && (
          <>
            {/* Main Weather Card */}
            <div className="glass-ultra rounded-3xl p-8 mb-8 border border-white/30 animate-slide-in-right hover:transform hover:scale-105 transition-all duration-500">
              <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
                <div className="text-center lg:text-left mb-6 lg:mb-0">
                  <div className="flex items-center justify-center lg:justify-start text-white mb-4">
                    <MapPin className="w-8 h-8 mr-3 text-pink-300 animate-bounce" />
                    <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                      {weather.name}, {weather.sys.country}
                    </h2>
                  </div>
                  <p className="text-white/80 text-xl">
                    📅 {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-white/60 text-lg mt-2">
                    🕐 {new Date().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full blur-2xl opacity-60 animate-pulse-slow"></div>
                      <img
                        src={getWeatherIcon(weather.weather[0].icon)}
                        alt={weather.weather[0].description}
                        className="w-32 h-32 relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-300 animate-float"
                      />
                    </div>
                    <div className="ml-8">
                      <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 animate-pulse-slow">
                        {Math.round(weather.main.temp)}°C
                      </div>
                      <p className="text-white/90 capitalize text-2xl font-semibold mt-2">
                        {getWeatherEmoji(weather.weather[0].main)} {weather.weather[0].description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { icon: Thermometer, label: 'Feels like', value: `${Math.round(weather.main.feels_like)}°C`, gradient: 'from-red-400 to-orange-400', emoji: '🌡️' },
                  { icon: Droplets, label: 'Humidity', value: `${weather.main.humidity}%`, gradient: 'from-blue-400 to-cyan-400', emoji: '💧' },
                  { icon: Wind, label: 'Wind Speed', value: `${weather.wind.speed} m/s`, gradient: 'from-green-400 to-teal-400', emoji: '💨' },
                  { icon: Eye, label: 'Visibility', value: `${(weather.visibility / 1000).toFixed(1)} km`, gradient: 'from-purple-400 to-pink-400', emoji: '👁️' }
                ].map((item, index) => (
                  <div key={index} className="neon-card p-6 text-center hover:transform hover:scale-110 transition-all duration-300 animate-slide-in-up" style={{animationDelay: `${index * 100}ms`}}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80 text-sm mb-2 font-medium">{item.emoji} {item.label}</p>
                    <p className="text-white font-bold text-xl">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Sun Times */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Sunrise, label: 'Sunrise', value: formatTime(weather.sys.sunrise), gradient: 'from-yellow-400 to-orange-500', emoji: '🌅' },
                  { icon: Sunset, label: 'Sunset', value: formatTime(weather.sys.sunset), gradient: 'from-orange-500 to-red-500', emoji: '🌇' }
                ].map((item, index) => (
                  <div key={index} className="neon-card p-6 text-center hover:transform hover:scale-110 transition-all duration-300 animate-slide-in-up" style={{animationDelay: `${index * 150}ms`}}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80 text-sm mb-2 font-medium">{item.emoji} {item.label}</p>
                    <p className="text-white font-bold text-xl">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Forecast */}
            <div className="glass-ultra rounded-3xl p-6 mb-8 border border-white/30 animate-slide-in-left hover:bg-white/10 transition-all duration-500">
              <h3 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                ⏰ Next 24 Hours
              </h3>
              <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
                {getHourlyForecast().map((hour, index) => (
                  <div key={index} className="neon-card p-4 min-w-[160px] text-center hover:transform hover:scale-110 transition-all duration-300 animate-bounce-in" style={{animationDelay: `${index * 50}ms`}}>
                    <p className="text-white/90 text-sm mb-3 font-semibold">
                      {formatTime(hour.dt)}
                    </p>
                    <div className="relative mb-3">
                      <img
                        src={getWeatherIcon(hour.weather[0].icon)}
                        alt={hour.weather[0].description}
                        className="w-16 h-16 mx-auto animate-float hover:scale-125 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-white font-bold text-xl mb-2">
                      {Math.round(hour.main.temp)}°C
                    </p>
                    <p className="text-white/80 text-xs capitalize font-medium">
                      {hour.weather[0].description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="glass-ultra rounded-3xl p-6 border border-white/30 animate-slide-in-right hover:bg-white/10 transition-all duration-500">
              <h3 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                📅 5-Day Weather Forecast
              </h3>
              <div className="space-y-4">
                {getDailyForecast().map((day, index) => (
                  <div key={index} className="neon-card p-6 flex items-center justify-between hover:transform hover:scale-105 transition-all duration-300 animate-slide-in-up" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex items-center">
                      <div className="relative mr-6">
                        <img
                          src={getWeatherIcon(day.weather.icon)}
                          alt={day.weather.description}
                          className="w-20 h-20 animate-float hover:scale-125 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <p className="text-white font-bold text-2xl mb-1">
                          {formatDate(day.dt)}
                        </p>
                        <p className="text-white/80 capitalize text-lg font-medium">
                          {getWeatherEmoji(day.weather.main)} {day.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-3xl mb-1">
                        {Math.round(day.temp_max)}°C
                      </p>
                      <p className="text-white/70 text-xl font-medium">
                        {Math.round(day.temp_min)}°C
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;
