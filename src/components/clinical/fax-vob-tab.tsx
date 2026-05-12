'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ClinicalRecord } from '@/lib/clinical-data';

interface FaxVobTabProps {
  data: ClinicalRecord[];
}

export function FaxVobTab({ data }: FaxVobTabProps) {
  // ─── KPIs ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    const faxReceived = data.reduce((s, r) => s + r.faxReceived, 0);
    const faxClassified = data.reduce((s, r) => s + r.faxClassified, 0);
    const faxRate = faxReceived > 0 ? Math.round((faxClassified / faxReceived) * 100) : 0;
    const vobTotal = data.reduce((s, r) => s + r.vobTotal, 0);
    const vobMatched = data.reduce((s, r) => s + r.vobMatched, 0);
    const vobRate = vobTotal > 0 ? Math.round((vobMatched / vobTotal) * 100) : 0;
    return { faxReceived, faxClassified, faxRate, vobTotal, vobMatched, vobRate };
  }, [data]);

  // ─── Fax Chart by Clinic ────────────────────────────────
  const faxChartData = useMemo(() => {
    const map = new Map<string, { received: number; classified: number; forwarded: number }>();
    for (const r of data) {
      const clinic = r.clinic || 'Unknown';
      if (!map.has(clinic)) map.set(clinic, { received: 0, classified: 0, forwarded: 0 });
      const d = map.get(clinic)!;
      d.received += r.faxReceived;
      d.classified += r.faxClassified;
      d.forwarded += r.faxForwarded;
    }
    return Array.from(map.entries()).map(([clinic, d]) => ({
      clinic: clinic.replace(' Allergy', ''),
      ...d,
    }));
  }, [data]);

  // ─── VOB Chart by Clinic ────────────────────────────────
  const vobChartData = useMemo(() => {
    const map = new Map<string, { total: number; matched: number }>();
    for (const r of data) {
      const clinic = r.clinic || 'Unknown';
      if (!map.has(clinic)) map.set(clinic, { total: 0, matched: 0 });
      const d = map.get(clinic)!;
      d.total += r.vobTotal;
      d.matched += r.vobMatched;
    }
    return Array.from(map.entries()).map(([clinic, d]) => ({
      clinic: clinic.replace(' Allergy', ''),
      ...d,
      rate: d.total > 0 ? Math.round((d.matched / d.total) * 100) : 0,
    }));
  }, [data]);

  // ─── Fax Daily Log ──────────────────────────────────────
  const faxLog = useMemo(() => {
    return data
      .filter(r => r.faxReceived > 0)
      .map(r => ({
        ...r,
        rate: r.faxReceived > 0 ? Math.round((r.faxClassified / r.faxReceived) * 100) : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  // ─── VOB Daily Log ──────────────────────────────────────
  const vobLog = useMemo(() => {
    return data
      .filter(r => r.vobTotal > 0)
      .map(r => ({
        ...r,
        rate: r.vobTotal > 0 ? Math.round((r.vobMatched / r.vobTotal) * 100) : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const kpiCards = [
    { label: 'Total Fax Received', value: kpis.faxReceived.toLocaleString(), color: '#F59E0B', sub: `${kpis.faxClassified.toLocaleString()} classified` },
    { label: 'Fax Classification Rate', value: `${kpis.faxRate}%`, color: '#F59E0B', sub: 'Classified / Received' },
    { label: 'Total VOB Processed', value: kpis.vobTotal.toLocaleString(), color: '#EF4444', sub: `${kpis.vobMatched.toLocaleString()} matched` },
    { label: 'VOB Match Rate', value: `${kpis.vobRate}%`, color: '#EF4444', sub: 'Matched / Total' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Card key={card.label} className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="h-[3px]" style={{ background: card.color }} />
            <CardContent className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {card.label}
              </div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700">Fax Pipeline by Clinic</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={faxChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="clinic" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 600, color: '#1E293B' }} />
                <Bar dataKey="received" name="Received" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="classified" name="Classified" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forwarded" name="Forwarded" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700">VOB Match Rate by Clinic</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={vobChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="clinic" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 600, color: '#1E293B' }} />
                <Bar dataKey="rate" name="Match %" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fax Daily Log */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">Fax Daily Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[350px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Date</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Clinic</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Agent</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Recv</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Classified</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Fail</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Fwd</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Fwd Fail</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Renamed</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faxLog.map((r, i) => (
                  <TableRow key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-2.5 text-xs text-slate-600">{r.date}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-600">{r.clinic.replace(' Allergy', '')}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 font-medium">{r.agent.split(' ')[0]}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 text-right font-medium">{r.faxReceived}</TableCell>
                    <TableCell className="py-2.5 text-xs text-emerald-600 text-right">{r.faxClassified}</TableCell>
                    <TableCell className="py-2.5 text-xs text-red-500 text-right">{r.faxClassifFailed}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-600 text-right">{r.faxForwarded}</TableCell>
                    <TableCell className="py-2.5 text-xs text-red-500 text-right">{r.faxFwdFailed}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-600 text-right">{r.faxRenamed}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 text-right font-semibold">{r.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* VOB Daily Log */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">VOB Daily Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[350px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Date</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Clinic</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Agent</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Total</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Matched</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Unmatched</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Created</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Updated</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Match %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vobLog.map((r, i) => (
                  <TableRow key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-2.5 text-xs text-slate-600">{r.date}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-600">{r.clinic.replace(' Allergy', '')}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 font-medium">{r.agent.split(' ')[0]}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 text-right font-medium">{r.vobTotal}</TableCell>
                    <TableCell className="py-2.5 text-xs text-emerald-600 text-right">{r.vobMatched}</TableCell>
                    <TableCell className="py-2.5 text-xs text-red-500 text-right">{r.vobUnmatched}</TableCell>
                    <TableCell className="py-2.5 text-xs text-blue-600 text-right">{r.vobCreated}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-600 text-right">{r.vobUpdated}</TableCell>
                    <TableCell className="py-2.5 text-xs text-slate-700 text-right font-semibold">{r.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
