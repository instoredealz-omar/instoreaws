import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, MapPin, Phone, Building } from "lucide-react";
import { indianStates, getCitiesByState } from "@/lib/cities";
import { InsertDealLocation } from "@shared/schema";

interface StoreLocation {
  id: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface MultiStoreLocationManagerProps {
  locations: StoreLocation[];
  onChange: (locations: StoreLocation[]) => void;
}

export default function MultiStoreLocationManager({ locations, onChange }: MultiStoreLocationManagerProps) {
  // Track states for proper Select component rendering
  const [internalStates, setInternalStates] = useState<{ [key: string]: string }>({});

  const addLocation = () => {
    const newLocation: StoreLocation = {
      id: Date.now().toString(),
      storeName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    };
    onChange([...locations, newLocation]);
  };

  const removeLocation = (id: string) => {
    // Remove from internal states when location is removed
    setInternalStates(prev => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
    onChange(locations.filter(loc => loc.id !== id));
  };

  const updateLocation = (id: string, field: keyof StoreLocation, value: string) => {
    onChange(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  // Keep internal states synchronized with locations
  useEffect(() => {
    const newInternalStates: { [key: string]: string } = {};
    locations.forEach(location => {
      newInternalStates[location.id] = location.state || '';
    });
    setInternalStates(newInternalStates);
  }, [locations]);

  const handleStateChange = (locationId: string, state: string) => {
    // Update internal state immediately for UI responsiveness
    setInternalStates(prev => ({ ...prev, [locationId]: state }));
    // Update the actual location data
    updateLocation(locationId, 'state', state);
    // Clear city when state changes
    updateLocation(locationId, 'city', '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Store Locations</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLocation}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No store locations added yet. Click "Add Location" to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {locations.map((location, index) => (
        <Card key={location.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Store Location {index + 1}
              </CardTitle>
              {locations.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLocation(location.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Name */}
            <div>
              <Label htmlFor={`storeName-${location.id}`}>Store Name *</Label>
              <Input
                id={`storeName-${location.id}`}
                placeholder="e.g., Central Mall Branch"
                value={location.storeName}
                onChange={(e) => updateLocation(location.id, 'storeName', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor={`address-${location.id}`}>Full Address *</Label>
              <Input
                id={`address-${location.id}`}
                placeholder="e.g., Shop No. 15, Ground Floor, Central Mall"
                value={location.address}
                onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* State and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`state-${location.id}`}>State *</Label>
                <Select
                  key={`state-${location.id}-${internalStates[location.id] || 'empty'}`}
                  value={internalStates[location.id] || location.state || ''}
                  onValueChange={(value) => handleStateChange(location.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state.name} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`city-${location.id}`}>City *</Label>
                <Select
                  key={`city-${location.id}-${location.state || 'no-state'}`}
                  value={location.city || ''}
                  onValueChange={(value) => updateLocation(location.id, 'city', value)}
                  disabled={!(internalStates[location.id] || location.state)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {(internalStates[location.id] || location.state) && 
                     getCitiesByState(internalStates[location.id] || location.state).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pincode and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`pincode-${location.id}`}>Pincode</Label>
                <Input
                  id={`pincode-${location.id}`}
                  placeholder="e.g., 400001"
                  value={location.pincode}
                  onChange={(e) => updateLocation(location.id, 'pincode', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`phone-${location.id}`}>Store Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`phone-${location.id}`}
                    placeholder="e.g., +91 9876543210"
                    value={location.phone}
                    onChange={(e) => updateLocation(location.id, 'phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}