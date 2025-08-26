import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWFzaHAxMjMiLCJhIjoiY21lZ3ZrdjBpMDFjOTJucjVtdHBpbWp6aiJ9.KNoKUUUFr1f_mC53ZjsPFg';

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  isEditable?: boolean;
  height?: string;
  className?: string;
}

export default function PropertyMap({
  latitude,
  longitude,
  address,
  onLocationChange,
  isEditable = false,
  height = 'h-96',
  className
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLat, setCurrentLat] = useState(latitude || 28.6139); // Default to Delhi
  const [currentLng, setCurrentLng] = useState(longitude || 77.2090);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [currentLng, currentLat],
      zoom: 14
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    marker.current = new mapboxgl.Marker({
      draggable: isEditable,
      color: '#3b82f6'
    })
      .setLngLat([currentLng, currentLat])
      .addTo(map.current);

    // Add popup with address
    if (address) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(address);
      marker.current.setPopup(popup);
    }

    // Handle marker drag
    if (isEditable) {
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        setCurrentLat(lngLat.lat);
        setCurrentLng(lngLat.lng);
        onLocationChange?.(lngLat.lat, lngLat.lng);
      });

      // Add click to place marker functionality
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current!.setLngLat([lng, lat]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        onLocationChange?.(lat, lng);
      });
    }

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (map.current && marker.current && latitude && longitude) {
      const newLat = latitude;
      const newLng = longitude;
      
      if (newLat !== currentLat || newLng !== currentLng) {
        marker.current.setLngLat([newLng, newLat]);
        map.current.flyTo({
          center: [newLng, newLat],
          zoom: 14,
          essential: true
        });
        setCurrentLat(newLat);
        setCurrentLng(newLng);
      }
    }
  }, [latitude, longitude]);

  // Update address popup
  useEffect(() => {
    if (marker.current && address) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(address);
      marker.current.setPopup(popup);
    }
  }, [address]);

  const handleRecenter = () => {
    if (map.current && marker.current) {
      const lngLat = marker.current.getLngLat();
      map.current.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 14,
        essential: true
      });
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <Card className={cn("relative overflow-hidden", className)}>
        <div 
          ref={mapContainer} 
          className={cn(
            "w-full",
            isFullscreen ? "fixed inset-0 z-50" : height
          )}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRecenter}
            className="shadow-md"
          >
            <MapPin className="h-4 w-4 mr-1" />
            Recenter
          </Button>
          
          {isEditable && (
            <div className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-md text-xs">
              <p className="font-medium">Click to place marker</p>
              <p className="text-muted-foreground">or drag marker to adjust</p>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleFullscreen}
          className="absolute top-4 right-14 shadow-md"
        >
          {isFullscreen ? (
            <X className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        {/* Coordinates Display */}
        {isEditable && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-md p-2 shadow-md text-xs">
            <p>Lat: {currentLat.toFixed(6)}</p>
            <p>Lng: {currentLng.toFixed(6)}</p>
          </div>
        )}
      </Card>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={handleFullscreen} />
      )}
    </>
  );
}