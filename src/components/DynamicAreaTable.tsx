/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DynamicAreaDefinition, DynamicRowRecord } from '../types/regulatory.ts';
import { Plus, Trash2, Table as TableIcon } from 'lucide-react';
import { Pagination } from './Pagination.tsx';

interface DynamicAreaTableProps {
  area: DynamicAreaDefinition;
  rows: DynamicRowRecord[];
  readOnly?: boolean;
  onAddRow: () => void;
  onUpdateCell: (rowId: string, columnCode: string, value: any) => void;
  onDeleteRow: (rowId: string) => void;
}

export const DynamicAreaTable: React.FC<DynamicAreaTableProps> = ({
  area,
  rows,
  readOnly = false,
  onAddRow,
  onUpdateCell,
  onDeleteRow,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    // If rows deleted and page is now out of range
    const maxPage = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [rows.length, pageSize, page]);

  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs transition-colors">
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Schedule: {area._areaName || `Area ${area.Area}`}
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
          </span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ob-indigo-700 dark:text-ob-indigo-300 bg-ob-indigo-50 dark:bg-ob-indigo-950/60 hover:bg-ob-indigo-100 dark:hover:bg-ob-indigo-900/60 rounded-lg border border-ob-indigo-200 dark:border-ob-indigo-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center text-slate-400 dark:text-slate-500">#</th>
              {area.DynamicItems.map((col) => (
                <th key={col.Code} className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                  <div>
                    <span className="text-slate-900 dark:text-slate-100">{col._description}</span>
                    <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">({col.Code})</span>
                    {col._required && <span className="text-rose-500 ml-0.5">*</span>}
                  </div>
                </th>
              ))}
              {!readOnly && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={area.DynamicItems.length + (readOnly ? 1 : 2)}
                  className="py-8 text-center text-slate-400 dark:text-slate-500 italic"
                >
                  No entries in this schedule. Click "Add Row" to enter borrower or asset details.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const rowIndex = (page - 1) * pageSize + index + 1;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                      {rowIndex}
                    </td>

                    {area.DynamicItems.map((col) => {
                      const val = (row.values && row.values[col.Code] !== undefined) ? row.values[col.Code] : ((row as any)[col.Code] ?? '');
                      return (
                        <td key={col.Code} className="py-1.5 px-2">
                          {readOnly ? (
                            <span className="text-slate-800 dark:text-slate-200 font-medium font-mono text-xs">
                              {val !== '' ? String(val) : '-'}
                            </span>
                          ) : (
                            <input
                              type={col._dataType === 'NUMERIC' ? 'number' : col._dataType === 'DATE' ? 'date' : 'text'}
                              value={val}
                              placeholder={col._dataType === 'NUMERIC' ? '0.00' : 'Enter...'}
                              onChange={(e) => {
                                const newVal =
                                  col._dataType === 'NUMERIC'
                                    ? e.target.value === ''
                                      ? ''
                                      : Number(e.target.value)
                                    : e.target.value;
                                onUpdateCell(row.id, col.Code, newVal);
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:border-ob-indigo-500 focus:outline-none"
                            />
                          )}
                        </td>
                      );
                    })}

                    {!readOnly && (
                      <td className="py-1.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Pagination
            currentPage={page}
            totalItems={rows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemName="schedule rows"
          />
        </div>
      )}
    </div>
  );
};
