import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import debounce from 'lodash.debounce';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFzaHAxMjMiLCJhIjoiY21lZ3ZrdjBpMDFjOTJucjVtdHBpbWp6aiJ9.KNoKUUUFr1f_mC53ZjsPFg';

// Location data for India and UAE
const locationData = {
  IN: {
    name: 'India',
    states: {
      'AN': 'Andaman and Nicobar Islands',
      'AP': 'Andhra Pradesh',
      'AR': 'Arunachal Pradesh',
      'AS': 'Assam',
      'BR': 'Bihar',
      'CH': 'Chandigarh',
      'CT': 'Chhattisgarh',
      'DN': 'Dadra and Nagar Haveli',
      'DD': 'Daman and Diu',
      'DL': 'Delhi',
      'GA': 'Goa',
      'GJ': 'Gujarat',
      'HR': 'Haryana',
      'HP': 'Himachal Pradesh',
      'JK': 'Jammu and Kashmir',
      'JH': 'Jharkhand',
      'KA': 'Karnataka',
      'KL': 'Kerala',
      'LD': 'Lakshadweep',
      'MP': 'Madhya Pradesh',
      'MH': 'Maharashtra',
      'MN': 'Manipur',
      'ML': 'Meghalaya',
      'MZ': 'Mizoram',
      'NL': 'Nagaland',
      'OR': 'Odisha',
      'PY': 'Puducherry',
      'PB': 'Punjab',
      'RJ': 'Rajasthan',
      'SK': 'Sikkim',
      'TN': 'Tamil Nadu',
      'TG': 'Telangana',
      'TR': 'Tripura',
      'UP': 'Uttar Pradesh',
      'UT': 'Uttarakhand',
      'WB': 'West Bengal'
    },
    popularCities: {
      'MH': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
      'DL': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket'],
      'KA': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
      'TN': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
      'TG': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
      'GJ': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
      'RJ': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
      'UP': ['Lucknow', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi'],
      'WB': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
      'HR': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal']
    }
  },
  AE: {
    name: 'United Arab Emirates',
    states: {
      'AZ': 'Abu Dhabi',
      'SH': 'Sharjah',
      'DU': 'Dubai',
      'AJ': 'Ajman',
      'UQ': 'Umm Al Quwain',
      'RK': 'Ras Al Khaimah',
      'FU': 'Fujairah'
    },
    popularCities: {
      'DU': ['Dubai', 'Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Jumeirah', 'Dubai Hills', 'JBR', 'Palm Jumeirah', 'Dubai Sports City', 'International City'],
      'AZ': ['Abu Dhabi', 'Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Al Raha Beach', 'Khalifa City'],
      'SH': ['Sharjah', 'Al Nahda', 'Al Qasimia', 'Al Majaz', 'Al Khan'],
      'AJ': ['Ajman', 'Al Nuaimiya', 'Al Rashidiya', 'Al Jurf'],
      'RK': ['Ras Al Khaimah', 'Al Nakheel', 'Al Hamra'],
      'FU': ['Fujairah', 'Al Faseel', 'Sakamkam'],
      'UQ': ['Umm Al Quwain', 'Old Town', 'Al Salamah']
    }
  }
};

interface LocationAutocompleteProps {
  country?: string;
  state?: string;
  city?: string;
  locality?: string;
  address?: string;
  postalCode?: string;
  onLocationChange: (location: {
    country?: string;
    country_code?: string;
    state?: string;
    state_code?: string;
    city?: string;
    locality?: string;
    address?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  className?: string;
}

export default function LocationAutocomplete({
  country = '',
  state = '',
  city = '',
  locality = '',
  address = '',
  postalCode = '',
  onLocationChange,
  className
}: LocationAutocompleteProps) {
  const [selectedCountry, setSelectedCountry] = useState<'IN' | 'AE' | ''>('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState(city);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [localityValue, setLocalityValue] = useState(locality);
  const [addressValue, setAddressValue] = useState(address);
  const [postalCodeValue, setPostalCodeValue] = useState(postalCode);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  // Initialize country and state from props
  useEffect(() => {
    if (country) {
      const countryCode = Object.keys(locationData).find(
        code => locationData[code as keyof typeof locationData].name.toLowerCase() === country.toLowerCase()
      ) as 'IN' | 'AE' | '';
      setSelectedCountry(countryCode || '');
    }
  }, [country]);

  useEffect(() => {
    if (selectedCountry && state) {
      const stateCode = Object.keys(locationData[selectedCountry].states).find(
        code => locationData[selectedCountry].states[code].toLowerCase() === state.toLowerCase()
      );
      setSelectedState(stateCode || '');
    }
  }, [selectedCountry, state]);

  const handleCountryChange = (countryCode: 'IN' | 'AE') => {
    setSelectedCountry(countryCode);
    setSelectedState('');
    setSelectedCity('');
    setCitySuggestions([]);
    
    onLocationChange({
      country: locationData[countryCode].name,
      country_code: countryCode,
      state: '',
      state_code: '',
      city: '',
      locality: localityValue,
      address: addressValue,
      postal_code: postalCodeValue
    });
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedCity('');
    
    if (selectedCountry) {
      const cities = locationData[selectedCountry].popularCities[stateCode] || [];
      setCitySuggestions(cities);
      
      onLocationChange({
        country: locationData[selectedCountry].name,
        country_code: selectedCountry,
        state: locationData[selectedCountry].states[stateCode],
        state_code: stateCode,
        city: '',
        locality: localityValue,
        address: addressValue,
        postal_code: postalCodeValue
      });
    }
  };

  const handleCityInput = (value: string) => {
    setSelectedCity(value);
    
    if (selectedCountry && selectedState) {
      const allCities = locationData[selectedCountry].popularCities[selectedState] || [];
      const filtered = allCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(true);
    }
    
    updateLocation();
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCitySuggestions(false);
    updateLocation(cityName);
  };

  const updateLocation = (cityOverride?: string, coordinates?: { lat: number; lng: number }) => {
    if (selectedCountry) {
      onLocationChange({
        country: locationData[selectedCountry].name,
        country_code: selectedCountry,
        state: selectedState ? locationData[selectedCountry].states[selectedState] : '',
        state_code: selectedState,
        city: cityOverride || selectedCity,
        locality: localityValue,
        address: addressValue,
        postal_code: postalCodeValue,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng
      });
    }
  };

  // Geocode address to get coordinates
  const geocodeAddress = async () => {
    if (!addressValue || !selectedCity) {
      toast({
        title: "Missing Information",
        description: "Please enter both address and city to fetch map coordinates",
        variant: "destructive"
      });
      return;
    }

    setIsGeocoding(true);
    
    try {
      // Build full address for geocoding
      const fullAddress = [
        addressValue,
        localityValue,
        selectedCity,
        selectedState ? locationData[selectedCountry].states[selectedState] : '',
        locationData[selectedCountry].name,
        postalCodeValue
      ].filter(Boolean).join(', ');

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?` +
        `access_token=${MAPBOX_TOKEN}&limit=1`
      );

      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        // Update location with coordinates
        updateLocation(selectedCity, { lat, lng });
        
        toast({
          title: "Location Found",
          description: "Map has been updated with the address coordinates"
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find coordinates for this address. Please verify the address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch map coordinates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Auto-geocode when all address fields are filled
  useEffect(() => {
    const hasFullAddress = addressValue && selectedCity && postalCodeValue;
    if (hasFullAddress) {
      const timer = setTimeout(() => {
        geocodeAddress();
      }, 1500); // Wait 1.5 seconds after user stops typing
      
      return () => clearTimeout(timer);
    }
  }, [addressValue, selectedCity, postalCodeValue]);

  // Debounced update for text fields
  const debouncedLocationUpdate = useCallback(
    debounce(() => updateLocation(), 500),
    [selectedCountry, selectedState, selectedCity, localityValue, addressValue, postalCodeValue]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Selection */}
        <div>
          <Label htmlFor="country">Country</Label>
          <Select value={selectedCountry} onValueChange={(value) => handleCountryChange(value as 'IN' | 'AE')}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN">
                <div className="flex items-center gap-2">
                  <span>🇮🇳</span>
                  India
                </div>
              </SelectItem>
              <SelectItem value="AE">
                <div className="flex items-center gap-2">
                  <span>🇦🇪</span>
                  United Arab Emirates (Dubai)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State/Emirate Selection */}
        <div>
          <Label htmlFor="state">
            {selectedCountry === 'AE' ? 'Emirate' : 'State'}
          </Label>
          <Select 
            value={selectedState} 
            onValueChange={handleStateChange}
            disabled={!selectedCountry}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={`Select ${selectedCountry === 'AE' ? 'Emirate' : 'State'}`} />
            </SelectTrigger>
            <SelectContent>
              {selectedCountry && Object.entries(locationData[selectedCountry].states).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City Input with Autocomplete */}
        <div className="relative">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <Input
              id="city"
              value={selectedCity}
              onChange={(e) => handleCityInput(e.target.value)}
              onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              placeholder="Enter city name"
              disabled={!selectedState}
              className="mt-1 pr-8"
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-0.5" />
          </div>
          
          {/* City Suggestions Dropdown */}
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-auto">
              {citySuggestions.map((cityName) => (
                <div
                  key={cityName}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                  onClick={() => handleCitySelect(cityName)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {cityName}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Locality/Area */}
        <div>
          <Label htmlFor="locality">Locality/Area</Label>
          <Input
            id="locality"
            value={localityValue}
            onChange={(e) => {
              setLocalityValue(e.target.value);
              debouncedLocationUpdate();
            }}
            placeholder="Enter locality or area"
            disabled={!selectedCity}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Full Address */}
        <div>
          <Label htmlFor="address">Full Address</Label>
          <Input
            id="address"
            value={addressValue}
            onChange={(e) => {
              setAddressValue(e.target.value);
              debouncedLocationUpdate();
            }}
            placeholder="Enter complete address"
            className="mt-1"
          />
        </div>

        {/* Postal Code */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="postalCode">Postal/ZIP Code</Label>
            <Input
              id="postalCode"
              value={postalCodeValue}
              onChange={(e) => {
                setPostalCodeValue(e.target.value);
                debouncedLocationUpdate();
              }}
              placeholder={selectedCountry === 'IN' ? '6-digit PIN code' : 'ZIP code'}
              maxLength={selectedCountry === 'IN' ? 6 : 10}
              className="mt-1"
            />
          </div>
          
          {/* Fetch Coordinates Button */}
          <Button
            type="button"
            variant="outline"
            onClick={geocodeAddress}
            disabled={isGeocoding || !addressValue || !selectedCity}
            className="flex items-center gap-2"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Fetch Map Location
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground">
        <MapPin className="inline h-3 w-3 mr-1" />
        Enter complete address with postal code and click "Fetch Map Location" or wait for auto-detection
      </p>
    </div>
  );
}