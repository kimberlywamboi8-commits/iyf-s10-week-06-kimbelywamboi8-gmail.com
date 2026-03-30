const elements = {
  form: document.getElementById("search-form"),
  input: document.getElementById("city-input"),
  status: document.getElementById("status"),
  location: document.getElementById("location"),
  date: document.getElementById("date"),
  conditionCode: document.getElementById("condition-code"),
  temperature: document.getElementById("temperature"),
  conditionText: document.getElementById("condition-text"),
  feelsLike: document.getElementById("feels-like"),
  wind: document.getElementById("wind"),
  humidity: document.getElementById("humidity"),
  range: document.getElementById("range"),
  forecast: document.getElementById("forecast")
};

const weatherCodes = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm"
};

const formatTemperature = (value) => `${Math.round(value)}\u00B0C`;
const formatDate = (value, options) =>
  new Intl.DateTimeFormat(undefined, options).format(new Date(value));

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#ffd5c4" : "";
}

function renderForecast(daily) {
  const cards = daily.time.slice(0, 5).map((day, index) => {
    const label = formatDate(day, { weekday: "short" });
    const code = daily.weather_code[index];
    return `
      <article>
        <p class="forecast-day">${label}</p>
        <strong>${weatherCodes[code] ?? "Weather"}</strong>
        <span>${Math.round(daily.temperature_2m_max[index])}\u00B0 / ${Math.round(daily.temperature_2m_min[index])}\u00B0</span>
        <span>Rain ${daily.precipitation_probability_max[index] ?? 0}%</span>
      </article>
    `;
  });

  elements.forecast.innerHTML = cards.join("");
}

function renderWeather(place, weather) {
  const currentCode = weather.current.weather_code;
  const condition = weatherCodes[currentCode] ?? "Unknown";

  elements.location.textContent = `${place.name}, ${place.country}`;
  elements.date.textContent = formatDate(weather.current.time, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  elements.conditionCode.textContent = condition;
  elements.temperature.textContent = formatTemperature(weather.current.temperature_2m);
  elements.conditionText.textContent = `${condition} with ${Math.round(weather.current.precipitation_probability ?? 0)}% precipitation chance`;
  elements.feelsLike.textContent = formatTemperature(weather.current.apparent_temperature);
  elements.wind.textContent = `${Math.round(weather.current.wind_speed_10m)} km/h`;
  elements.humidity.textContent = `${weather.current.relative_humidity_2m}%`;
  elements.range.textContent = `${Math.round(weather.daily.temperature_2m_max[0])}\u00B0 / ${Math.round(weather.daily.temperature_2m_min[0])}\u00B0`;

  renderForecast(weather.daily);
}

async function fetchLocation(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Location lookup failed.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("No matching city found.");
  }

  return data.results[0];
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation_probability",
    "weather_code",
    "wind_speed_10m"
  ].join(","));
  url.searchParams.set("daily", [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max"
  ].join(","));
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather lookup failed.");
  }

  return response.json();
}

async function loadWeather(query) {
  setStatus(`Looking up ${query}...`);

  try {
    const place = await fetchLocation(query);
    const weather = await fetchWeather(place.latitude, place.longitude);
    renderWeather(place, weather);
    setStatus(`Updated for ${place.name}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();
  if (!query) {
    setStatus("Enter a city name first.", true);
    return;
  }

  loadWeather(query);
});

loadWeather("Los Angeles");


 