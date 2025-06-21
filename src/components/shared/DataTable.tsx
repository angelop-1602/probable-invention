'use client'

import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface DataTableProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  columns: {
    header: string;
    accessorKey: keyof T;
  }[];
}

export function DataTable<T>({ data, isLoading, columns }: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  if (!data?.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((column) => (
              <th key={String(column.accessorKey)} className="p-4 text-left text-sm font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b">
              {columns.map((column) => (
                <td key={String(column.accessorKey)} className="p-4 text-sm">
                  {String(row[column.accessorKey])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 