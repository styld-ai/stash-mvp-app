import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Building, GraduationCap, Dumbbell, Hotel, Film, Hospital, Map, ArrowLeft } from "lucide-react";

// Define location types directly in this file to avoid additional imports
interface LocationType {
  id: string;
  type: string;
  icon: any;
  description: string;
  available: {
    refrigerated: number;
    nonRefrigerated: number;
  };
}

const locationTypes: LocationType[] = [
  {
    id: "office",
    type: "Office",
    icon: Building,
    description: "Corporate and business offices",
    available: {
      refrigerated: 25,
      nonRefrigerated: 29
    }
  },
  {
    id: "school",
    type: "School",
    icon: GraduationCap,
    description: "K-12 and higher education facilities",
    available: {
      refrigerated: 2,
      nonRefrigerated: 2
    }
  },
  {
    id: "gym",
    type: "Gym",
    icon: Dumbbell,
    description: "Fitness centers and sports facilities",
    available: {
      refrigerated: 4,
      nonRefrigerated: 4
    }
  },
  {
    id: "hotel",
    type: "Hotel",
    icon: Hotel,
    description: "Hotels and accommodations",
    available: {
      refrigerated: 3,
      nonRefrigerated: 3
    }
  },
  {
    id: "movie_theater",
    type: "Movie Theater",
    icon: Film,
    description: "Cinemas and entertainment venues",
    available: {
      refrigerated: 5,
      nonRefrigerated: 5
    }
  },
  {
    id: "hospital",
    type: "Hospital",
    icon: Hospital,
    description: "Healthcare facilities and medical centers",
    available: {
      refrigerated: 2,
      nonRefrigerated: 2
    }
  }
];

interface LocationSelection {
  id: string;
  count: number;
}

const DeployTest = () => {
  const navigate = useNavigate();
  const [isRefrigerated, setIsRefrigerated] = useState<boolean>(false);
  const [selections, setSelections] = useState<LocationSelection[]>(
    locationTypes.map(location => ({ id: location.id, count: 0 }))
  );
  const [totalSelected, setTotalSelected] = useState<number>(0);
  const [showMap, setShowMap] = useState<boolean>(false);
  
  // Update total count whenever selections change
  useEffect(() => {
    const total = selections.reduce((sum, item) => sum + item.count, 0);
    setTotalSelected(total);
  }, [selections]);
  
  const handleCountChange = (locationId: string, newValue: string) => {
    // Convert to number and ensure it's valid
    const count = parseInt(newValue) || 0;
    
    // Get the current total without this location
    const currentTotal = selections.reduce((sum, item) => 
      item.id === locationId ? sum : sum + item.count, 0
    );
    
    // Ensure we don't exceed 10 total
    const newCount = Math.min(count, 10 - currentTotal);
    
    // Update the selection
    setSelections(prev => 
      prev.map(item => 
        item.id === locationId ? { ...item, count: newCount } : item
      )
    );
  };
  
  const handleSubmit = () => {
    if (totalSelected === 0) {
      toast({
        title: "No locations selected",
        description: "Please select at least one location to deploy your test",
        variant: "destructive"
      });
      return;
    }
    
    
    // Open Stash sign-in in a new window/tab
    window.open("https://app.inthestash.com/registration-form", "_blank");
  };
  
  const handleCancel = () => {
    navigate('/results');
  };

  const viewResults = () => {
    // The Results page will now check localStorage for saved results
    navigate('/results', { replace: true });
  };
  
  const toggleMap = () => {
    setShowMap(prev => !prev);
  };
  
  // Get the available count for the current refrigeration setting
  const getAvailableCount = (location: LocationType) => {
    return isRefrigerated 
      ? location.available.refrigerated 
      : location.available.nonRefrigerated;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Stash Packaging Test</h1>
          
          {/* Back to Results button in header */}
          <Button 
            variant="ghost" 
            onClick={viewResults} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Map toggle button */}
          <div className="mb-4 flex justify-end">
            <Button 
              onClick={toggleMap} 
              variant={showMap ? "default" : "outline"}
              className="flex items-center"
            >
              <Map className="mr-2 h-4 w-4" />
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>
          
          {/* Flexible layout that changes with map visibility */}
          <div className={`grid grid-cols-1 ${showMap ? 'md:grid-cols-5 gap-6' : ''}`}>
            {/* Map area - only visible when toggled */}
            {showMap && (
              <div className="md:col-span-2 transition-all duration-300 ease-in-out">
                <div className="bg-white rounded-lg shadow h-full overflow-hidden">
                  <div className="bg-gray-100 p-4 border-b">
                    <h2 className="font-medium">Available Locations</h2>
                    <p className="text-sm text-gray-500">Interactive map of our test locations</p>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-gray-50 h-[calc(100%-4rem)]">
                    {/* Placeholder for the map image */}
                    <div className="w-full h-full min-h-[400px] bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-500 text-center">
                        <Map className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        Location Map<br/>
                        <span className="text-sm">Coming soon</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main form area */}
            <div className={showMap ? 'md:col-span-3' : ''}>
              <Card>
                <CardHeader>
                  <CardTitle>Deploy Test</CardTitle>
                  <CardDescription>
                    Select up to 10 vending locations to deploy your packaging test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Refrigeration toggle */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <h3 className="font-medium">Refrigerated Products</h3>
                        <p className="text-sm text-gray-500">
                          Toggle to select between refrigerated and non-refrigerated vending locations
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {isRefrigerated ? "Refrigerated" : "Non-Refrigerated"}
                        </span>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                          <input
                            type="checkbox"
                            id="refrigerated"
                            className="hidden"
                            checked={isRefrigerated}
                            onChange={() => setIsRefrigerated(prev => !prev)}
                          />
                          <label
                            htmlFor="refrigerated"
                            className={`absolute inset-0 rounded-full ${
                              isRefrigerated ? 'bg-blue-600' : 'bg-gray-300'
                            } transition duration-200 ease-in-out cursor-pointer`}
                          >
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out ${
                                isRefrigerated ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            ></span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location selection */}
                    <div>
                      <h3 className="font-medium mb-4">Select Locations ({totalSelected}/10 selected)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locationTypes.map(location => {
                          const availableCount = getAvailableCount(location);
                          const currentSelection = selections.find(s => s.id === location.id);
                          const count = currentSelection ? currentSelection.count : 0;
                          
                          return (
                            <div 
                              key={location.id}
                              className="border rounded-lg p-4 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="bg-gray-100 p-3 rounded-full">
                                  <location.icon className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{location.type}</h4>
                                  <p className="text-sm text-gray-500">{availableCount} available</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 w-20">
                                <Input
                                  type="number"
                                  min="0"
                                  max={Math.min(availableCount, 10 - (totalSelected - count))}
                                  value={count}
                                  onChange={(e) => handleCountChange(location.id, e.target.value)}
                                  className="text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Selection Summary */}
                    {totalSelected > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Your Selection</h3>
                        <ul className="space-y-1">
                          {selections
                            .filter(s => s.count > 0)
                            .map(selection => {
                              const location = locationTypes.find(l => l.id === selection.id);
                              return (
                                <li key={selection.id} className="text-sm">
                                  {selection.count} {location?.type} locations
                                </li>
                              );
                            })
                          }
                        </ul>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                          <span className="font-medium">Total Locations:</span>
                          <span className="font-bold">{totalSelected}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={totalSelected === 0}
                  >
                    Deploy Test
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeployTest;