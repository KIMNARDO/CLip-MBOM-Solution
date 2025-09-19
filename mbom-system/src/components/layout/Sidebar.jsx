import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Folder, FolderOpen, Package, Layers, Settings } from 'lucide-react';
import { useBOMData } from '../../contexts/BOMDataContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const { bomData, selectedItem, setSelectedItem } = useBOMData();
  const [expandedItems, setExpandedItems] = React.useState([]);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Convert BOM data to tree structure for sidebar
  const treeData = useMemo(() => {
    if (!bomData || bomData.length === 0) {
      return [];
    }

    // Transform BOM data to sidebar tree format
    const convertToTreeData = (items) => {
      return items.map(item => ({
        id: item.id.toString(),
        label: `${item.partNumber} - ${item.description}`,
        icon: item.level === 0 ? <Folder className="w-4 h-4" /> :
               item.level === 1 ? <Layers className="w-4 h-4" /> :
               <Package className="w-4 h-4" />,
        bomItem: item,
        children: item.children ? convertToTreeData(item.children) : []
      }));
    };

    return convertToTreeData(bomData);
  }, [bomData]);

  const handleItemClick = (item, event) => {
    event.stopPropagation();
    setSelectedItem(item.bomItem);

    // Toggle expansion if has children
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    }
  };

  const renderTreeItem = (item, depth = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = selectedItem && selectedItem.id === item.bomItem?.id;

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center px-3 py-2 hover:bg-accent rounded cursor-pointer
            ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''}
            ${depth > 0 ? `ml-${depth * 4}` : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={(e) => handleItemClick(item, e)}
        >
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 mr-1 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
          <span className="mr-2">
            {isExpanded && item.children ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              item.icon
            )}
          </span>
          <span className="text-sm">{item.label}</span>
        </div>
        {isExpanded && item.children && (
          <div>
            {item.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
        bg-card border-r transition-all duration-300 flex flex-col
        ${isOpen ? 'w-64' : 'w-0'}
      `}
    >
      {isOpen && (
        <>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase">
              프로젝트 탐색기
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {treeData.length > 0 ? (
              treeData.map(item => renderTreeItem(item))
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>BOM 데이터가 없습니다</p>
                <p className="text-xs mt-1">새 BOM을 추가하여 시작하세요</p>
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;