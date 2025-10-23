import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTrackedBOM } from '../hooks/useTrackedBOM';
import { useNotification } from '../contexts/NotificationContext';
import * as XLSX from 'xlsx';

const ExcelSync = ({ onClose }) => {
  const { theme } = useTheme();
  const { visibleItems, setFromExcelTracked, itemsById } = useTrackedBOM();
  const { showSuccess, showError, showWarning } = useNotification();
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const isDark = theme === 'dark';

  // Excel 템플릿 생성 및 다운로드
  const downloadTemplate = () => {
    // 현재 그리드의 컬럼 구조를 기반으로 템플릿 생성
    const template = [
      {
        level: 0,
        partNumber: 'ASSY-001',
        partName: '메인 어셈블리',
        quantity: 1,
        unit: 'EA',
        material: 'STEEL',
        weight: 150.5,
        supplier: '공급업체A',
        cost: 1000000,
        leadTime: 30,
        status: 'approved',
        notes: '메인 제품',
        icon: '📦',
        operation: 'OP10',
        workcenter: 'WC01'
      },
      {
        level: 1,
        partNumber: 'SUB-001',
        partName: '서브 어셈블리',
        quantity: 2,
        unit: 'EA',
        material: 'ALUMINUM',
        weight: 45.2,
        supplier: '공급업체B',
        cost: 250000,
        leadTime: 15,
        status: 'review',
        notes: '서브 부품',
        icon: '🔧',
        operation: 'OP20',
        workcenter: 'WC02'
      }
    ];

    // 워크북 생성
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOM Template');

    // 컬럼 너비 설정
    const cols = [
      { wch: 8 },  // level
      { wch: 15 }, // partNumber
      { wch: 25 }, // partName
      { wch: 10 }, // quantity
      { wch: 8 },  // unit
      { wch: 15 }, // material
      { wch: 10 }, // weight
      { wch: 15 }, // supplier
      { wch: 12 }, // cost
      { wch: 10 }, // leadTime
      { wch: 10 }, // status
      { wch: 30 }, // notes
      { wch: 8 },  // icon
      { wch: 10 }, // operation
      { wch: 10 }  // workcenter
    ];
    ws['!cols'] = cols;

    // 파일 다운로드
    XLSX.writeFile(wb, 'BOM_Template.xlsx');
    showSuccess('템플릿이 다운로드되었습니다.');
  };

  // Excel 파일 업로드 및 파싱
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // 첫 번째 시트 가져오기
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // JSON으로 변환
        const data = XLSX.utils.sheet_to_json(ws);

        // 데이터 검증
        const validatedData = validateAndTransformData(data);

        if (validatedData.errors.length > 0) {
          showWarning(`데이터 검증 경고: ${validatedData.errors.join(', ')}`);
        }

        // 미리보기 표시
        setPreview(validatedData.data);
        setProcessing(false);

      } catch (error) {
        showError('파일 처리 중 오류가 발생했습니다: ' + error.message);
        setProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 데이터 검증 및 변환
  const validateAndTransformData = (data) => {
    const errors = [];
    const validatedData = [];

    data.forEach((row, index) => {
      const item = {
        id: `item-${Date.now()}-${index}`,
        level: parseInt(row.level) || 0,
        partNumber: row.partNumber || `PART-${index}`,
        partName: row.partName || row.description || '',
        quantity: parseFloat(row.quantity) || 1,
        unit: row.unit || 'EA',
        material: row.material || '',
        weight: parseFloat(row.weight) || 0,
        supplier: row.supplier || '',
        cost: parseFloat(row.cost) || 0,
        leadTime: parseInt(row.leadTime) || 0,
        status: row.status || 'draft',
        notes: row.notes || '',
        icon: row.icon || '📦',
        operation: row.operation || '',
        workcenter: row.workcenter || '',
        children: []
      };

      // 필수 필드 검증
      if (!item.partNumber) {
        errors.push(`행 ${index + 1}: 품번이 누락되었습니다.`);
      }
      if (!item.partName) {
        errors.push(`행 ${index + 1}: 품명이 누락되었습니다.`);
      }

      validatedData.push(item);
    });

    // 계층 구조 생성
    const hierarchicalData = buildHierarchy(validatedData);

    return { data: hierarchicalData, errors };
  };

  // 계층 구조 생성
  const buildHierarchy = (flatData) => {
    const result = [];
    const levels = {};

    flatData.forEach(item => {
      const level = item.level;

      if (level === 0) {
        result.push(item);
        levels[0] = item;
      } else {
        // 부모 찾기
        const parentLevel = level - 1;
        const parent = levels[parentLevel];

        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(item);
          levels[level] = item;
        }
      }
    });

    return result;
  };

  // 데이터 적용
  const applyData = () => {
    if (!preview) return;

    setFromExcelTracked(preview);
    showSuccess('Excel 데이터가 성공적으로 적용되었습니다.');
    onClose();
  };

  // 현재 데이터를 Excel로 내보내기
  const exportCurrentData = () => {
    // visibleItems를 Excel 형식으로 변환
    const flatData = visibleItems.map(item => ({
      level: item.level,
      partNumber: item.data.partNumber,
      partName: item.data.partName,
      quantity: item.data.quantity,
      unit: item.data.unit,
      material: item.data.material,
      weight: item.data.weight,
      supplier: item.data.supplier,
      cost: item.data.cost,
      leadTime: item.data.leadTime,
      status: item.data.status,
      notes: item.data.notes,
      icon: item.data.icon,
      operation: item.data.operation,
      workcenter: item.data.workcenter
    }));

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOM Data');

    // 컬럼 너비 설정
    const cols = [
      { wch: 8 },  // level
      { wch: 15 }, // partNumber
      { wch: 25 }, // partName
      { wch: 10 }, // quantity
      { wch: 8 },  // unit
      { wch: 15 }, // material
      { wch: 10 }, // weight
      { wch: 15 }, // supplier
      { wch: 12 }, // cost
      { wch: 10 }, // leadTime
      { wch: 10 }, // status
      { wch: 30 }, // notes
      { wch: 8 },  // icon
      { wch: 10 }, // operation
      { wch: 10 }  // workcenter
    ];
    ws['!cols'] = cols;

    const fileName = `BOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showSuccess('데이터가 Excel로 내보내졌습니다.');
  };

  // BOM 데이터를 평면화
  const flattenBOMData = (data, result = []) => {
    data.forEach(item => {
      const { children, ...itemWithoutChildren } = item;
      result.push(itemWithoutChildren);

      if (children && children.length > 0) {
        flattenBOMData(children, result);
      }
    });

    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Excel 템플릿 동기화
            </h2>
          </div>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Download Template */}
            <button
              onClick={downloadTemplate}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                isDark
                  ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
              }`}
            >
              <Download className={`w-8 h-8 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                템플릿 다운로드
              </span>
              <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                빈 Excel 템플릿
              </span>
            </button>

            {/* Upload File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                isDark
                  ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700'
                  : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'
              }`}
            >
              <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Excel 업로드
              </span>
              <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                데이터 가져오기
              </span>
            </button>

            {/* Export Current */}
            <button
              onClick={exportCurrentData}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                isDark
                  ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-700'
                  : 'border-gray-300 hover:border-purple-500 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className={`w-8 h-8 mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                현재 데이터 내보내기
              </span>
              <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Excel로 저장
              </span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Processing Indicator */}
          {processing && (
            <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <span className={isDark ? 'text-blue-300' : 'text-blue-700'}>
                  파일 처리 중...
                </span>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className={`border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-4 py-3 border-b ${
                isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  데이터 미리보기
                </h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className="text-left py-2 px-3">Level</th>
                      <th className="text-left py-2 px-3">품번</th>
                      <th className="text-left py-2 px-3">품명</th>
                      <th className="text-left py-2 px-3">수량</th>
                      <th className="text-left py-2 px-3">단위</th>
                      <th className="text-left py-2 px-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'}>
                        <td className="py-2 px-3">{item.level}</td>
                        <td className="py-2 px-3">{item.partNumber}</td>
                        <td className="py-2 px-3">{item.partName}</td>
                        <td className="py-2 px-3">{item.quantity}</td>
                        <td className="py-2 px-3">{item.unit}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className={`text-center py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ... 외 {preview.length - 5}개 항목
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex items-start">
              <AlertCircle className={`w-5 h-5 mt-0.5 mr-3 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  사용 방법
                </h4>
                <ol className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>1. 템플릿을 다운로드하여 Excel 형식을 확인합니다.</li>
                  <li>2. 데이터를 Excel 파일에 입력합니다.</li>
                  <li>3. 작성된 Excel 파일을 업로드합니다.</li>
                  <li>4. 미리보기를 확인 후 적용 버튼을 클릭합니다.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {preview && (
          <div className={`flex justify-end gap-3 px-6 py-4 border-t ${
            isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={() => setPreview(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              취소
            </button>
            <button
              onClick={applyData}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              데이터 적용
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelSync;