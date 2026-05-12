/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";

let scriptLoaded = false;
let scriptCallbacks: Array<(success: boolean) => void> = [];

function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve(true);
      return;
    }
    if (window.google?.maps?.places) {
      scriptLoaded = true;
      resolve(true);
      return;
    }

    scriptCallbacks.push(resolve);

    // Only create script once
    if (document.querySelector('script[data-google-places]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-places", "true");
    script.onload = () => {
      scriptLoaded = true;
      scriptCallbacks.forEach((cb) => cb(true));
      scriptCallbacks = [];
    };
    script.onerror = () => {
      scriptCallbacks.forEach((cb) => cb(false));
      scriptCallbacks = [];
    };
    document.head.appendChild(script);
  });
}

export interface ParsedAddress {
  formattedAddress: string;
  streetNumber: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

function parsePlaceResult(place: google.maps.places.PlaceResult): ParsedAddress {
  const getComponent = (type: string) =>
    place.address_components?.find((c: google.maps.GeocoderAddressComponent) => c.types.includes(type))?.long_name ?? "";
  const getComponentShort = (type: string) =>
    place.address_components?.find((c: google.maps.GeocoderAddressComponent) => c.types.includes(type))?.short_name ?? "";

  return {
    formattedAddress: place.formatted_address ?? "",
    streetNumber: getComponent("street_number"),
    street: getComponent("route"),
    suburb: getComponent("locality") || getComponent("postal_town"),
    state: getComponentShort("administrative_area_level_1"),
    postcode: getComponent("postal_code"),
    country: getComponent("country"),
  };
}

export function useGooglePlaces(apiKey?: string) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const key = apiKey ?? import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    if (!key) {
      setError("Google Places API key not configured");
      return;
    }
    loadGoogleMapsScript(key).then((success) => {
      if (success) {
        setReady(true);
      } else {
        setError("Failed to load Google Places");
      }
    });
  }, [key]);

  const initAutocomplete = useCallback(
    (input: HTMLInputElement, onSelect: (address: ParsedAddress) => void) => {
      if (!ready || !window.google?.maps?.places) return;

      inputRef.current = input;

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "au" },
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onSelect(parsePlaceResult(place));
        }
      });
    },
    [ready]
  );

  return { ready, error, initAutocomplete };
}
