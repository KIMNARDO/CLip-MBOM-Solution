import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import EnhancedLevelIndicator from '../level/EnhancedLevelIndicator';
import AddColumnDialog from '../dialogs/AddColumnDialog';
import {
  ChevronRight,
  ChevronDown,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Copy,
  Move
} from 'lucide-react';

/**
 * UnifiedBOMGrid - 통합 BOM 그리드 컴포넌트
 * TanStack Table (React Table)을 사용하는 통합 컴포넌트
 */
const UnifiedBOMGrid = ({
  data,
  onSelectionChanged,
  onCellEditingStarted,
  onCellEditingStoppedCallback
}) => {
  const {
    updateBOMItem,
    addBOMItem,
    deleteBOMItem,
    moveItem,
    expandedNodeIds,
    customColumns,
    setGridApi,
    toggleNodeExpanded
  } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();
  const { theme: appTheme } = useTheme();

  const [expanded, setExpanded] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  // 트리 데이터 평탄화 함수
  const flattenTree = useCallback((items, parent = null, depth = 0) => {
    if (!items || !Array.isArray(items)) return [];

    return items.reduce((acc, item) => {
      const flatItem = {
        ...item,
        depth,
        parent,
        subRows: item.children ? flattenTree(item.children, item.id, depth + 1) : []
      };
      return [...acc, flatItem];
    }, []);
  }, []);

  // 평탄화된 데이터
  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return flattenTree(data);
  }, [data, flattenTree]);

  // 편집 시작
  const startEditing = useCallback((rowId, field, value) => {
    setEditingCell({ rowId, field });
    setEditValue(value || '');
    if (onCellEditingStarted) {
      onCellEditingStarted({ rowId, field, value });
    }
  }, [onCellEditingStarted]);

  // 편집 저장
  const saveEdit = useCallback(() => {
    if (editingCell) {
      updateBOMItem(editingCell.rowId, { [editingCell.field]: editValue });
      showSuccess('항목이 업데이트되었습니다');
      if (onCellEditingStoppedCallback) {
        onCellEditingStoppedCallback({
          rowId: editingCell.rowId,
          field: editingCell.field,
          value: editValue
        });
      }
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, updateBOMItem, showSuccess, onCellEditingStoppedCallback]);

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 드래그 오버
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 드롭
  const handleDrop = useCallback((e, targetItem) => {
    e.preventDefault();

    if (!draggedItem || !targetItem) {
      showWarning('올바른 위치로 드래그해주세요');
      return;
    }

    // 레벨 체크
    if (draggedItem.level !== targetItem.level) {
      showWarning(`같은 레벨끼리만 이동할 수 있습니다. (현재: Level ${draggedItem.level}, 대상: Level ${targetItem.level})`);
      return;
    }

    // 이동 실행
    moveItem(draggedItem.id, targetItem.id);
    showSuccess(`항목이 Level ${draggedItem.level} 내에서 이동되었습니다`);
    setDraggedItem(null);
  }, [draggedItem, moveItem, showSuccess, showWarning]);

  // 컬럼 정의
  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: 'selection',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        size: 40
      },
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          if (!row.original.children || row.original.children.length === 0) {
            return <span className="w-6 inline-block" />;
          }
          return (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          );
        },
        size: 40
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => (
          <EnhancedLevelIndicator
            level={row.original.level}
            style={{ marginLeft: `${row.depth * 20}px` }}
          />
        ),
        size: 120
      },
      {
        accessorKey: 'partNumber',
        header: 'Part Number',
        cell: ({ row, getValue }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.field === 'partNumber';

          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="px-2 py-1 border rounded w-full"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1 hover:bg-green-100 rounded">
                  <Save className="w-3 h-3 text-green-600" />
                </button>
                <button onClick={cancelEdit} className="p-1 hover:bg-red-100 rounded">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            );
          }

          return (
            <div
              className="flex items-center justify-between group cursor-move"
              draggable
              onDragStart={(e) => handleDragStart(e, row.original)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, row.original)}
              onDoubleClick={() => startEditing(row.original.id, 'partNumber', getValue())}
            >
              <span>{getValue()}</span>
              <button
                onClick={() => startEditing(row.original.id, 'partNumber', getValue())}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
          );
        },
        size: 200
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row, getValue }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.field === 'description';

          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="px-2 py-1 border rounded w-full"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1 hover:bg-green-100 rounded">
                  <Save className="w-3 h-3 text-green-600" />
                </button>
                <button onClick={cancelEdit} className="p-1 hover:bg-red-100 rounded">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            );
          }

          return (
            <div
              className="flex items-center justify-between group"
              onDoubleClick={() => startEditing(row.original.id, 'description', getValue())}
            >
              <span>{getValue()}</span>
              <button
                onClick={() => startEditing(row.original.id, 'description', getValue())}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
          );
        },
        size: 300
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row, getValue }) => {
          const isEditing = editingCell?.rowId === row.original.id && editingCell?.field === 'quantity';

          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="px-2 py-1 border rounded w-20"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-1 hover:bg-green-100 rounded">
                  <Save className="w-3 h-3 text-green-600" />
                </button>
                <button onClick={cancelEdit} className="p-1 hover:bg-red-100 rounded">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            );
          }

          return (
            <div
              className="flex items-center justify-between group"
              onDoubleClick={() => startEditing(row.original.id, 'quantity', getValue())}
            >
              <span>{getValue()}</span>
              <button
                onClick={() => startEditing(row.original.id, 'quantity', getValue())}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
          );
        },
        size: 100
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        size: 80
      },
      {
        accessorKey: 'material',
        header: 'Material',
        size: 150
      },
      {
        accessorKey: 'weight',
        header: 'Weight (kg)',
        size: 100
      },
      {
        accessorKey: 'supplier',
        header: 'Supplier',
        size: 150
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? `₩${value.toLocaleString()}` : '';
        },
        size: 120
      },
      {
        accessorKey: 'leadTime',
        header: 'Lead Time',
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? `${value} days` : '';
        },
        size: 100
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue();
          const statusColors = {
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          };

          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || ''}`}>
              {status}
            </span>
          );
        },
        size: 100
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const newItem = {
                  partNumber: '',
                  description: 'New Item',
                  quantity: 1,
                  unit: 'EA',
                  status: 'draft'
                };
                addBOMItem(row.original.id, newItem);
                showSuccess('새 항목이 추가되었습니다');
              }}
              className="p-1 hover:bg-blue-100 rounded"
              title="Add Child"
            >
              <Plus className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(row.original, null, 2));
                showSuccess('항목이 복사되었습니다');
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
                  deleteBOMItem(row.original.id);
                  showSuccess('항목이 삭제되었습니다');
                }
              }}
              className="p-1 hover:bg-red-100 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ),
        size: 120
      }
    ];

    // 커스텀 컬럼 추가
    if (customColumns && customColumns.length > 0) {
      customColumns.forEach(col => {
        baseColumns.push({
          accessorKey: col.field,
          header: col.headerName,
          size: col.width || 150,
          cell: ({ row, getValue }) => {
            const isEditing = editingCell?.rowId === row.original.id && editingCell?.field === col.field;

            if (isEditing) {
              return (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="px-2 py-1 border rounded w-full"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="p-1 hover:bg-green-100 rounded">
                    <Save className="w-3 h-3 text-green-600" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 hover:bg-red-100 rounded">
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              );
            }

            return (
              <div
                className="flex items-center justify-between group"
                onDoubleClick={() => startEditing(row.original.id, col.field, getValue())}
              >
                <span>{getValue()}</span>
                <button
                  onClick={() => startEditing(row.original.id, col.field, getValue())}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            );
          }
        });
      });
    }

    return baseColumns;
  }, [customColumns, editingCell, editValue, saveEdit, cancelEdit, startEditing,
      addBOMItem, deleteBOMItem, showSuccess, handleDragStart, handleDragOver, handleDrop]);

  // 테이블 인스턴스
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      rowSelection: selectedRows,
      globalFilter
    },
    onExpandedChange: setExpanded,
    onRowSelectionChange: setSelectedRows,
    onGlobalFilterChange: setGlobalFilter,
    getSubRows: row => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true
  });

  // 선택 변경 시 콜백
  useEffect(() => {
    if (onSelectionChanged) {
      const selected = table.getSelectedRowModel().rows.map(row => row.original);
      onSelectionChanged(selected);
    }
  }, [selectedRows, table, onSelectionChanged]);

  return (
    <div className={`h-full flex flex-col ${appTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* 툴바 */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          />
          <button
            onClick={() => setShowAddColumnDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Column
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {table.getFilteredRowModel().rows.length} items
        </div>
      </div>

      {/* 테이블 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b dark:border-gray-700"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
                  ${row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 컬럼 추가 다이얼로그 */}
      {showAddColumnDialog && (
        <AddColumnDialog
          onClose={() => setShowAddColumnDialog(false)}
          onAdd={(column) => {
            // 컬럼 추가 로직
            setShowAddColumnDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default UnifiedBOMGrid;