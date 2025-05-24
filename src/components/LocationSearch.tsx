import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Search, MapPin, Calendar } from "lucide-react";
import { getCurrentLocation } from "@/services/weatherApi";
import { format } from "date-fns";

interface LocationSearchProps {
  onSearch: (location: string, date: Date | undefined) => void;
  onLocationRequest: (lat: number, lon: number) => void;
  isLoading: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onSearch,
  onLocationRequest,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a location");
      return;
    }
    if (selectedDate) {
      const inputDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxFuture = new Date();
      maxFuture.setDate(today.getDate() + 14);
      maxFuture.setHours(0, 0, 0, 0);
      const minDate = new Date("2010-01-01");
      if (inputDate < minDate) {
        toast.error("Weather data is not available before 2010-01-01.");
        return;
      }
      if (inputDate > maxFuture) {
        toast.error("Weather data is only available for up to 14 days in advance.");
        return;
      }
    }
    onSearch(searchTerm, selectedDate ? new Date(selectedDate) : undefined);
  };

  const handleLocationRequest = async () => {
    try {
      const { lat, lon } = await getCurrentLocation();
      onLocationRequest(lat, lon);
    } catch (error) {
      toast.error("Failed to get your location. Please check your browser settings.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="location"
                type="text"
                placeholder="Enter city name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
              />
            </div>
          </div>
          <div className="w-full md:w-48 space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Search Weather</span>
              </div>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleLocationRequest}
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <MapPin className="h-4 w-4" />
            <span>Use My Location</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LocationSearch;
