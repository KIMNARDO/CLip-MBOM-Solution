import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApproval } from '../../contexts/ApprovalContext';
import { useNotification } from '../../contexts/NotificationContext';

const ApprovalDialog = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const {
    approvalQueue,
    approveRequest,
    rejectRequest,
    changeHistory
  } = useApproval();
  const { showSuccess, showError, showInfo } = useNotification();
  const isDark = theme === 'dark';

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approverName, setApproverName] = useState(localStorage.getItem('username') || '');
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // 결재 상태별 설정
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          icon: <Clock className="w-5 h-5" />,
          label: '대기중'
        };
      case 'approved':
        return {
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          icon: <CheckCircle className="w-5 h-5" />,
          label: '승인됨'
        };
      case 'rejected':
        return {
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          icon: <XCircle className="w-5 h-5" />,
          label: '반려됨'
        };
      default:
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-500/10',
          icon: <Clock className="w-5 h-5" />,
          label: status
        };
    }
  };

  // 승인 처리
  const handleApprove = () => {
    if (!selectedRequest || !approverName) {
      showError('결재자 이름을 입력해주세요.');
      return;
    }

    const result = approveRequest(selectedRequest.id, approverName, comments);
    if (result.success) {
      showSuccess(result.message);
      setSelectedRequest(null);
      setComments('');
    } else {
      showError(result.message);
    }
  };

  // 반려 처리
  const handleReject = () => {
    if (!selectedRequest || !approverName || !rejectReason) {
      showError('반려 사유를 입력해주세요.');
      return;
    }

    const result = rejectRequest(selectedRequest.id, approverName, rejectReason);
    if (result.success) {
      showInfo(result.message);
      setSelectedRequest(null);
      setRejectReason('');
      setShowRejectDialog(false);
    } else {
      showError(result.message);
    }
  };

  // 변경사항 상세 가져오기
  const getChangeSetDetails = (changeSetId) => {
    return changeHistory.find(cs => cs.id === changeSetId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full max-w-5xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              결재 승인 관리
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              {approvalQueue.filter(r => r.status === 'pending').length}건 대기
            </span>
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
        <div className="flex h-[calc(90vh-5rem)]">
          {/* 결재 목록 */}
          <div className={`w-1/3 border-r overflow-y-auto ${
            isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="p-4">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                결재 요청 목록
              </h3>
              {approvalQueue.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">결재 요청이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {approvalQueue.map((request) => {
                    const statusConfig = getStatusConfig(request.status);
                    return (
                      <button
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedRequest?.id === request.id
                            ? isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300'
                            : isDark ? 'hover:bg-gray-800' : 'hover:bg-white'
                        } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${statusConfig.bg}`}>
                            <span className={statusConfig.color}>{statusConfig.icon}</span>
                            <span className={statusConfig.color}>{statusConfig.label}</span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            #{request.id}
                          </span>
                        </div>
                        <div className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {request.changeCount}개 변경사항
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          <div>요청자: {request.requestedBy}</div>
                          <div>{new Date(request.requestedAt).toLocaleString()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="flex-1 overflow-y-auto">
            {selectedRequest ? (
              <div className="p-6">
                {/* 요청 정보 */}
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    결재 요청 상세
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        요청자
                      </div>
                      <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <User className="w-4 h-4" />
                        <span>{selectedRequest.requestedBy}</span>
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        요청일시
                      </div>
                      <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedRequest.requestedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 변경사항 목록 */}
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    변경사항 ({selectedRequest.changeCount}건)
                  </h3>
                  {(() => {
                    const changeSet = getChangeSetDetails(selectedRequest.changeSetId);
                    if (!changeSet) return <p>변경사항을 찾을 수 없습니다.</p>;

                    return (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {changeSet.changes.map((change, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className={`text-sm font-medium ${
                                  change.operation === 'create' ? 'text-green-500' :
                                  change.operation === 'update' ? 'text-blue-500' :
                                  'text-red-500'
                                }`}>
                                  {change.operation === 'create' ? '생성' :
                                   change.operation === 'update' ? '수정' : '삭제'}
                                </span>
                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {change.data.partNumber} - {change.data.partName}
                                </span>
                              </div>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {change.user}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* 결재자 목록 */}
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    결재선
                  </h3>
                  <div className="space-y-2">
                    {selectedRequest.approvers.map((approver, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-2 rounded ${
                          isDark ? 'bg-gray-800' : 'bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                          {approver}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 결재 액션 */}
                {selectedRequest.status === 'pending' && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      결재 처리
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          결재자 이름
                        </label>
                        <input
                          type="text"
                          value={approverName}
                          onChange={(e) => setApproverName(e.target.value)}
                          placeholder="결재자 이름 입력"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          의견 (선택)
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="결재 의견을 입력하세요"
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          승인
                        </button>
                        <button
                          onClick={() => setShowRejectDialog(true)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          반려
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 이미 처리된 결재 */}
                {selectedRequest.status === 'approved' && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          승인 완료
                        </p>
                        <p className={`text-sm ${isDark ? 'text-green-500' : 'text-green-600'}`}>
                          {selectedRequest.approvedBy} - {new Date(selectedRequest.approvedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'rejected' && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                          반려됨
                        </p>
                        <p className={`text-sm ${isDark ? 'text-red-500' : 'text-red-600'}`}>
                          {selectedRequest.rejectedBy} - {selectedRequest.rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>결재 요청을 선택해주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 반려 다이얼로그 */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              결재 반려
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  반려 사유 *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력해주세요"
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDialog;