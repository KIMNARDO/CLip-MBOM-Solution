import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

const AddColumnDialog = ({ isOpen, onClose, onAddColumn, existingColumns }) => {
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();
  const isDark = theme === 'dark';

  const [columnConfig, setColumnConfig] = useState({
    field: '',
    headerName: '',
    width: 150,
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellDataType: 'text', // text, number, boolean, date
    defaultValue: '',
    required: false,
    pinned: null // null, 'left', 'right'
  });

  // 사전 정의된 컬럼 템플릿
  const columnTemplates = [
    { label: '텍스트 필드', type: 'text', width: 150, defaultValue: '' },
    { label: '숫자 필드', type: 'number', width: 120, defaultValue: 0 },
    { label: '날짜 필드', type: 'date', width: 150, defaultValue: '' },
    { label: '체크박스', type: 'boolean', width: 100, defaultValue: false },
    { label: '비용 필드', type: 'number', width: 150, defaultValue: 0, format: 'currency' },
    { label: '백분율 필드', type: 'number', width: 120, defaultValue: 0, format: 'percentage' },
    { label: '상태 필드', type: 'select', width: 130, defaultValue: 'draft' },
    { label: '비고 필드', type: 'text', width: 200, defaultValue: '' }
  ];

  const handleTemplateSelect = (template) => {
    setColumnConfig(prev => ({
      ...prev,
      cellDataType: template.type,
      width: template.width,
      defaultValue: template.defaultValue,
      format: template.format
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!columnConfig.field) {
      showError('필드명을 입력해주세요');
      return;
    }

    if (!columnConfig.headerName) {
      showError('컬럼 이름을 입력해주세요');
      return;
    }

    // 중복 필드 검사
    if (existingColumns && existingColumns.some(col => col.field === columnConfig.field)) {
      showError('이미 존재하는 필드명입니다');
      return;
    }

    // TreeGrid 컬럼 구조에 맞게 생성
    const newColumn = {
      field: columnConfig.field,
      header: columnConfig.headerName, // TreeGrid는 'header' 필드를 사용
      width: columnConfig.width,
      editable: columnConfig.editable,
      required: columnConfig.required,
      // 추가 속성들은 TreeGrid에서 사용하지 않음
      cellDataType: columnConfig.cellDataType,
      defaultValue: columnConfig.defaultValue
    };

    onAddColumn(newColumn);
    showSuccess(`'${columnConfig.headerName}' 컬럼이 추가되었습니다`);

    // 폼 초기화
    setColumnConfig({
      field: '',
      headerName: '',
      width: 150,
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      cellDataType: 'text',
      defaultValue: '',
      required: false,
      pinned: null
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            새 컬럼 추가
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* 템플릿 선택 */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              빠른 템플릿 선택
            </label>
            <div className="grid grid-cols-4 gap-2">
              {columnTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isDark
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 필드명 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                필드명 (영문) *
              </label>
              <input
                type="text"
                value={columnConfig.field}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, field: e.target.value }))}
                placeholder="예: customField1"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* 컬럼 이름 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                컬럼 이름 *
              </label>
              <input
                type="text"
                value={columnConfig.headerName}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, headerName: e.target.value }))}
                placeholder="예: 사용자 정의 필드"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* 데이터 타입 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                데이터 타입
              </label>
              <select
                value={columnConfig.cellDataType}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, cellDataType: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="text">텍스트</option>
                <option value="number">숫자</option>
                <option value="date">날짜</option>
                <option value="boolean">체크박스</option>
                <option value="select">선택 목록</option>
              </select>
            </div>

            {/* 너비 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                너비 (px)
              </label>
              <input
                type="number"
                value={columnConfig.width}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                min="50"
                max="500"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* 고정 위치 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                고정 위치
              </label>
              <select
                value={columnConfig.pinned || ''}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, pinned: e.target.value || null }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">고정 안함</option>
                <option value="left">왼쪽 고정</option>
                <option value="right">오른쪽 고정</option>
              </select>
            </div>

            {/* 기본값 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                기본값
              </label>
              <input
                type={columnConfig.cellDataType === 'number' ? 'number' : 'text'}
                value={columnConfig.defaultValue}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, defaultValue: e.target.value }))}
                placeholder="새 행의 기본값"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* 옵션 체크박스 */}
          <div className="mt-6 space-y-3">
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              컬럼 옵션
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnConfig.editable}
                  onChange={(e) => setColumnConfig(prev => ({ ...prev, editable: e.target.checked }))}
                  className="mr-2"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  편집 가능
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnConfig.sortable}
                  onChange={(e) => setColumnConfig(prev => ({ ...prev, sortable: e.target.checked }))}
                  className="mr-2"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  정렬 가능
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnConfig.filter}
                  onChange={(e) => setColumnConfig(prev => ({ ...prev, filter: e.target.checked }))}
                  className="mr-2"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  필터 가능
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnConfig.resizable}
                  onChange={(e) => setColumnConfig(prev => ({ ...prev, resizable: e.target.checked }))}
                  className="mr-2"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  크기 조절 가능
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnConfig.required}
                  onChange={(e) => setColumnConfig(prev => ({ ...prev, required: e.target.checked }))}
                  className="mr-2"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  필수 입력
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`flex justify-end gap-3 px-6 py-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            컬럼 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddColumnDialog;