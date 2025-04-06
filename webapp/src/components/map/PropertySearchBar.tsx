'use client';
import React from 'react';

interface PropertySearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  errorMessage: string | null;
}

export function PropertySearchBar({ 
  searchInput, 
  onSearchInputChange, 
  onSearch,
  errorMessage
}: PropertySearchBarProps) {
  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-gray-100 border-b border-gray-200">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search property number (e.g., 152/842)"
          className="flex-1 p-2 border rounded focus:border-kartAI-blue focus:ring-1 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-kartAI-blue text-white rounded hover:bg-kartAI-blue/90 transition-colors"
        >
          Søk
        </button>
      </div>
      {errorMessage && (
        <div className="mx-3 text-red-500 mb-2 p-2 bg-red-50 rounded text-sm">{errorMessage}</div>
      )}
    </>
  );
}
