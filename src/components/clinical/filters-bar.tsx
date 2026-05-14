'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Download, RotateCcw, Filter, Plus, Trash2 } from 'lucide-react';
import type { FilterState } from '@/lib/clinical-data';

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onUpload: (file: File) => void;
  onExport: () => void;
  hasData: boolean;
  availableAgents: string[];
  availableClinics: string[];
}

export function FiltersBar({ filters, onFilterChange, onUpload, onExport, hasData, availableAgents, availableClinics }: FiltersBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom filter options state
  const [customClinics, setCustomClinics] = useState<string[]>([]);
  const [removedClinics, setRemovedClinics] = useState<string[]>([]);
  const [customAgents, setCustomAgents] = useState<string[]>([]);
  const [removedAgents, setRemovedAgents] = useState<string[]>([]);

  // Modal dialog management
  const [activeModal, setActiveModal] = useState<'add_clinic' | 'remove_clinic' | 'add_agent' | 'remove_agent' | null>(null);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    try {
      const cc = localStorage.getItem('ra_custom_clinics');
      if (cc) setCustomClinics(JSON.parse(cc));
      const rc = localStorage.getItem('ra_removed_clinics');
      if (rc) setRemovedClinics(JSON.parse(rc));
      const ca = localStorage.getItem('ra_custom_agents');
      if (ca) setCustomAgents(JSON.parse(ca));
      const ra = localStorage.getItem('ra_removed_agents');
      if (ra) setRemovedAgents(JSON.parse(ra));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddClinic = () => {
    const name = inputVal.trim();
    if (!name) return;
    const updated = [...customClinics, name];
    setCustomClinics(updated);
    try { localStorage.setItem('ra_custom_clinics', JSON.stringify(updated)); } catch (e) {}
    onFilterChange({ ...filters, clinic: name });
    setActiveModal(null);
    setInputVal('');
  };

  const handleRemoveClinicItem = (name: string) => {
    if (customClinics.includes(name)) {
      const updated = customClinics.filter(c => c !== name);
      setCustomClinics(updated);
      try { localStorage.setItem('ra_custom_clinics', JSON.stringify(updated)); } catch (e) {}
    } else {
      const updated = [...removedClinics, name];
      setRemovedClinics(updated);
      try { localStorage.setItem('ra_removed_clinics', JSON.stringify(updated)); } catch (e) {}
    }
    if (filters.clinic === name) {
      onFilterChange({ ...filters, clinic: 'all' });
    }
  };

  const handleAddAgent = () => {
    const name = inputVal.trim();
    if (!name) return;
    const updated = [...customAgents, name];
    setCustomAgents(updated);
    try { localStorage.setItem('ra_custom_agents', JSON.stringify(updated)); } catch (e) {}
    onFilterChange({ ...filters, agent: name });
    setActiveModal(null);
    setInputVal('');
  };

  const handleRemoveAgentItem = (name: string) => {
    if (customAgents.includes(name)) {
      const updated = customAgents.filter(a => a !== name);
      setCustomAgents(updated);
      try { localStorage.setItem('ra_custom_agents', JSON.stringify(updated)); } catch (e) {}
    } else {
      const updated = [...removedAgents, name];
      setRemovedAgents(updated);
      try { localStorage.setItem('ra_removed_agents', JSON.stringify(updated)); } catch (e) {}
    }
    if (filters.agent === name) {
      onFilterChange({ ...filters, agent: 'all' });
    }
  };

  // Derive final combined lists
  const finalClinics = Array.from(new Set([...availableClinics, ...customClinics]))
    .filter(c => !removedClinics.includes(c))
    .sort();

  const finalAgents = Array.from(new Set([...availableAgents, ...customAgents]))
    .filter(a => !removedAgents.includes(a))
    .sort();

  // Active combined view lists for remove modal
  const allRemovableClinics = Array.from(new Set([...availableClinics, ...customClinics])).sort();
  const allRemovableAgents = Array.from(new Set([...availableAgents, ...customAgents])).sort();

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-slate-400 flex-shrink-0" />

          {/* Clinic Select */}
          <Select
            value={filters.clinic}
            onValueChange={(v) => {
              if (v === '__add') {
                setActiveModal('add_clinic');
              } else if (v === '__remove') {
                setActiveModal('remove_clinic');
              } else {
                onFilterChange({ ...filters, clinic: v });
              }
            }}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Clinics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {finalClinics.map(c => (
                <SelectItem key={c} value={c}>
                  {c.replace(' Allergy', '')}
                </SelectItem>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <SelectItem value="__add" className="text-teal-600 font-medium focus:bg-teal-50/50">
                ➕ Add Clinic...
              </SelectItem>
              <SelectItem value="__remove" className="text-red-600 font-medium focus:bg-red-50/50">
                ➖ Remove Clinic...
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Individual Select */}
          <Select
            value={filters.agent}
            onValueChange={(v) => {
              if (v === '__add') {
                setActiveModal('add_agent');
              } else if (v === '__remove') {
                setActiveModal('remove_agent');
              } else {
                onFilterChange({ ...filters, agent: v });
              }
            }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Individuals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Individuals</SelectItem>
              {finalAgents.map(a => (
                <SelectItem key={a} value={a}>
                  {a.split(' ')[0]}
                </SelectItem>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <SelectItem value="__add" className="text-teal-600 font-medium focus:bg-teal-50/50">
                ➕ Add Individual...
              </SelectItem>
              <SelectItem value="__remove" className="text-red-600 font-medium focus:bg-red-50/50">
                ➖ Remove Individual...
              </SelectItem>
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
            onClick={() => {
              onFilterChange({ clinic: 'all', agent: 'all', dateFrom: '', dateTo: '' });
              // Also optionally clear custom states if user wants full reset? Keeping custom entries is better
            }}
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

      {/* ─── Modal Dialogs ─── */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => { if (!open) { setActiveModal(null); setInputVal(''); } }}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl border border-slate-200 shadow-lg p-6">
          {activeModal === 'add_clinic' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">Add Custom Clinic</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter the full name of the new clinic to add to the selection filters.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="e.g. Downtown Care Center"
                  className="h-9 text-xs border-slate-200"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddClinic(); }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddClinic}>Add Clinic</Button>
              </DialogFooter>
            </>
          )}

          {activeModal === 'add_agent' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">Add Custom Individual</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter the full name of the individual to include in the tracker dropdowns.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="h-9 text-xs border-slate-200"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddAgent(); }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAddAgent}>Add Individual</Button>
              </DialogFooter>
            </>
          )}

          {activeModal === 'remove_clinic' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">Manage & Remove Clinics</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Click the trash icon to hide any unused or deprecated clinic from your dropdown filter list.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 max-h-[220px] overflow-y-auto space-y-1.5 border-y border-slate-100 my-2">
                {allRemovableClinics.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No clinics available.</p>
                ) : (
                  allRemovableClinics.map(c => {
                    const isRemoved = removedClinics.includes(c);
                    return (
                      <div key={c} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                        isRemoved ? 'bg-slate-50 border-slate-100 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <span>{c}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${isRemoved ? 'text-slate-300 hover:text-slate-400' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}
                          onClick={() => handleRemoveClinicItem(c)}
                          title={isRemoved ? 'Restore' : 'Remove'}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              <DialogFooter>
                <Button size="sm" className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white w-full" onClick={() => setActiveModal(null)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}

          {activeModal === 'remove_agent' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">Manage & Remove Individuals</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Click the trash icon to exclude any team member from the filter selections.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 max-h-[220px] overflow-y-auto space-y-1.5 border-y border-slate-100 my-2">
                {allRemovableAgents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No individuals available.</p>
                ) : (
                  allRemovableAgents.map(a => {
                    const isRemoved = removedAgents.includes(a);
                    return (
                      <div key={a} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                        isRemoved ? 'bg-slate-50 border-slate-100 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <span>{a}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${isRemoved ? 'text-slate-300 hover:text-slate-400' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}
                          onClick={() => handleRemoveAgentItem(a)}
                          title={isRemoved ? 'Restore' : 'Remove'}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              <DialogFooter>
                <Button size="sm" className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white w-full" onClick={() => setActiveModal(null)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
