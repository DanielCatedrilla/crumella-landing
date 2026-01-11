"use client";
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix for default marker icon in Next.js/Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DEFAULT_CENTER = { lat: 10.7202, lng: 122.5621 };

function SearchField({ setPosition, onLocationSelect }: { setPosition: (pos: L.LatLng) => void, onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap();
  // Use refs to hold the latest callback functions to avoid re-running the effect
  const onLocationSelectRef = useRef(onLocationSelect);
  const setPositionRef = useRef(setPosition);
  const searchControlRef = useRef<any>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
    setPositionRef.current = setPosition;
  }, [onLocationSelect, setPosition]);

  useEffect(() => {
    if (!map) return;

    const provider = new OpenStreetMapProvider();
    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false, // We handle the marker manually
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Search address...',
    });

    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    const handleShowLocation = (e: any) => {
      const latlng = L.latLng(e.location.y, e.location.x);
      setPositionRef.current(latlng);
      onLocationSelectRef.current(e.location.y, e.location.x);
    };

    map.on('geosearch/showlocation', handleShowLocation);

    return () => {
      map.off('geosearch/showlocation', handleShowLocation);
      if (searchControlRef.current) {
        try {
          map.removeControl(searchControlRef.current);
        } catch (e) {
          // Prevent crash if map is already destroyed
        }
        searchControlRef.current = null;
      }
    };
  }, [map]); // Only run on map mount

  return null;
}

function MapControls() {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLocationFound = () => setLoading(false);
    const handleLocationError = () => {
      setLoading(false);
      alert("Could not access your location. Please check your browser permissions.");
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map]);

  const handleFindMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    map.locate();
  };

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.flyTo(DEFAULT_CENTER, 13);
  };

  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={handleFindMe}
        disabled={loading}
        title="Find My Location"
        className="bg-white text-black p-2 rounded-lg shadow-md border-2 border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={handleRecenter}
        title="Recenter Map"
        className="bg-white text-black p-2 rounded-lg shadow-md border-2 border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center w-10 h-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

function LocationMarker({ position, setPosition, onLocationSelect }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

export default function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-96 md:h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200 z-0 relative mt-4">
      <style>{`
        .leaflet-control-geosearch form {
          background: white !important;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 2px;
          max-width: 200px;
        }
        .leaflet-control-geosearch form input {
          color: #000 !important;
          background: transparent !important;
          outline: none;
          height: 36px;
          font-size: 12px;
          font-weight: bold;
        }
        .leaflet-control-geosearch .results {
          background: white !important;
          color: black !important;
          border-radius: 0.75rem;
          margin-top: 4px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
        }
        .leaflet-control-geosearch .results > * {
          background: white !important;
          color: black !important;
          padding: 8px;
          cursor: pointer;
        }
        .leaflet-control-geosearch .results > .active,
        .leaflet-control-geosearch .results > :hover {
          background-color: #f3f4f6 !important;
          color: black !important;
        }
        .leaflet-control-geosearch a.reset {
          color: #666 !important;
          background: transparent !important;
          line-height: 36px;
          padding: 0 8px;
        }
      `}</style>
      <MapContainer ref={mapRef} center={DEFAULT_CENTER} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SearchField setPosition={setPosition} onLocationSelect={onLocationSelect} />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
        <MapControls />
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-[10px] z-[1000] shadow-md font-bold text-gray-600 pointer-events-none">
        Tap map to pin exact location
      </div>
    </div>
  );
}
