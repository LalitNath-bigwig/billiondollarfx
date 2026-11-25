"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Dark-themed searchable dropdown used instead of a native <select> for long
 * lists (e.g. the IDR bank list). Keyboard: Arrow keys move, Enter selects,
 * Escape closes. Closes on outside click.
 */
export default function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  disabled = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (v: string) => {
    onChange(v);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].value);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-left focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected ? "text-white" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-700 bg-[#111827] shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto py-1 [scrollbar-width:thin] [scrollbar-color:#374151_transparent]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">{emptyText}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                    i === active ? "bg-gray-700/70 text-white" : "text-gray-200"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check size={14} className="flex-shrink-0 text-blue-400" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
