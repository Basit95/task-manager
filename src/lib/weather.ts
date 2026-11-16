/**
 * Open-Meteo integration (https://open-meteo.com) — a free public weather API
 * that needs no API key.
 *
 * Two upstream calls per lookup:
 *   1. Geocoding API: city name -> latitude / longitude
 *   2. Forecast API:  coordinates -> current conditions + daily forecast
 *
 * The raw responses are reduced to the small `Weather` shape the UI needs, so
 * the client never depends on the upstream format.
 */

export interface Weather {
  location: { name: string; region: string; country: string };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    isDay: boolean;
  };
  daily: { date: string; condition: string; max: number; min: number }[];
  fetchedAt: string;
}

export class WeatherError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 8000;
const CACHE_SECONDS = 600; // weather changes slowly; cache upstream calls for 10 minutes

// WMO weather interpretation codes used by Open-Meteo.
const CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

const describe = (code: number) => CONDITIONS[code] ?? "Unknown";

async function fetchJson(url: URL): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });
  } catch {
    throw new WeatherError("The weather service did not respond. Please try again.", 504);
  }
  if (!response.ok) {
    throw new WeatherError("The weather service is unavailable right now.", 502);
  }
  return response.json();
}

export async function getWeather(city: string): Promise<Weather> {
  const geoUrl = new URL(GEOCODING_URL);
  geoUrl.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  }).toString();

  const place = (await fetchJson(geoUrl)).results?.[0];
  if (!place) throw new WeatherError(`No place found called "${city}".`, 404);

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "4",
  }).toString();

  const forecast = await fetchJson(forecastUrl);
  const { current, daily } = forecast;
  if (!current || !daily?.time) {
    throw new WeatherError("The weather service returned an unexpected response.", 502);
  }

  return {
    location: {
      name: place.name,
      region: place.admin1 ?? "",
      country: place.country ?? "",
    },
    current: {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      condition: describe(current.weather_code),
      isDay: current.is_day === 1,
    },
    daily: (daily.time as string[]).map((date, i) => ({
      date,
      condition: describe(daily.weather_code[i]),
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
    })),
    fetchedAt: new Date().toISOString(),
  };
}
