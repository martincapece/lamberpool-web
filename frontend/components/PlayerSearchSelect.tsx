'use client';

import { useMemo, useState } from 'react';

interface PlayerOption {
  id: string;
  name: string;
  number: number;
}

interface PlayerSearchSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: PlayerOption[];
  selectedId: string;
  onSelect: (playerId: string) => void;
  excludeId?: string;
}

export default function PlayerSearchSelect({
  id,
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  excludeId,
}: PlayerSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId),
    [options, selectedId]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return options
      .filter((option) => option.id !== excludeId)
      .filter((option) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${option.name} ${option.number}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [options, query, excludeId]);

  const inputValue = isOpen ? query : selectedOption ? `${selectedOption.name} (#${selectedOption.number})` : '';

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={(event) => {
          setQuery(event.target.value);
          if (selectedId) {
            onSelect('');
          }
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setQuery('');
          }, 150);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent ${
          isOpen ? 'rounded-b-none border-b-0' : ''
        }`}
      />

      {isOpen && (
        <div className="absolute z-20 mt-0 w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-300 bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelect(option.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full border-l-4 px-3 py-2 text-left text-sm transition ${
                    selectedId === option.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.name}</div>
                  <div className="text-xs text-gray-600">#{option.number}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500">Sin resultados.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
