import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { SearchHistoryItem } from "@/services/weatherApi";
import {
  deleteSearchHistory,
  downloadData,
  exportData,
  updateSearchHistory,
} from "@/services/supabaseService";
import { MoreVertical, Download, Trash, Edit, FileDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

interface WeatherHistoryProps {
  history: SearchHistoryItem[];
  onReload: () => void;
  onSelect: (item: SearchHistoryItem) => void;
  isSupabaseConnected: boolean;
}

const WeatherHistory: React.FC<WeatherHistoryProps> = ({
  history,
  onReload,
  onSelect,
  isSupabaseConnected,
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<SearchHistoryItem | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState<string>("");

  const handleDelete = async (id: string) => {
    if (!id) return;

    const success = await deleteSearchHistory(id);
    if (success) {
      toast.success("Search history deleted");
      onReload();
    }
  };

  const handleEdit = (item: SearchHistoryItem) => {
    setEditingItem(item);
    setEditLocation(item.location);
    setEditDate(item.dateRange && item.dateRange.from ? item.dateRange.from.slice(0, 10) : "");
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingItem?.id) return;
    if (!editLocation.trim()) {
      toast.error("Location cannot be empty.");
      return;
    }
    if (editDate) {
      const inputDate = new Date(editDate);
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
    const success = await updateSearchHistory(editingItem.id, {
      location: editLocation,
      dateRange: editDate
        ? {
            from: editDate,
            to: editDate,
          }
        : undefined,
    });
    if (success) {
      toast.success("Search history updated");
      setShowEditDialog(false);
      onReload();
    }
  };

  const handleExport = (format: "json" | "csv" | "markdown") => {
    const exportedData = exportData(history, format);
    downloadData(exportedData, "weather-history", format);
    setShowExportDialog(false);
    toast.success(`Data exported as ${format.toUpperCase()}`);
  };

  return (
    <>
      <Card className="weather-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Search History</CardTitle>
              <CardDescription>
                Your recent weather searches
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={history.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isSupabaseConnected && (
            <Alert className="mb-4" variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Supabase not connected</AlertTitle>
              <AlertDescription>
                Connect to Supabase to enable data persistence and history tracking.
              </AlertDescription>
            </Alert>
          )}

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No search history found.</p>
              <p className="text-sm">Search for a location to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    let dateDisplay = "";
                    if (item.dateRange && item.dateRange.from && item.dateRange.to) {
                      const from = new Date(item.dateRange.from).toLocaleDateString();
                      const to = new Date(item.dateRange.to).toLocaleDateString();
                      dateDisplay = `${from} to ${to}`;
                    } else {
                      const date = new Date(item.timestamp);
                      dateDisplay = date.toLocaleDateString();
                    }
                    return (
                      <TableRow key={item.id || item.timestamp}>
                        <TableCell className="font-medium">
                          {item.location}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {dateDisplay}
                            {!(item.dateRange && item.dateRange.from && item.dateRange.to) && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {Math.round(item.weatherData.current.temp_c)}°C
                        </TableCell>
                        <TableCell>{item.weatherData.current.condition.text}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => onSelect(item)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {item.id && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(item.id || "")}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Weather History</DialogTitle>
            <DialogDescription>
              Choose a format to export your weather search history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button onClick={() => handleExport("json")} variant="outline" className="flex flex-col h-auto py-4">
              <Download className="h-6 w-6 mb-2" />
              <span>JSON</span>
            </Button>
            <Button onClick={() => handleExport("csv")} variant="outline" className="flex flex-col h-auto py-4">
              <Download className="h-6 w-6 mb-2" />
              <span>CSV</span>
            </Button>
            <Button onClick={() => handleExport("markdown")} variant="outline" className="flex flex-col h-auto py-4">
              <Download className="h-6 w-6 mb-2" />
              <span>Markdown</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Search History</DialogTitle>
            <DialogDescription>
              Update the location and date for this search.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Enter location"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeatherHistory;
