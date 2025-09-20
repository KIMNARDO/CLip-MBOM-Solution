import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { sampleBOMData, buildTreeStructure, sampleChanges } from '../data/sampleBOMData';

const BOMDataContext = createContext();

export const useBOMData = () => {
  const context = useContext(BOMDataContext);
  if (!context) {
    throw new Error('useBOMData must be used within a BOMDataProvider');
  }
  return context;
};

export const BOMDataProvider = ({ children }) => {
  // Initialize with tree structured data directly
  const initialTreeData = buildTreeStructure(sampleBOMData);

  const [bomData, setBomData] = useState(initialTreeData);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modifiedItems, setModifiedItems] = useState(new Set());
  const [changeHistory, setChangeHistory] = useState(sampleChanges);
  const [loading, setLoading] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  const [customColumns, setCustomColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [filters, setFilters] = useState({
    project: '',
    partNumber: '',
    status: '',
    level: null
  });

  // Load initial BOM data
  useEffect(() => {
    // Data is already initialized, just log it
    console.log('BOM Data initialized with', bomData.length, 'root items');
    if (bomData.length > 0) {
      console.log('First item:', bomData[0]);
    }
  }, []);

  const loadBOMData = useCallback(() => {
    console.log('=== BOMDataContext - loadBOMData START ===');
    setLoading(true);
    
    console.log('Sample BOM data:', sampleBOMData);
    console.log('Sample data length:', sampleBOMData.length);
    console.log('First sample item:', sampleBOMData[0]);
    
    try {
      // Use complete BOM data from original M-BOM.html
      const treeData = buildTreeStructure(sampleBOMData);
      console.log('Tree data built successfully:', treeData);
      console.log('Tree data length:', treeData.length);
      
      if (treeData.length > 0) {
        console.log('First tree item:', treeData[0]);
        console.log('Tree structure sample:', {
          id: treeData[0].id,
          partNumber: treeData[0].partNumber,
          children: treeData[0].children?.length || 0
        });
      }
      
      console.log('Setting bomData state...');
      setBomData(treeData);
      console.log('BOM data state set successfully');
    } catch (error) {
      console.error('Error in loadBOMData:', error);
    } finally {
      setLoading(false);
      console.log('=== BOMDataContext - loadBOMData COMPLETED ===');
    }
  }, []);

  const loadBOMDataOld = useCallback(() => {
    setLoading(true);
    // Sample BOM data - in production, this would be an API call
    const sampleData = [
      {
        id: 1,
        level: 0,
        partNumber: 'ASM-001ASSY',
        description: 'ENGINE',
        quantity: 1,
        unit: 'EA',
        material: 'Aluminum/Steel',
        weight: 180.5,
        supplier: '현대파워텍',
        cost: 2500000,
        leadTime: 45,
        status: 'approved',
        lastModified: new Date().toISOString(),
        notes: 'Gasoline Direct Injection Engine',
        expanded: true,
        hasChildren: true,
        children: [
          {
            id: 2,
            level: 1,
            partNumber: 'BLOCK-001',
            description: '알루미늄 다이캐스트 엔진 블록',
            quantity: 1,
            unit: 'EA',
            material: 'Aluminum',
            weight: 45.2,
            supplier: '현대위아',
            cost: 450000,
            leadTime: 30,
            status: 'approved',
            lastModified: new Date().toISOString(),
            notes: 'Die-cast aluminum cylinder block',
            expanded: false,
            hasChildren: true,
            children: [
              {
                id: 3,
                level: 2,
                partNumber: 'CYLINDER-001',
                description: '주철 실린더 라이너 슬리브',
                quantity: 6,
                unit: 'EA',
                material: 'Cast Iron',
                weight: 2.1,
                supplier: '삼성정밀',
                cost: 25000,
                leadTime: 15,
                status: 'approved',
                lastModified: new Date().toISOString(),
                notes: 'Wear-resistant cast iron sleeve'
              }
            ]
          },
          {
            id: 4,
            level: 1,
            partNumber: 'HEAD-001',
            description: 'DOHC 알루미늄 실린더 헤드',
            quantity: 2,
            unit: 'EA',
            material: 'Aluminum',
            weight: 22.8,
            supplier: '현대위아',
            cost: 380000,
            leadTime: 25,
            status: 'review',
            lastModified: new Date().toISOString(),
            notes: 'Dual Overhead Camshaft'
          }
        ]
      },
      {
        id: 5,
        level: 0,
        partNumber: 'ASM-002ASSY',
        description: 'TRANSMISSION',
        quantity: 1,
        unit: 'EA',
        material: 'Aluminum/Steel',
        weight: 85.3,
        supplier: '현대파워텍',
        cost: 1800000,
        leadTime: 40,
        status: 'approved',
        lastModified: new Date().toISOString(),
        notes: '8-Speed Automatic Transmission',
        expanded: false,
        hasChildren: true,
        children: []
      }
    ];

    setBomData(sampleData);
    setLoading(false);
  }, []);

  const updateBOMItem = useCallback((itemId, updates) => {
    setBomData(prevData => {
      const updateItemRecursive = (items) => {
        return items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, ...updates, lastModified: new Date().toISOString() };
            setModifiedItems(prev => new Set([...prev, itemId]));
            return updatedItem;
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateItemRecursive(item.children) };
          }
          return item;
        });
      };

      return updateItemRecursive(prevData);
    });
  }, []);

  const addBOMItem = useCallback((parentId, newItem) => {
    setBomData(prevData => {
      const addItemRecursive = (items) => {
        return items.map(item => {
          if (item.id === parentId) {
            const children = item.children || [];
            const newItemWithDefaults = {
              id: Date.now(),
              level: item.level + 1,
              status: 'draft',
              lastModified: new Date().toISOString(),
              hasChildren: false,
              ...newItem
            };
            return {
              ...item,
              children: [...children, newItemWithDefaults],
              hasChildren: true
            };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: addItemRecursive(item.children) };
          }
          return item;
        });
      };

      return parentId ? addItemRecursive(prevData) : [...prevData, {
        id: Date.now(),
        level: 0,
        status: 'draft',
        lastModified: new Date().toISOString(),
        hasChildren: false,
        ...newItem
      }];
    });
  }, []);

  const deleteBOMItem = useCallback((itemId) => {
    setBomData(prevData => {
      const deleteItemRecursive = (items) => {
        return items
          .filter(item => item.id !== itemId)
          .map(item => {
            if (item.children && item.children.length > 0) {
              return { ...item, children: deleteItemRecursive(item.children) };
            }
            return item;
          });
      };

      return deleteItemRecursive(prevData);
    });
  }, []);

  const saveBOMData = useCallback(async () => {
    try {
      // In production, this would be an API call
      console.log('Saving BOM data:', bomData);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setModifiedItems(new Set());
      return { success: true };
    } catch (error) {
      console.error('Error saving BOM data:', error);
      return { success: false, error: error.message };
    }
  }, [bomData]);

  const moveItem = useCallback((itemId, newParentId, newIndex) => {
    setBomData(prevData => {
      // Prevent moving if IDs are the same
      if (itemId === newParentId) {
        console.warn('Cannot move item to itself');
        return prevData;
      }

      // Create a deep clone to avoid mutations
      const clonedData = JSON.parse(JSON.stringify(prevData));

      let movedItem = null;
      let sourceParent = null;

      // Function to find and remove the item
      const removeItem = (items, parent = null) => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === itemId) {
            movedItem = items.splice(i, 1)[0];
            sourceParent = parent;
            return true;
          }
          if (items[i].children && items[i].children.length > 0) {
            if (removeItem(items[i].children, items[i])) {
              // Clean up empty children array
              if (items[i].children.length === 0) {
                delete items[i].children;
                items[i].hasChildren = false;
              }
              return true;
            }
          }
        }
        return false;
      };

      // Function to update levels recursively
      const updateLevels = (item, newLevel) => {
        item.level = newLevel;
        if (item.children && item.children.length > 0) {
          item.children.forEach(child => updateLevels(child, newLevel + 1));
        }
      };

      // Function to add item to new parent
      const addToParent = (items, parentId, parentLevel = 0) => {
        if (!parentId) {
          // Add to root level
          if (movedItem) {
            updateLevels(movedItem, 0);
            const insertIndex = Math.min(newIndex || 0, items.length);
            items.splice(insertIndex, 0, movedItem);
          }
          return true;
        }

        for (let item of items) {
          if (item.id === parentId) {
            // Initialize children array if not exists
            if (!item.children) {
              item.children = [];
            }
            if (movedItem) {
              updateLevels(movedItem, item.level + 1);
              const insertIndex = Math.min(newIndex || 0, item.children.length);
              item.children.splice(insertIndex, 0, movedItem);
              item.hasChildren = true;
            }
            return true;
          }
          if (item.children && item.children.length > 0) {
            if (addToParent(item.children, parentId, item.level + 1)) {
              return true;
            }
          }
        }
        return false;
      };

      // Check for circular reference
      const checkCircular = (targetId, itemToCheck) => {
        if (!itemToCheck || !itemToCheck.children) return false;

        for (let child of itemToCheck.children) {
          if (child.id === targetId) return true;
          if (checkCircular(targetId, child)) return true;
        }
        return false;
      };

      // Find the item first to check for circular reference
      const findItem = (items, id) => {
        for (let item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findItem(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const itemToMove = findItem(clonedData, itemId);
      if (newParentId && itemToMove && checkCircular(newParentId, itemToMove)) {
        console.error('Cannot create circular reference');
        return prevData;
      }

      // Remove item from current position
      const removed = removeItem(clonedData);

      if (removed && movedItem) {
        // Add to new position
        addToParent(clonedData, newParentId);
        setModifiedItems(prev => new Set([...prev, itemId]));
        console.log(`Moved item ${itemId} to parent ${newParentId || 'root'}`);
      } else {
        console.error(`Failed to move item ${itemId}`);
        return prevData;
      }

      return clonedData;
    });
  }, []);

  // 사이드바-그리드 동기화 함수
  const toggleNodeExpanded = useCallback((nodeId, expanded) => {
    setExpandedNodeIds(prev => {
      const newSet = new Set(prev);
      if (expanded) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }

      // AG-Grid API를 통해 그리드 노드 상태 동기화
      if (gridApi) {
        gridApi.forEachNode((node) => {
          if (node.data && node.data.id === nodeId) {
            gridApi.setRowNodeExpanded(node, expanded);
          }
        });
      }

      return newSet;
    });
  }, [gridApi]);

  // 동적 컬럼 추가 함수
  const addCustomColumn = useCallback((column) => {
    setCustomColumns(prev => [...prev, {
      id: Date.now(),
      field: column.field,
      headerName: column.headerName,
      editable: true,
      width: 150,
      ...column
    }]);
  }, []);

  // 동적 컬럼 삭제 함수
  const removeCustomColumn = useCallback((columnId) => {
    setCustomColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);

  const value = {
    bomData,
    selectedItem,
    modifiedItems,
    changeHistory,
    loading,
    filters,
    expandedNodeIds,
    customColumns,
    gridApi,
    setSelectedItem,
    setFilters,
    setChangeHistory,
    setExpandedNodeIds,
    setCustomColumns,
    setGridApi,
    loadBOMData,
    updateBOMItem,
    addBOMItem,
    deleteBOMItem,
    saveBOMData,
    moveItem,
    toggleNodeExpanded,
    addCustomColumn,
    removeCustomColumn
  };

  return (
    <BOMDataContext.Provider value={value}>
      {children}
    </BOMDataContext.Provider>
  );
};