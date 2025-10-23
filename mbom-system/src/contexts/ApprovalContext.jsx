import React, { createContext, useContext, useState, useCallback } from 'react';

const ApprovalContext = createContext();

export const useApproval = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within ApprovalProvider');
  }
  return context;
};

export const ApprovalProvider = ({ children }) => {
  // 작성 중인 변경사항 추적
  const [pendingChanges, setPendingChanges] = useState([]);

  // 현재 작성 상태 (draft, reviewing, approved, rejected)
  const [documentStatus, setDocumentStatus] = useState('draft');

  // 결재 대기 중인 항목들
  const [approvalQueue, setApprovalQueue] = useState([]);

  // 작성 상태 표시 여부
  const [showDraftStatus, setShowDraftStatus] = useState(true);

  // 변경 이력
  const [changeHistory, setChangeHistory] = useState([]);

  // CRUD 작업 추적
  const trackChange = useCallback((operation, data) => {
    const change = {
      id: Date.now(),
      operation, // 'create', 'update', 'delete'
      data,
      timestamp: new Date().toISOString(),
      user: localStorage.getItem('username') || 'Unknown User',
      status: 'pending'
    };

    setPendingChanges(prev => [...prev, change]);
    setShowDraftStatus(true);

    // 자동으로 draft 상태로 변경
    if (documentStatus === 'approved') {
      setDocumentStatus('draft');
    }

    return change.id;
  }, [documentStatus]);

  // 변경사항 저장 (작성 완료)
  const saveChanges = useCallback(() => {
    if (pendingChanges.length === 0) {
      return { success: false, message: '변경사항이 없습니다.' };
    }

    // 변경사항을 이력에 추가
    const savedChanges = {
      id: Date.now(),
      changes: [...pendingChanges],
      savedAt: new Date().toISOString(),
      savedBy: localStorage.getItem('username') || 'Unknown User',
      status: 'saved'
    };

    setChangeHistory(prev => [...prev, savedChanges]);
    setDocumentStatus('reviewing');

    return { success: true, message: '작성이 완료되었습니다.', changeSet: savedChanges };
  }, [pendingChanges]);

  // 결재 요청
  const requestApproval = useCallback((changeSetId, approvers = []) => {
    const changeSet = changeHistory.find(cs => cs.id === changeSetId);
    if (!changeSet) {
      return { success: false, message: '변경사항을 찾을 수 없습니다.' };
    }

    const approvalRequest = {
      id: Date.now(),
      changeSetId,
      requestedBy: localStorage.getItem('username') || 'Unknown User',
      requestedAt: new Date().toISOString(),
      approvers: approvers.length > 0 ? approvers : ['Manager', 'Director'], // 기본 결재자
      status: 'pending',
      comments: [],
      changeCount: changeSet.changes.length
    };

    setApprovalQueue(prev => [...prev, approvalRequest]);
    setDocumentStatus('reviewing');

    return { success: true, message: '결재가 요청되었습니다.', requestId: approvalRequest.id };
  }, [changeHistory]);

  // 결재 승인
  const approveRequest = useCallback((requestId, approverName, comments = '') => {
    setApprovalQueue(prev => prev.map(req => {
      if (req.id === requestId) {
        const approved = {
          ...req,
          status: 'approved',
          approvedBy: approverName,
          approvedAt: new Date().toISOString(),
          comments: [...req.comments, { user: approverName, text: comments, timestamp: new Date().toISOString() }]
        };

        // 모든 변경사항 적용
        setPendingChanges([]);
        setDocumentStatus('approved');

        return approved;
      }
      return req;
    }));

    return { success: true, message: '결재가 승인되었습니다.' };
  }, []);

  // 결재 반려
  const rejectRequest = useCallback((requestId, approverName, reason) => {
    setApprovalQueue(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'rejected',
          rejectedBy: approverName,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
          comments: [...req.comments, { user: approverName, text: `반려: ${reason}`, timestamp: new Date().toISOString() }]
        };
      }
      return req;
    }));

    setDocumentStatus('rejected');

    return { success: true, message: '결재가 반려되었습니다.' };
  }, []);

  // 변경사항 취소
  const discardChanges = useCallback(() => {
    setPendingChanges([]);
    setShowDraftStatus(false);
    setDocumentStatus('draft');

    return { success: true, message: '모든 변경사항이 취소되었습니다.' };
  }, []);

  // 특정 변경사항 취소
  const cancelChange = useCallback((changeId) => {
    setPendingChanges(prev => prev.filter(change => change.id !== changeId));

    return { success: true, message: '변경사항이 취소되었습니다.' };
  }, []);

  const value = {
    // 상태
    pendingChanges,
    documentStatus,
    approvalQueue,
    showDraftStatus,
    changeHistory,

    // 액션
    trackChange,
    saveChanges,
    requestApproval,
    approveRequest,
    rejectRequest,
    discardChanges,
    cancelChange,
    setShowDraftStatus
  };

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
};