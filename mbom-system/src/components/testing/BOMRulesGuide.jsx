import React, { useState } from 'react';
import { Info, AlertCircle, CheckCircle, XCircle, MoveHorizontal, ArrowRight, Users, User, X } from 'lucide-react';

/**
 * BOM 드래그앤드롭 규칙 가이드
 * 기구 설계 원칙에 따른 이동 규칙을 시각적으로 표시
 */
export const BOMRulesGuide = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const rules = [
    {
      id: 'same-level',
      title: '같은 레벨 이동',
      icon: <MoveHorizontal className="w-5 h-5" />,
      allowed: true,
      description: '같은 레벨끼리 자유롭게 이동',
      examples: [
        { from: 'Level 2 → Level 2', to: '다른 위치', result: '✅ 가능' },
        { from: 'Level 1 → Level 1', to: '다른 위치', result: '✅ 가능' }
      ],
      details: '같은 레벨의 아이템들은 위치를 자유롭게 변경할 수 있습니다.'
    },
    {
      id: 'parent-with-children',
      title: '자식이 있는 부모 이동',
      icon: <Users className="w-5 h-5" />,
      allowed: true,
      description: '부모가 이동하면 자식들도 함께 이동',
      examples: [
        { from: 'Level 1 (자식 포함)', to: 'Level 1 (다른 위치)', result: '✅ 자식도 함께 이동' },
        { from: 'Level 2 (자식 포함)', to: 'Level 1 부모', result: '✅ Level 1의 자식으로 이동' }
      ],
      details: '부모는 자식과 함께 이동합니다. 자식을 가진 부모도 다른 부모의 자식이 될 수 있습니다.'
    },
    {
      id: 'child-to-parent',
      title: '하위 레벨이 상위 레벨의 자식으로',
      icon: <User className="w-5 h-5" />,
      allowed: true,
      description: '하위 레벨은 상위 레벨의 자식이 될 수 있음',
      examples: [
        { from: 'Level 2', to: 'Level 1 부모', result: '✅ Level 1의 자식으로' },
        { from: 'Level 3', to: 'Level 2 부모', result: '✅ Level 2의 자식으로' },
        { from: 'Level 1', to: 'Level 0 부모', result: '✅ Level 0의 자식으로' }
      ],
      details: '하위 레벨 아이템은 바로 위 상위 레벨 아이템의 자식이 될 수 있습니다.'
    },
    {
      id: 'level-restriction',
      title: '레벨 변경 제한',
      icon: <XCircle className="w-5 h-5" />,
      allowed: false,
      description: '직접적인 레벨 변경 불가',
      examples: [
        { from: 'Level 1', to: 'Level 2', result: '❌ 불가능' },
        { from: 'Level 2', to: 'Level 0', result: '❌ 불가능' }
      ],
      details: '아이템의 레벨은 부모-자식 관계를 통해서만 결정됩니다. 직접 레벨을 변경할 수 없습니다.'
    }
  ];

  return (
    <div className="fixed top-20 left-[320px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-[600px] overflow-y-auto z-[100]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Info className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">BOM 이동 규칙 가이드</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* 기본 원칙 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🏗️ 기구 설계 원칙</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 같은 레벨끼리 자유롭게 이동 가능</li>
          <li>• 부모와 자식은 함께 이동 (계층 구조 유지)</li>
          <li>• 하위 레벨 아이템은 상위 레벨 부모의 자식이 될 수 있음</li>
          <li>• Level 2 → Level 1 부모의 자식으로 이동 가능</li>
          <li>• Level 3 → Level 2 부모의 자식으로 이동 가능</li>
        </ul>
      </div>

      {/* 상세 규칙 */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 mb-2">📋 상세 규칙</h4>
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`border rounded-lg overflow-hidden ${
              rule.allowed === true ? 'border-green-200' :
              rule.allowed === false ? 'border-red-200' :
              'border-yellow-200'
            }`}
          >
            <button
              onClick={() => setExpandedSection(expandedSection === rule.id ? null : rule.id)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={
                  rule.allowed === true ? 'text-green-500' :
                  rule.allowed === false ? 'text-red-500' :
                  'text-yellow-500'
                }>
                  {rule.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{rule.title}</div>
                  <div className="text-xs text-gray-600">{rule.description}</div>
                </div>
              </div>
              <div className="text-gray-400">
                {expandedSection === rule.id ? '−' : '+'}
              </div>
            </button>

            {expandedSection === rule.id && (
              <div className="p-3 pt-0 border-t border-gray-100">
                <div className="text-xs text-gray-700 mb-2">{rule.details}</div>
                <div className="space-y-1">
                  {rule.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{example.from}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{example.to}</span>
                      </div>
                      <span className={
                        example.result.includes('✅') ? 'text-green-600' :
                        example.result.includes('❌') ? 'text-red-600' :
                        'text-yellow-600'
                      }>
                        {example.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 경고 메시지 예시 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-yellow-900">시스템 경고 예시</div>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              <li>• "Level 2는 Level 0으로 직접 이동할 수 없습니다"</li>
              <li>• "부모가 자식보다 높은 레벨이 될 수 없습니다"</li>
              <li>• "하위 레벨 아이템은 상위 레벨의 자식으로 이동 가능합니다"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMRulesGuide;