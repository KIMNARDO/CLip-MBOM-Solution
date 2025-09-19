import { sampleBOMData, buildTreeStructure } from './src/data/sampleBOMData.js';

console.log('=== BOM Tree Structure Test ===\n');

// Build tree from flat data
const treeData = buildTreeStructure(sampleBOMData);

console.log('Original flat data items:', sampleBOMData.length);
console.log('Root level items in tree:', treeData.length);
console.log('\n=== Tree Structure ===\n');

function printTree(items, indent = '') {
  items.forEach(item => {
    console.log(`${indent}Level ${item.level}: ${item.partNumber} - ${item.description} (id: ${item.id}, parentId: ${item.parentId})`);
    if (item.children && item.children.length > 0) {
      printTree(item.children, indent + '  ');
    }
  });
}

printTree(treeData);

console.log('\n=== Flat List (as it should appear in table) ===\n');

function flattenTree(items, result = []) {
  items.forEach(item => {
    result.push({
      id: item.id,
      level: item.level,
      partNumber: item.partNumber,
      description: item.description,
      parentId: item.parentId
    });
    if (item.children && item.children.length > 0) {
      flattenTree(item.children, result);
    }
  });
  return result;
}

const flatList = flattenTree(treeData);
flatList.forEach((item, index) => {
  const indent = '  '.repeat(item.level);
  console.log(`Row ${index + 1}: ${indent}Level ${item.level} - ${item.partNumber} (parent: ${item.parentId})`);
});

console.log('\n=== Level Summary ===\n');
const levelCount = {};
sampleBOMData.forEach(item => {
  levelCount[item.level] = (levelCount[item.level] || 0) + 1;
});
Object.keys(levelCount).sort().forEach(level => {
  console.log(`Level ${level}: ${levelCount[level]} items`);
});