'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Upload, Download, RotateCcw, Filter } from 'lucide-react';
import type { FilterState } from '@/lib/clinical-data';
import { AGENTS, CLINICS } from '@/lib/clinical-data';

  hasData: boolean;
  availableAgents: string[];
  availableClinics: string[];
}

export function FiltersBar({ filters, onFilterChange, onUpload, onExport, hasData, availableAgents, availableClinics }: FiltersBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={15} className="text-slate-400 flex-shrink-0" />

        <Select
          value={filters.clinic}
          onValueChange={(v) => onFilterChange({ ...filters, clinic: v })}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs bg-slate-50 border-slate-200">
            <SelectValue placeholder="All Clinics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {availableClinics.map(c => (
              <SelectItem key={c} value={c}>
                {c.replace(' Allergy', '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.agent}
          onValueChange={(v) => onFilterChange({ ...filters, agent: v })}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs bg-slate-50 border-slate-200">
            <SelectValue placeholder="All Individuals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Individuals</SelectItem>
            {availableAgents.map(a => (
              <SelectItem key={a} value={a}>
                {a.split(' ')[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
          className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200"
          placeholder="From"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
          className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200"
          placeholder="To"
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-slate-400 hover:text-slate-600"
          onClick={() => onFilterChange({ clinic: 'all', agent: 'all', dateFrom: '', dateTo: '' })}
        >
          <RotateCcw size={13} />
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={13} className="mr-1.5" />
          Upload Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />

        {hasData && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={onExport}
          >
            <Download size={13} className="mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>
    </div>
  );
}
