"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { XIcon } from "@/components/Icons";

interface Props {
  lgas: string[];
  onChange: (lgas: string[]) => void;
  availableLgas?: string[];
  placeholder?: string;
}

export default function LGAInput({
  lgas,
  onChange,
  availableLgas = [],
  placeholder = "Type LGA and press Enter or comma",
}: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (val: string) => {
    const v = val.trim();
    if (!v || lgas.includes(v)) return;
    onChange([...lgas, v]);
    setInput("");
    setSuggestions([]);
  };

  const remove = (lga: string) => onChange(lgas.filter((l) => l !== lga));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input.replace(/,/g, "").trim());
    }
    if (e.key === "Backspace" && input === "" && lgas.length > 0) {
      onChange(lgas.slice(0, -1));
    }
  };

  const handleChange = (val: string) => {
    // Handle paste with commas — split and add complete parts
    if (val.includes(",")) {
      const parts = val
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const toAdd = parts.slice(0, -1).filter((p) => !lgas.includes(p));
      const remaining = parts[parts.length - 1] ?? "";
      if (toAdd.length > 0) onChange([...lgas, ...toAdd]);
      setInput(remaining);
      updateSuggestions(remaining);
      return;
    }
    setInput(val);
    updateSuggestions(val);
  };

  const updateSuggestions = (val: string) => {
    if (!val || availableLgas.length === 0) {
      setSuggestions([]);
      return;
    }
    setSuggestions(
      availableLgas
        .filter(
          (l) =>
            l.toLowerCase().includes(val.toLowerCase()) && !lgas.includes(l),
        )
        .slice(0, 6),
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Tag input container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-[42px] w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-2 py-1.5
          flex flex-wrap gap-1.5 items-center focus-within:border-[#ff2d2d] transition-colors cursor-text"
      >
        {/* Existing LGA tags */}
        {lgas.map((lga) => (
          <span
            key={lga}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 text-[#ff2d2d] rounded-lg text-[12px] font-medium shrink-0"
          >
            {lga}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(lga);
              }}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center opacity-70 hover:opacity-100 transition-opacity"
            >
              <XIcon size={10} color="currentColor" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) add(input);
            setTimeout(() => setSuggestions([]), 200);
          }}
          placeholder={lgas.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444] py-0.5"
        />
      </div>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg z-10">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="w-full text-left px-3 py-2.5 text-[13px] text-[#aaa] hover:bg-white/5 hover:text-[#e0e0e0] transition-colors bg-transparent border-none cursor-pointer border-b border-[#1e1e1e] last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[#444]">
        Press{" "}
        <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[9px]">
          Enter
        </kbd>{" "}
        or{" "}
        <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[9px]">
          ,
        </kbd>{" "}
        to add ·{" "}
        <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[9px]">
          Backspace
        </kbd>{" "}
        to remove last
      </p>
    </div>
  );
}
