/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ReportMetadata,
  ReportSubmission,
  DynamicRowRecord,
  UserSession,
} from '../types/regulatory';
import { DynamicAreaTable } from './DynamicAreaTable';
import { FormulaEngine } from '../utils/formulaEngine';
import { ValidationEngine, ValidationSummary } from '../utils/validationEngine';
import { ExcelService } from '../utils/excelService';
import { Pagination } from './Pagination';
import { PdfReportGenerator } from '../utils/pdfReportGenerator';
import {
  Save,
  Send,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Calendar,
  Building,
  ArrowLeft,
  Info,
  Layers,
  Table as TableIcon,
  FileText,
} from 'lucide-react';

interface DynamicReportFormProps {
  metadata: ReportMetadata;
  submission: ReportSubmission;
  currentUser: UserSession;
  readOnly?: boolean;
  onBack: () => void;
  onSave: (values: Record<string, string | number>, dynamicRows: Record<number, DynamicRowRecord[]>) => void;
  onSubmitToChecker: (comment: string) => void;
}

export const DynamicReportForm: React.FC<DynamicReportFormProps> = ({
  metadata,
  submission,
  currentUser,
  readOnly = false,
  onBack,
  onSave,
  onSubmitToChecker,
}) => {
  const [values, setValues] = useState<Record<string, string | number>>(submission.values || {});
  const [dynamicRows, setDynamicRows] = useState<Record<number, DynamicRowRecord[]>>(submission.dynamicRows || {});
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [submitComment, setSubmitComment] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('ALL');
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'ITEMS' | 'DYNAMIC_SCHEDULES'>('ITEMS');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination for Fixed Return Items
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(10);

  useEffect(() => {
    setItemsPage(1);
  }, [filterQuery, itemTypeFilter]);

  // Filter items
  const filteredItems = metadata.ReturnItemsList.filter((item) => {
    const matchesQuery =
      !filterQuery ||
      item._description.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.Code.toLowerCase().includes(filterQuery.toLowerCase());

    const isFormula = metadata.Formulas.some((f) => f.targetCode === item.Code);
    const val = values[item.Code];
    const isPopulated = val !== '' && val !== undefined && val !== null && val !== 0;

    let matchesType = true;
    if (itemTypeFilter === 'REQUIRED') matchesType = !!item._required;
    else if (itemTypeFilter === 'FORMULA_TOTAL') matchesType = isFormula || !!item.isTotal;
    else if (itemTypeFilter === 'DIRECT_INPUT') matchesType = !isFormula && !item.isTotal;
    else if (itemTypeFilter === 'POPULATED') matchesType = isPopulated;
    else if (itemTypeFilter === 'EMPTY') matchesType = !isPopulated;

    return matchesQuery && matchesType;
  });

  // Paginated items slice
  const paginatedItems = filteredItems.slice(
    (itemsPage - 1) * itemsPageSize,
    itemsPage * itemsPageSize
  );

  // Initial validation & formula calculation
  useEffect(() => {
    recalculateAndValidate(values, dynamicRows);
  }, []);

  const recalculateAndValidate = (
    currentValues: Record<string, string | number>,
    currentDynamic: Record<number, DynamicRowRecord[]>
  ) => {
    const { updatedValues } = FormulaEngine.calculateAllFormulas(metadata.Formulas, currentValues);
    setValues(updatedValues);

    const valSummary = ValidationEngine.validateReport(metadata, updatedValues, currentDynamic);
    setValidation(valSummary);
    return updatedValues;
  };

  const handleFieldChange = (code: string, value: string | number) => {
    if (readOnly) return;
    const nextValues = { ...values, [code]: value };
    const calculated = recalculateAndValidate(nextValues, dynamicRows);
    setHasUnsavedChanges(true);
    onSave(calculated, dynamicRows);
  };

  const handleAddDynamicRow = (areaId: number) => {
    if (readOnly) return;
    const areaDef = metadata.DynamicItemsList.find((a) => a.Area === areaId);
    if (!areaDef) return;

    const newRowId = `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const initialRowVals: Record<string, string | number> = {};
    areaDef.DynamicItems.forEach((col) => {
      initialRowVals[col.Code] = col._dataType === 'NUMERIC' ? 0 : '';
    });

    const newRecord: DynamicRowRecord = {
      id: newRowId,
      areaId,
      values: initialRowVals,
    };

    const nextDynamic = {
      ...dynamicRows,
      [areaId]: [...(dynamicRows[areaId] || []), newRecord],
    };

    setDynamicRows(nextDynamic);
    setHasUnsavedChanges(true);
    recalculateAndValidate(values, nextDynamic);
    onSave(values, nextDynamic);
  };

  const handleUpdateDynamicCell = (
    areaId: number,
    rowId: string,
    colCode: string,
    val: string | number
  ) => {
    if (readOnly) return;
    const existing = dynamicRows[areaId] || [];
    const updated = existing.map((r) =>
      r.id === rowId ? { ...r, values: { ...r.values, [colCode]: val } } : r
    );

    const nextDynamic = { ...dynamicRows, [areaId]: updated };
    setDynamicRows(nextDynamic);
    setHasUnsavedChanges(true);
    const calculated = recalculateAndValidate(values, nextDynamic);
    onSave(calculated, nextDynamic);
  };

  const handleDeleteDynamicRow = (areaId: number, rowId: string) => {
    if (readOnly) return;
    const existing = dynamicRows[areaId] || [];
    const nextDynamic = {
      ...dynamicRows,
      [areaId]: existing.filter((r) => r.id !== rowId),
    };

    setDynamicRows(nextDynamic);
    setHasUnsavedChanges(true);
    const calculated = recalculateAndValidate(values, nextDynamic);
    onSave(calculated, nextDynamic);
  };

  const handleManualSave = () => {
    const calculated = recalculateAndValidate(values, dynamicRows);
    onSave(calculated, dynamicRows);
    setHasUnsavedChanges(false);
  };

  const handleExportExcel = () => {
    const binary = ExcelService.exportToBinary(metadata, values, dynamicRows);
    const blob = new Blob([binary as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.Code}_${submission.periodYear}_v${submission.version}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = ExcelService.importFromBuffer(buffer, metadata);

      const nextValues = { ...values, ...parsed.values };
      const nextDynamic = { ...dynamicRows };

      Object.entries(parsed.dynamicRows).forEach(([areaStr, rows]) => {
        const areaId = parseInt(areaStr, 10);
        const mapped = (rows as DynamicRowRecord[]).map((r, idx) => ({
          id: `imp_${Date.now()}_${idx}`,
          areaId,
          values: r.values || r,
        }));
        nextDynamic[areaId] = mapped;
      });

      setValues(nextValues);
      setDynamicRows(nextDynamic);
      setHasUnsavedChanges(true);
      const calculated = recalculateAndValidate(nextValues, nextDynamic);
      onSave(calculated, nextDynamic);

      setImportNotification(
        `Successfully imported data from ${file.name}. Validations re-evaluated.`
      );
      setTimeout(() => setImportNotification(null), 5000);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filledCount = metadata.ReturnItemsList.filter(
    (i) => values[i.Code] !== '' && values[i.Code] !== undefined
  ).length;

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2 font-sans">
      {/* 1. Top Header & Action Controls (Strictly Fixed Height) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 bg-white p-3 rounded-xl shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Returns</span>
              <span>/</span>
              <span className="font-semibold text-slate-700">{metadata.Category}</span>
              <span>/</span>
              <span className="font-mono font-bold text-ob-indigo-700">{metadata.Code}</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight truncate max-w-md sm:max-w-xl">
              {metadata.Title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {/* Download as PDF button for APPROVED or SENT returns */}
          {(submission.status === 'APPROVED' || submission.status === 'SENT') && (
            <button
              type="button"
              onClick={() => PdfReportGenerator.generateReturnPdf(metadata, submission)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-ob-indigo-600 hover:bg-ob-indigo-700 border border-ob-indigo-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Download official printable PDF regulatory return"
            >
              <FileText className="w-3.5 h-3.5 text-ob-green-300" />
              <span>Download PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Export return to Excel XLSX"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>XLSX</span>
          </button>

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Import data from Excel XLSX"
              >
                <Upload className="w-3 h-3 text-slate-500" />
                <span>Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileImport}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleManualSave}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Save className="w-3 h-3" />
                <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                disabled={!validation?.isValid}
                className={`flex items-center gap-1 px-3.5 py-1 text-xs font-bold rounded-lg transition-colors shadow-2xs ${
                  validation?.isValid
                    ? 'bg-ob-indigo-600 text-white hover:bg-ob-indigo-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3 h-3" />
                <span>Submit to Checker</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Notification Toast if active */}
      {importNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Envelope Context & Validation Summary Strip (Fixed Height) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-900 flex items-center gap-1">
            <Building className="w-3 h-3 text-slate-400" />
            Oromia Bank (0000013)
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Period: {metadata.FinYear} ({metadata.Frequency})
          </span>
          <span>•</span>
          <span className="font-bold text-red-700">
            Status: {submission.status.replace('_', ' ')} (v{submission.version})
          </span>
        </div>

        {validation && (
          <div className="flex items-center gap-2 text-[11px]">
            {validation.isValid ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                All Validations Passed (100%)
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                {validation.errorsCount} Error(s) detected
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Sub-Tabs Bar (if dynamic roster exists) */}
      {metadata.DynamicItemsList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFormTab('ITEMS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeFormTab === 'ITEMS'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fixed Return Items ({metadata.ReturnItemsList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('DYNAMIC_SCHEDULES')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeFormTab === 'DYNAMIC_SCHEDULES'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Repeatable Schedules ({metadata.DynamicItemsList.length})
          </button>
        </div>
      )}

      {/* 5. Main Form Items / Schedules (Strict flex-1 min-h-0 overflow-hidden) */}
      {activeFormTab === 'ITEMS' || metadata.DynamicItemsList.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
          {/* Search and item filter bar inside fixed return items */}
          <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <span className="text-xs font-bold text-slate-800">
              Line Items: {filledCount} of {metadata.ReturnItemsList.length} populated ({Math.round((filledCount / metadata.ReturnItemsList.length) * 100)}%)
            </span>

            <div className="flex items-center gap-2">
              <select
                value={itemTypeFilter}
                onChange={(e) => setItemTypeFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Items ({metadata.ReturnItemsList.length})</option>
                <option value="REQUIRED">Mandatory Fields Only</option>
                <option value="DIRECT_INPUT">Direct Input Cells Only</option>
                <option value="FORMULA_TOTAL">Formula / Total Cells</option>
                <option value="POPULATED">Populated Items ({filledCount})</option>
                <option value="EMPTY">Unpopulated Items ({metadata.ReturnItemsList.length - filledCount})</option>
              </select>

              <div className="relative w-48 sm:w-56">
                <input
                  type="text"
                  placeholder="Search line item or code..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-ob-indigo-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 w-28 font-mono">Code</th>
                  <th className="py-2 px-3">Line Item Description</th>
                  <th className="py-2 px-3 w-20">Type</th>
                  <th className="py-2 px-3 w-44 text-right">Value (ETB / Count)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const currentVal = values[item.Code] !== undefined ? values[item.Code] : '';
                  const isFormula = metadata.Formulas.some((f) => f.targetCode === item.Code);
                  const formulaDef = metadata.Formulas.find((f) => f.targetCode === item.Code);

                  return (
                    <tr
                      key={item.Code}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.isTotal ? 'bg-slate-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-mono text-slate-600 select-all font-medium">
                        {item.Code}
                      </td>
                      <td className="py-2 px-3 text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item._description}</span>
                          {item._required && <span className="text-red-500 font-bold">*</span>}
                          {isFormula && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200"
                              title={`Calculated: ${formulaDef?.description || formulaDef?.expression}`}
                            >
                              <Calculator className="w-2.5 h-2.5" />
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                        {item._dataType}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        {readOnly ? (
                          <div className="font-mono tabular-nums text-slate-900 py-1">
                            {currentVal !== '' && currentVal !== undefined ? (
                              item._dataType === 'NUMERIC' && typeof currentVal === 'number'
                               ? currentVal.toLocaleString('en-US')
                                : String(currentVal)
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </div>
                        ) : (
                          <input
                            type={
                              item._dataType === 'NUMERIC'
                                ? 'number'
                                : item._dataType === 'DATE'
                                ? 'date'
                                : 'text'
                            }
                            value={currentVal}
                            readOnly={isFormula}
                            placeholder={isFormula ? 'Auto' : '0.00'}
                            onChange={(e) => {
                              const val =
                                item._dataType === 'NUMERIC'
                                  ? e.target.value === ''
                                    ? ''
                                    : Number(e.target.value)
                                  : e.target.value;
                              handleFieldChange(item.Code, val);
                            }}
                            className={`w-full px-2 py-1 text-xs border rounded-lg transition-colors ${
                              isFormula
                                ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed text-right font-mono tabular-nums font-semibold'
                                : 'bg-white border-slate-200 text-slate-900 focus:border-red-600 focus:outline-none text-right font-mono tabular-nums'
                            }`}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 p-2 border-t border-slate-200 bg-slate-50/50">
            <Pagination
              currentPage={itemsPage}
              totalItems={filteredItems.length}
              pageSize={itemsPageSize}
              onPageChange={setItemsPage}
              onPageSizeChange={setItemsPageSize}
              pageSizeOptions={[10, 15, 25, 50]}
              itemName="return items"
            />
          </div>
        </div>
      ) : (
        /* Dynamic Schedules View */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {metadata.DynamicItemsList.map((area) => (
            <DynamicAreaTable
              key={area.Area}
              area={area}
              rows={dynamicRows[area.Area] || []}
              readOnly={readOnly}
              onAddRow={() => handleAddDynamicRow(area.Area)}
              onUpdateCell={(rowId, colCode, val) =>
                handleUpdateDynamicCell(area.Area, rowId, colCode, val)
              }
              onDeleteRow={(rowId) => handleDeleteDynamicRow(area.Area, rowId)}
            />
          ))}
        </div>
      )}

      {/* 6. Maker Submit to Checker Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submit Report to Checker
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You are submitting <span className="font-semibold text-slate-900">{metadata.Title}</span> for formal 4-eyes Checker review and authorization.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Maker Remarks / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={submitComment}
                onChange={(e) => setSubmitComment(e.target.value)}
                placeholder="Add any specific reconciliation notes or ledger context for the Checker..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleManualSave();
                  onSubmitToChecker(submitComment);
                  setSubmitModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors shadow-2xs"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
