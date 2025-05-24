import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurrentWeather from "@/components/CurrentWeather";
import ForecastWeather from "@/components/ForecastWeather";
import LocationSearch from "@/components/LocationSearch";
import WeatherHistory from "@/components/WeatherHistory";
import ErrorDisplay from "@/components/ErrorDisplay";
import LocationDetails from "@/components/LocationDetails";
import {
  SearchHistoryItem,
  WeatherData,
  getWeatherByCoordinates,
  getWeatherByLocation,
} from "@/services/weatherApi";
import {
  createSearchHistory,
  getSearchHistory,
} from "@/services/supabaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("weather");
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("Failed to load search history:", error);
      toast.error("Failed to load search history");
    }
  };

  const saveSearchToHistory = async (location: string, data: WeatherData) => {
    const newHistoryItem: Omit<SearchHistoryItem, 'id'> = {
      location,
      timestamp: new Date().toISOString(),
      weatherData: data,
    };

    await createSearchHistory(newHistoryItem);
    await loadSearchHistory();
  };

  const searchWeatherByLocation = async (location: string, date?: Date) => {
    setLoading(true);
    setError(null);
    setSelectedDate(date);

    try {
      const data = await getWeatherByLocation(location, date);
      if (data) {
        setWeatherData(data);
        await saveSearchToHistory(location, data);
        setActiveTab("weather");
      } else {
        setError("Location not found. Please try another search term.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const searchWeatherByCoordinates = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getWeatherByCoordinates(lat, lon);
      if (data) {
        setWeatherData(data);
        await saveSearchToHistory(
          `${data.location.name}, ${data.location.country}`,
          data
        );
        setActiveTab("weather");
      } else {
        setError("Failed to get weather for your location.");
      }
    } catch (err) {
      console.error("Location search error:", err);
      setError("Failed to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemSelect = (item: SearchHistoryItem) => {
    setWeatherData(item.weatherData);
    setActiveTab("weather");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary">Weather App</h1>
        <p className="text-muted-foreground">
          Get current weather and forecasts for any location
        </p>
      </header>

      <div className="mb-6">
        <LocationSearch
          onSearch={searchWeatherByLocation}
          onLocationRequest={searchWeatherByCoordinates}
          isLoading={loading}
        />
      </div>

      <Tabs defaultValue="weather" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="animate-fade-in">
          {error ? (
            <ErrorDisplay
              message={error}
              onRetry={() => {
                setError(null);
              }}
            />
          ) : loading ? (
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          ) : weatherData ? (
            <div className="space-y-6">
              <CurrentWeather
                current={weatherData.current}
                location={weatherData.location}
                selectedDate={selectedDate}
              />
              {(!selectedDate || selectedDate >= new Date(new Date().setHours(0,0,0,0))) && (
                <ForecastWeather forecast={weatherData.forecast.forecastday} />
              )}
              <LocationDetails location={`${weatherData.location.name}, ${weatherData.location.country}`} />
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                Enter a location or use your current location to get started
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => searchWeatherByLocation("London")}
                  variant="outline"
                >
                  London
                </Button>
                <Button
                  onClick={() => searchWeatherByLocation("New York")}
                  variant="outline"
                >
                  New York
                </Button>
                <Button
                  onClick={() => searchWeatherByLocation("Tokyo")}
                  variant="outline"
                >
                  Tokyo
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <WeatherHistory
            history={searchHistory}
            onReload={loadSearchHistory}
            onSelect={handleHistoryItemSelect}
            isSupabaseConnected={isSupabaseConnected}
          />
        </TabsContent>
      </Tabs>

      {/* Info Section for Sadman Saqib and PM Accelerator (moved to end) */}
      <section className="mt-12 mb-8 max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">About the Creator</h2>
        <p className="mb-4">Hi, I am <span className="font-bold">Sadman Saqib</span>, and I aspire to be an AI engineer.</p>
        <h3 className="text-xl font-semibold mb-1">About PM Accelerator</h3>
        <p className="mb-2">
          <a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">PM Accelerator</a> is a US based company with a global reach premiering in AI learning and as a development hub, featuring award-winning AI products and mentors from top-tier companies such as Google, Meta, Apple, and Nvidia. We offer a dynamic AI PM Bootcamp, designed to empower the next generation of AI professionals through hands-on experience, mentorship, and real-world projects.
        </p>
      </section>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Weather App &copy; {new Date().getFullYear()}</p>
        <p className="mt-1">
          Weather data provided by{" "}
          <a
            href="https://www.weatherapi.com/"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WeatherAPI.com
          </a>
        </p>
        <p className="mt-2 font-medium">Created by Sadman Saqib &mdash; Aspiring AI Engineer</p>
      </footer>
    </div>
  );
};

export default Index;
