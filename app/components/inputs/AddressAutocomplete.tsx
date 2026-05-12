import { useRef, useEffect, useState } from "react";
import { useGooglePlaces, type ParsedAddress } from "~/hooks/useGooglePlaces";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({ value, onSelect, placeholder, disabled }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ready, error, initAutocomplete } = useGooglePlaces();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (inputRef.current && ready) {
      initAutocomplete(inputRef.current, (parsed) => {
        setLocalValue(parsed.formattedAddress);
        onSelect(parsed);
      });
    }
  }, [ready, initAutocomplete, onSelect]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder ?? "Start typing address..."}
          disabled={disabled || !ready}
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100"
        />
      </div>
      {error && (
        <p className="text-xs text-amber-600 mt-1">{error}</p>
      )}
      {!ready && !error && (
        <p className="text-xs text-gray-400 mt-1">Loading address search...</p>
      )}
    </div>
  );
}
