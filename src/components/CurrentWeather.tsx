import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentWeather as CurrentWeatherType, WeatherLocation, getWeatherIcon } from "@/services/weatherApi";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CurrentWeatherProps {
  current: CurrentWeatherType;
  location: WeatherLocation;
  selectedDate?: Date;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ current, location, selectedDate }) => {
  // Get the appropriate icon based on the weather condition
  const iconName = getWeatherIcon(current.condition.code);
  const LucideIcon = iconName ? LucideIcons[iconName as keyof typeof LucideIcons] : null;

  // Format the date
  const displayDate = selectedDate ? selectedDate : new Date(location.localtime);
  const formattedDate = displayDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const formattedTime = displayDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="weather-card overflow-hidden animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold">{location.name}</CardTitle>
            <p className="text-muted-foreground">
              {location.region}, {location.country}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">{formattedTime}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center justify-center">
            {LucideIcon &&
              typeof LucideIcon === 'function' &&
              LucideIcon.length <= 1 && (
                <LucideIcon
                  size={80}
                  className="weather-icon animate-float text-primary"
                />
              )}
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-end gap-2">
              <span className="text-5xl md:text-6xl font-bold">{Math.round(current.temp_c)}</span>
              <span className="text-3xl font-medium">°C</span>
            </div>
            <p className="text-lg capitalize">{current.condition.text}</p>
            <p className="text-muted-foreground">Feels like {Math.round(current.feelslike_c)}°C</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 md:mt-0 md:ml-auto">
            <div className="flex items-center gap-2">
              <LucideIcons.Wind size={16} className="text-sky-500" />
              <span className="text-sm">Wind: {current.wind_kph} km/h {current.wind_dir}</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideIcons.Droplets size={16} className="text-sky-500" />
              <span className="text-sm">Humidity: {current.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideIcons.CloudRain size={16} className="text-sky-500" />
              <span className="text-sm">Precipitation: {current.precip_mm} mm</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideIcons.Sun size={16} className="text-sky-500" />
              <span className="text-sm">UV Index: {current.uv}</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideIcons.Gauge size={16} className="text-sky-500" />
              <span className="text-sm">Pressure: {current.pressure_mb} mb</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideIcons.Eye size={16} className="text-sky-500" />
              <span className="text-sm">Visibility: {current.vis_km} km</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentWeather;
