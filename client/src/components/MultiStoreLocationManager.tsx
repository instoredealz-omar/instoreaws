import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, MapPin, Phone, Building } from "lucide-react";
import { indianStates, getCitiesByState } from "@/lib/cities";
import { isMetroCity, getSublocations, getPrimaryPincode } from "@/lib/metro-cities";
import { InsertDealLocation } from "@shared/schema";

interface StoreLocation {
  id: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  sublocation: string;
  pincode: string;
  phone: string;
}

interface MultiStoreLocationManagerProps {
  locations: StoreLocation[];
  onChange: (locations: StoreLocation[]) => void;
}

export default function MultiStoreLocationManager({ locations, onChange }: MultiStoreLocationManagerProps) {
  const addLocation = () => {
    const newLocation: StoreLocation = {
      id: Date.now().toString(),
      storeName: "",
      address: "",
      city: "",
      state: "",
      sublocation: "",
      pincode: "",
      phone: "",
    };
    onChange([...locations, newLocation]);
  };

  const removeLocation = (id: string) => {
    onChange(locations.filter(loc => loc.id !== id));
  };

  const updateLocation = (id: string, field: keyof StoreLocation, value: string) => {
    onChange(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  const handleStateChange = (locationId: string, state: string) => {
    // Update state and clear city and sublocation
    const updatedLocations = locations.map(loc => 
      loc.id === locationId 
        ? { ...loc, state: state, city: "", sublocation: "" }
        : loc
    );
    onChange(updatedLocations);
  };

  const handleCityChange = (locationId: string, city: string) => {
    // Update city and clear sublocation if city changes
    const updatedLocations = locations.map(loc => 
      loc.id === locationId 
        ? { ...loc, city: city, sublocation: "" }
        : loc
    );
    onChange(updatedLocations);
  };

  const handleSublocationChange = (locationId: string, sublocation: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location && location.city) {
      // Auto-fill pincode when sublocation is selected
      const primaryPincode = getPrimaryPincode(location.city, sublocation);
      const updatedLocations = locations.map(loc => 
        loc.id === locationId 
          ? { ...loc, sublocation: sublocation, pincode: primaryPincode }
          : loc
      );
      onChange(updatedLocations);
    } else {
      updateLocation(locationId, 'sublocation', sublocation);
    }
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLocation(location.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
                  value={location.state || ""}
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
                  value={location.city || ""}
                  onValueChange={(value) => handleCityChange(location.id, value)}
                  disabled={!location.state}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={location.state ? "Select City" : "Select State First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {location.state && getCitiesByState(location.state).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sublocation for Metro Cities */}
            {location.city && isMetroCity(location.city) && (
              <div>
                <Label htmlFor={`sublocation-${location.id}`}>Area/Sublocation</Label>
                <Select
                  value={location.sublocation || ""}
                  onValueChange={(value) => handleSublocationChange(location.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Area/Sublocation" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSublocations(location.city).map((sublocation) => (
                      <SelectItem key={sublocation} value={sublocation}>
                        {sublocation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <Label htmlFor={`phone-${location.id}`}>Store Phone *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`phone-${location.id}`}
                    placeholder="10-digit number (e.g., 9876543210)"
                    type="tel"
                    inputMode="numeric"
                    value={location.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateLocation(location.id, 'phone', value);
                    }}
                    maxLength={10}
                    className="pl-10"
                  />
                </div>
                {location.phone && location.phone.length !== 10 && (
                  <p className="text-xs text-red-500 mt-1">Phone must be 10 digits</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}