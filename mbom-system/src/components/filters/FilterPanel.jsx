import React from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { Search, Filter } from 'lucide-react';

const FilterPanel = () => {
  const { filters, setFilters } = useBOMData();

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="card">
      <div className="card-content py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project Select */}
          <div className="space-y-2">
            <label className="label text-sm">프로젝트</label>
            <select
              className="select select-sm"
              value={filters.project}
              onChange={(e) => handleFilterChange('project', e.target.value)}
            >
              <option value="">전체 프로젝트</option>
              <option value="project-2024">2024년형</option>
              <option value="project-2025">2025년형</option>
            </select>
          </div>

          {/* Part Number Search */}
          <div className="space-y-2">
            <label className="label text-sm">품번 검색</label>
            <div className="relative">
              <input
                type="text"
                className="input input-sm pl-8"
                placeholder="품번 입력"
                value={filters.partNumber}
                onChange={(e) => handleFilterChange('partNumber', e.target.value)}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="label text-sm">상태</label>
            <select
              className="select select-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">전체 상태</option>
              <option value="approved">승인</option>
              <option value="review">검토중</option>
              <option value="draft">작성중</option>
              <option value="rejected">반려</option>
            </select>
          </div>

          {/* Level Filter */}
          <div className="space-y-2">
            <label className="label text-sm">레벨</label>
            <select
              className="select select-sm"
              value={filters.level ?? ''}
              onChange={(e) => handleFilterChange('level', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">전체 레벨</option>
              <option value="0">Level 0 (Assembly)</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3+</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setFilters({
              project: '',
              partNumber: '',
              status: '',
              level: null
            })}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;