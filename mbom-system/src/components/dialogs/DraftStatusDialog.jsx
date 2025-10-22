import React, { useState, useEffect } from 'react';
import { X, Save, Send, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApproval } from '../../contexts/ApprovalContext';
import { useNotification } from '../../contexts/NotificationContext';

const DraftStatusDialog = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const {
    pendingChanges,
    documentStatus,
    saveChanges,
    discardChanges,
    cancelChange,
    requestApproval,
    changeHistory
  } = useApproval();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const isDark = theme === 'dark';

  const [selectedTab, setSelectedTab] = useState('changes'); // 'changes', 'history', 'approval'
  const [approvers, setApprovers] = useState(['']);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // 상태별 색상 및 아이콘
  const statusConfig = {
    draft: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      icon: <Edit className="w-5 h-5" />,
      label: '작성 중'
    },
    reviewing: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      icon: <Clock className="w-5 h-5" />,
      label: '검토 중'
    },
    approved: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      icon: <CheckCircle className="w-5 h-5" />,
      label: '승인됨'
    },
    rejected: {
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      icon: <AlertCircle className="w-5 h-5" />,
      label: '반려됨'
    }
  };

  const currentStatus = statusConfig[documentStatus] || statusConfig.draft;

  // 작업 유형별 레이블
  const getOperationLabel = (operation) => {
    switch (operation) {
      case 'create': return '생성';
      case 'update': return '수정';
      case 'delete': return '삭제';
      default: return operation;
    }
  };

  // 작업 유형별 색상
  const getOperationColor = (operation) => {
    switch (operation) {
      case 'create': return 'text-green-500';
      case 'update': return 'text-blue-500';
      case 'delete': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 변경사항 저장
  const handleSave = () => {
    const result = saveChanges();
    if (result.success) {
      showSuccess(result.message);
      setSelectedTab('history');
    } else {
      showWarning(result.message);
    }
  };

  // 결재 요청
  const handleRequestApproval = () => {
    if (changeHistory.length === 0) {
      showWarning('저장된 변경사항이 없습니다. 먼저 저장해주세요.');
      return;
    }

    const latestChangeSet = changeHistory[changeHistory.length - 1];
    const validApprovers = approvers.filter(a => a.trim() !== '');

    const result = requestApproval(latestChangeSet.id, validApprovers);
    if (result.success) {
      showSuccess(result.message);
      setShowApprovalDialog(false);
      onClose();
    } else {
      showError(result.message);
    }
  };

  // 모든 변경사항 취소
  const handleDiscardAll = () => {
    if (confirm('모든 변경사항을 취소하시겠습니까?')) {
      const result = discardChanges();
      showInfo(result.message);
      onClose();
    }
  };

  // 개별 변경사항 취소
  const handleCancelChange = (changeId) => {
    const result = cancelChange(changeId);
    showInfo(result.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              작성 상태 관리
            </h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${currentStatus.bg}`}>
              <span className={currentStatus.color}>{currentStatus.icon}</span>
              <span className={`text-sm font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
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

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setSelectedTab('changes')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              selectedTab === 'changes'
                ? isDark ? 'text-blue-400' : 'text-blue-600'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            현재 변경사항 ({pendingChanges.length})
            {selectedTab === 'changes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              selectedTab === 'history'
                ? isDark ? 'text-blue-400' : 'text-blue-600'
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            변경 이력 ({changeHistory.length})
            {selectedTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {selectedTab === 'changes' && (
            <div className="space-y-4">
              {pendingChanges.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Edit className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>변경사항이 없습니다</p>
                </div>
              ) : (
                pendingChanges.map((change, index) => (
                  <div
                    key={change.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`text-sm font-medium ${getOperationColor(change.operation)}`}>
                            {getOperationLabel(change.operation)}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(change.timestamp).toLocaleString()}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            by {change.user}
                          </span>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {change.data.partNumber && (
                            <div>품번: {change.data.partNumber}</div>
                          )}
                          {change.data.partName && (
                            <div>품명: {change.data.partName}</div>
                          )}
                          {change.data.field && (
                            <div>필드: {change.data.field} → {change.data.newValue}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelChange(change.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="space-y-4">
              {changeHistory.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>저장된 변경 이력이 없습니다</p>
                </div>
              ) : (
                changeHistory.map((changeSet, index) => (
                  <div
                    key={changeSet.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          변경사항 저장됨
                        </span>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {changeSet.changes.length}개 항목
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(changeSet.savedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      저장자: {changeSet.savedBy}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center px-6 py-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={handleDiscardAll}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-600'
            }`}
            disabled={pendingChanges.length === 0}
          >
            모두 취소
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                pendingChanges.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={pendingChanges.length === 0}
            >
              <Save className="w-4 h-4" />
              작성 완료
            </button>

            <button
              onClick={() => setShowApprovalDialog(true)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                changeHistory.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={changeHistory.length === 0}
            >
              <Send className="w-4 h-4" />
              결재 요청
            </button>
          </div>
        </div>
      </div>

      {/* 결재 요청 다이얼로그 */}
      {showApprovalDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              결재 요청
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  결재자 지정
                </label>
                {approvers.map((approver, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={approver}
                      onChange={(e) => {
                        const newApprovers = [...approvers];
                        newApprovers[index] = e.target.value;
                        setApprovers(newApprovers);
                      }}
                      placeholder={`결재자 ${index + 1}`}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={() => setApprovers(approvers.filter((_, i) => i !== index))}
                      className={`p-2 rounded-lg ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setApprovers([...approvers, ''])}
                  className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  + 결재자 추가
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowApprovalDialog(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                취소
              </button>
              <button
                onClick={handleRequestApproval}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftStatusDialog;