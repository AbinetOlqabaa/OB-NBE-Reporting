/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DynamicAreaDefinition, DynamicRowRecord } from '../types/regulatory';
import { Plus, Trash2, Table as TableIcon } from 'lucide-react';
import { Pagination } from './Pagination';

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
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Schedule: {area._areaName || `Area ${area.Area}`}
          </h4>
          <span className="text-xs text-slate-500">
            ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
          </span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
              {area.DynamicItems.map((col) => (
                <th key={col.Code} className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                  <div>
                    <span className="text-slate-900">{col._description}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-mono">({col.Code})</span>
                    {col._required && <span className="text-red-500 ml-0.5">*</span>}
                  </div>
                </th>
              ))}
              {!readOnly && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={area.DynamicItems.length + (readOnly ? 1 : 2)}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No entries in this schedule. Click "Add Row" to enter borrower or asset details.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const rowIndex = (page - 1) * pageSize + index + 1;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono tabular-nums">
                      {rowIndex}
                    </td>
                    {area.DynamicItems.map((col) => {
                      const cellVal = row.values[col.Code] !== undefined ? row.values[col.Code] : '';
                      return (
                        <td key={col.Code} className="py-1 px-2">
                          {readOnly ? (
                            <div className={`px-2 py-1 truncate ${col._dataType === 'NUMERIC' ? 'text-right font-mono tabular-nums' : ''}`}>
                              {cellVal !== '' && cellVal !== undefined ? (
                                col._dataType === 'NUMERIC' && typeof cellVal === 'number'
                                  ? cellVal.toLocaleString('en-US')
                                  : String(cellVal)
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </div>
                          ) : (
                            <input
                              type={col._dataType === 'NUMERIC' ? 'number' : col._dataType === 'DATE' ? 'date' : 'text'}
                              value={cellVal}
                              placeholder={col._dataType === 'NUMERIC' ? '0.00' : 'Enter value...'}
                              onChange={(e) => {
                                const v = col._dataType === 'NUMERIC' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                                onUpdateCell(row.id, col.Code, v);
                              }}
                              className={`w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-red-600 focus:outline-none bg-white ${
                                col._dataType === 'NUMERIC' ? 'text-right font-mono tabular-nums' : ''
                              }`}
                            />
                          )}
                        </td>
                      );
                    })}
                    {!readOnly && (
                      <td className="py-1 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
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

      {/* Pagination for schedule rows */}
      {rows.length > pageSize && (
        <Pagination
          currentPage={page}
          totalItems={rows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
          itemName="schedule entries"
        />
      )}
    </div>
  );
};
