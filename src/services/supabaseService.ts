import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { SearchHistoryItem, WeatherData } from './weatherApi';
import { Json } from "@/integrations/supabase/types";

// Create a new weather search history record
export async function createSearchHistory(item: Omit<SearchHistoryItem, 'id'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('weather_history')
      .insert({
        location: item.location,
        timestamp: item.timestamp,
        weather_data: item.weatherData as unknown as Json,
        date_range: item.dateRange ? { from: item.dateRange.from, to: item.dateRange.to } : null
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating search history:', error);
    toast.error('Failed to save search history.');
    return null;
  }
}

// Get weather search history
export async function getSearchHistory(userId?: string): Promise<SearchHistoryItem[]> {
  try {
    let query = supabase
      .from('weather_history')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Map database structure to application structure
    return (data || []).map(item => ({
      id: item.id,
      location: item.location,
      timestamp: item.timestamp,
      weatherData: item.weather_data as unknown as WeatherData,
      dateRange: item.date_range ? { from: item.date_range.from, to: item.date_range.to } : undefined
    }));
  } catch (error) {
    console.error('Error fetching search history:', error);
    toast.error('Failed to load search history.');
    return [];
  }
}

// Update a weather search history record
export async function updateSearchHistory(id: string, updates: Partial<SearchHistoryItem>): Promise<boolean> {
  try {
    // Convert from app model to database model
    const dbUpdates: any = {};
    
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.timestamp) dbUpdates.timestamp = updates.timestamp;
    if (updates.weatherData) dbUpdates.weather_data = updates.weatherData as unknown as Json;
    if (updates.dateRange) dbUpdates.date_range = updates.dateRange;
    
    const { error } = await supabase
      .from('weather_history')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating search history:', error);
    toast.error('Failed to update search history.');
    return false;
  }
}

// Delete a weather search history record
export async function deleteSearchHistory(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('weather_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting search history:', error);
    toast.error('Failed to delete search history.');
    return false;
  }
}

// Export data to various formats
export function exportData(data: SearchHistoryItem[], format: 'json' | 'csv' | 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    // Basic CSV export with headers
    const headers = 'id,location,timestamp,temperature,condition\n';
    const rows = data.map(item => {
      return `${item.id},"${item.location}",${item.timestamp},${item.weatherData.current.temp_c},"${item.weatherData.current.condition.text}"`;
    }).join('\n');
    return headers + rows;
  } else if (format === 'markdown') {
    // Basic markdown table
    let md = '# Weather Search History\n\n';
    md += '| Location | Date | Temperature | Condition |\n';
    md += '|----------|------|-------------|----------|\n';
    
    data.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      md += `| ${item.location} | ${date} | ${item.weatherData.current.temp_c}°C | ${item.weatherData.current.condition.text} |\n`;
    });
    
    return md;
  }
  
  return '';
}

// Download data in a specific format
export function downloadData(data: string, filename: string, format: 'json' | 'csv' | 'markdown'): void {
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'json':
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'csv':
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'markdown':
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    default:
      mimeType = 'text/plain';
      extension = 'txt';
  }
  
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
