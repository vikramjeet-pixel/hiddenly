"use client";

import { useState } from "react";
import { filterOptions } from "@/data/mockData";

export default function FilterBar() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div
      id="filter-bar"
      className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide"
    >
      {filterOptions.map((filter) => (
        <button
          key={filter}
          id={`filter-${filter.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setActiveFilter(filter)}
          className={`shrink-0 px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all active:scale-95 ${
            activeFilter === filter
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:text-primary"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
