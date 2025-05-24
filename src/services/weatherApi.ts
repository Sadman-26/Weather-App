import { toast } from "@/components/ui/sonner";

// Weather API constants
const WEATHER_API_KEY = "ccd51f2ad813468b894121155252205"; // Updated WeatherAPI key
const WEATHER_API_URL = "https://api.weatherapi.com/v1";

// YouTube API constants
const YOUTUBE_API_KEY = "AIzaSyCKs2J4KTzx41BfPawhARzaRJbmga6CYEo"; // User-provided YouTube API key
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// Google Maps API constants
export const GOOGLE_MAPS_API_KEY = "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao"; // User-provided Google Maps API key

// Weather data interfaces
export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  condition: {
    text: string;
    code: number;
  };
  wind_kph: number;
  wind_dir: string;
  humidity: number;
  precip_mm: number;
  feelslike_c: number;
  feelslike_f: number;
  uv: number;
  pressure_mb: number;
  vis_km: number;
}

export interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    condition: {
      text: string;
      code: number;
    };
    daily_chance_of_rain: number;
    daily_chance_of_snow: number;
  };
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
}

export interface SearchHistoryItem {
  id?: string;
  userId?: string;
  location: string;
  timestamp: string;
  weatherData: WeatherData;
  dateRange?: {
    from: string | null;
    to: string | null;
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface LocationMapData {
  lat: number;
  lng: number;
  name: string;
  formattedAddress: string;
}

// Get weather by location name (city, zip code, etc.)
export async function getWeatherByLocation(location: string, date?: Date): Promise<WeatherData | null> {
  try {
    let endpoint = "/forecast.json";
    let dateParam = "";
    const today = new Date();
    let days = 14; // Always request max days to ensure we have enough data
    if (date) {
      const inputDate = new Date(date);
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        endpoint = "/history.json";
        dateParam = `&dt=${inputDate.toISOString().slice(0, 10)}`;
        days = 1;
      }
    }
    const response = await fetch(
      `${WEATHER_API_URL}${endpoint}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=${days}&aqi=yes&alerts=no${dateParam}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch weather data");
    }
    const data = await response.json();
    
    // Handle historical data
    if (endpoint === "/history.json") {
      // Use the hour closest to noon (12:00) for a more representative value
      const hours = data.forecast.forecastday[0].hour;
      const noonHour = hours.find((h: any) => h.time.includes('12:00')) || hours[Math.floor(hours.length / 2)];
      const historicalData: WeatherData = {
        location: data.location,
        current: {
          temp_c: noonHour.temp_c,
          temp_f: noonHour.temp_f,
          condition: noonHour.condition,
          wind_kph: noonHour.wind_kph,
          wind_dir: noonHour.wind_dir,
          humidity: noonHour.humidity,
          precip_mm: noonHour.precip_mm,
          feelslike_c: noonHour.feelslike_c,
          feelslike_f: noonHour.feelslike_f,
          uv: noonHour.uv,
          pressure_mb: noonHour.pressure_mb,
          vis_km: noonHour.vis_km,
        },
        forecast: {
          forecastday: [{
            date: data.forecast.forecastday[0].date,
            day: {
              maxtemp_c: data.forecast.forecastday[0].day.maxtemp_c,
              maxtemp_f: data.forecast.forecastday[0].day.maxtemp_f,
              mintemp_c: data.forecast.forecastday[0].day.mintemp_c,
              mintemp_f: data.forecast.forecastday[0].day.mintemp_f,
              condition: data.forecast.forecastday[0].day.condition,
              daily_chance_of_rain: data.forecast.forecastday[0].day.daily_chance_of_rain,
              daily_chance_of_snow: data.forecast.forecastday[0].day.daily_chance_of_snow
            }
          }]
        }
      };
      return historicalData;
    }
    
    // Handle forecast data
    if (endpoint === "/forecast.json") {
      if (data.forecast && data.forecast.forecastday) {
        let startIdx = 0;
        if (date) {
          const inputDate = new Date(date);
          inputDate.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().slice(0, 10);
          const dateStr = inputDate.toISOString().slice(0, 10);
          if (dateStr === todayStr) {
            // If selected date is today, start from today
            startIdx = data.forecast.forecastday.findIndex((d: any) => d.date === dateStr);
            if (startIdx === -1) startIdx = 0;
            data.forecast.forecastday = data.forecast.forecastday.slice(startIdx, startIdx + 5);
          } else {
            // If selected date is in the future, start from the next day
            startIdx = data.forecast.forecastday.findIndex((d: any) => d.date === dateStr);
            if (startIdx === -1) startIdx = 0;
            data.forecast.forecastday = data.forecast.forecastday.slice(startIdx + 1, startIdx + 6);
          }
        } else {
          // No date selected, start from today
          const todayStr = today.toISOString().slice(0, 10);
          startIdx = data.forecast.forecastday.findIndex((d: any) => d.date === todayStr);
          if (startIdx === -1) startIdx = 0;
          data.forecast.forecastday = data.forecast.forecastday.slice(startIdx, startIdx + 5);
        }
      }
    }
    
    return data as WeatherData;
  } catch (error) {
    console.error("Weather API error:", error);
    toast.error(`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

// Get weather by coordinates
export async function getWeatherByCoordinates(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=5&aqi=yes&alerts=no`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch weather data");
    }

    const data = await response.json();
    return data as WeatherData;
  } catch (error) {
    console.error("Weather API error:", error);
    toast.error(`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

// Get user's current location using browser geolocation
export function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 10000 }
    );
  });
}

// Map condition code to a weather icon
export function getWeatherIcon(code: number): string {
  if (code === 1000) return "sun"; // Clear
  if (code >= 1003 && code <= 1009) return "cloud"; // Cloudy
  if (code >= 1030 && code <= 1035) return "cloud"; // Mist/Fog
  if (code >= 1063 && code <= 1069) return "cloud-rain"; // Light rain
  if (code >= 1087 && code <= 1117) return "cloud-lightning"; // Thunder/snow
  if (code >= 1150 && code <= 1207) return "cloud-rain"; // Rain
  if (code >= 1210 && code <= 1237) return "cloud-snow"; // Snow
  if (code >= 1240 && code <= 1252) return "cloud-rain"; // Showers
  if (code >= 1255 && code <= 1264) return "cloud-snow"; // Snow showers
  if (code >= 1273 && code <= 1282) return "cloud-lightning"; // Thunder

  return "cloud"; // Default
}

// Get YouTube videos for a location
export async function getLocationVideos(location: string): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_URL}/search?key=${YOUTUBE_API_KEY}&q=${encodeURIComponent(
        `${location} travel guide`
      )}&part=snippet&type=video&maxResults=5`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch YouTube videos");
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error("YouTube API error:", error);
    toast.error("Failed to fetch location videos");
    return [];
  }
}

// Get location coordinates and details from Google Maps Geocoding API
export async function getLocationMapData(location: string): Promise<LocationMapData | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    console.log("Google Maps Geocoding API response for location:", location, data); // Debug log

    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        name: result.formatted_address.split(",")[0],
        formattedAddress: result.formatted_address,
      };
    }
    return null;
  } catch (error) {
    console.error("Google Maps API error:", error);
    toast.error("Failed to fetch location data");
    return null;
  }
}
