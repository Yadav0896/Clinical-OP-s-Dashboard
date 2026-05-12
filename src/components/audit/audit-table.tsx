"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAuditLogs, type AuditLog } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700",
  updated: "bg-blue-100 text-blue-700",
  submitted: "bg-purple-100 text-purple-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
  appealed: "bg-amber-100 text-amber-700",
  stage_changed: "bg-indigo-100 text-indigo-700",
  viewed: "bg-slate-100 text-slate-600",
  deleted: "bg-red-100 text-red-700",
};

export function AuditTable() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actionFilter],
    queryFn: () => fetchAuditLogs({ page, limit: 50, action: actionFilter || undefined }),
  });

  const logs = data?.auditLogs || [];
  const pagination = data?.pagination;

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="animate-fade-in">
      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Filter by action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {["created", "updated", "submitted", "approved", "denied", "appealed", "stage_changed", "viewed", "deleted"].map((a) => (
                <SelectItem key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-slate-400">
          {pagination?.total || 0} total logs
        </span>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-shimmer mb-3 h-10 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No audit logs found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 uppercase">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 uppercase">User</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 uppercase">Action</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 uppercase">Entity</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400 uppercase">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedRow === log.id;
                  let parsedDetails: string | object | null = null;
                  try {
                    parsedDetails = log.details ? JSON.parse(log.details) : null;
                  } catch {
                    parsedDetails = log.details ?? null;
                  }

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <TableCell className="w-8 p-2">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {log.user?.name || "System"}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px]", ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600")}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {log.entity}
                          {log.submission?.drugName && (
                            <span className="text-slate-400"> ({log.submission.drugName})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-xs truncate">
                          {typeof parsedDetails === "string" ? parsedDetails : log.details ? "Click to expand" : "—"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-detail`}>
                          <TableCell colSpan={6} className="bg-slate-50 px-8 py-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <h5 className="mb-1 text-xs font-semibold text-slate-600">Details</h5>
                              <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin font-mono">
                                {typeof parsedDetails === "object" ? JSON.stringify(parsedDetails, null, 2) : String(log.details || "No details")}
                              </pre>
                              <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
                                {log.entityId && <span>Entity ID: {log.entityId}</span>}
                                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
