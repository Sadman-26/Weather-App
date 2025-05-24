import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastDay, getWeatherIcon } from "@/services/weatherApi";
import * as LucideIcons from "lucide-react";

interface ForecastWeatherProps {
  forecast: ForecastDay[];
}

const ForecastWeather: React.FC<ForecastWeatherProps> = ({ forecast }) => {
  // Filter to only today and future dates
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison
  const filteredForecast = forecast.filter(day => {
    const date = new Date(day.date);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  });

  // Map icon string to Lucide component name
  const getLucideIconName = (icon: string) => {
    return icon
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  };

  return (
    <Card className="weather-card animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">5-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {filteredForecast.slice(0, 5).map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
            const dayMonth = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
            
            // Get the appropriate icon
            const iconName = getWeatherIcon(day.day.condition.code);
            const lucideIconName = getLucideIconName(iconName);
            const LucideIcon = (LucideIcons as any)[lucideIconName];
            
            return (
              <div 
                key={index} 
                className="forecast-card flex flex-col items-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="font-medium">{dayName}</p>
                <p className="text-xs text-muted-foreground mb-2">{dayMonth}</p>
                {LucideIcon && typeof LucideIcon === "function" && (
                  <LucideIcon size={36} className="weather-icon my-2" />
                )}
                <p className="text-sm capitalize">{day.day.condition.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">{Math.round(day.day.maxtemp_c)}°</span>
                  <span className="text-muted-foreground">{Math.round(day.day.mintemp_c)}°</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <LucideIcons.CloudRain size={12} />
                  <span>{day.day.daily_chance_of_rain}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastWeather;
