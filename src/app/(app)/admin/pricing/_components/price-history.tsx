"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMPTY_VALUE, formatDateTime } from "@/lib/format";

import { FIELD_LABELS, type PriceHistoryEntry } from "../pricing-shared";

function displayValue(v: string | number | null): string {
  if (v === null || v === undefined || v === "") return EMPTY_VALUE;
  return String(v);
}

export function PriceHistory({
  history,
  userMap,
}: {
  history: PriceHistoryEntry[];
  userMap: Record<string, string>;
}) {
  // Newest first; price_history is appended in chronological order.
  const rows = [...history].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price history</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title="No changes recorded"
            description="Field changes are logged here automatically."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e, i) => (
                <TableRow key={`${e.updated_at}-${e.field}-${i}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(e.updated_at)}
                  </TableCell>
                  <TableCell>{FIELD_LABELS[e.field] ?? e.field}</TableCell>
                  <TableCell className="tabular-nums">
                    {displayValue(e.old_value)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {displayValue(e.new_value)}
                  </TableCell>
                  <TableCell>
                    {e.updated_by
                      ? (userMap[e.updated_by] ?? "Unknown")
                      : EMPTY_VALUE}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
