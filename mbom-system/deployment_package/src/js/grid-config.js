// ag-Grid 설정 및 관리
class BOMGridManager {
    constructor() {
        this.gridOptions = null;
        this.gridApi = null;
        this.columnApi = null;
        this.init();
    }
    
    init() {
        this.setupGridOptions();
        this.createGrid();
        this.setupEventHandlers();
    }
    
    setupGridOptions() {
        this.gridOptions = {
            // 컬럼 정의
            columnDefs: this.getColumnDefs(),
            
            // 기본 설정
            defaultColDef: {
                editable: true,
                sortable: true,
                filter: true,
                resizable: true,
                minWidth: 100
            },
            
            // 트리 데이터 설정
            treeData: true,
            animateRows: true,
            groupDefaultExpanded: 1,
            getDataPath: (data) => data.treePath,
            autoGroupColumnDef: {
                headerName: 'Part Structure',
                minWidth: 300,
                cellRendererParams: {
                    suppressCount: true,
                    innerRenderer: (params) => {
                        // Level 0에서 PartNumber 정확히 표시
                        if (params.node.level === 0) {
                            return params.data.partNo || params.value;
                        }
                        return params.value;
                    }
                }
            },
            
            // 편집 설정
            editType: 'fullRow',
            stopEditingWhenCellsLoseFocus: true,
            
            // 선택 설정
            rowSelection: 'multiple',
            rowMultiSelectWithClick: true,
            
            // 드래그 앤 드롭
            rowDragManaged: true,
            
            // 이벤트 핸들러
            onCellValueChanged: this.onCellValueChanged.bind(this),
            onRowSelected: this.onRowSelected.bind(this),
            onCellContextMenu: this.onCellContextMenu.bind(this),
            
            // 스타일링
            getRowStyle: this.getRowStyle.bind(this),
            getCellStyle: this.getCellStyle.bind(this),
            getRowClass: this.getRowClass.bind(this)
        };
    }
    
    getColumnDefs() {
        return [
            // 체크박스 선택
            {
                headerCheckboxSelection: true,
                checkboxSelection: true,
                width: 50,
                pinned: 'left'
            },

            // 순번
            {
                headerName: '순번',
                field: 'seq',
                width: 70,
                pinned: 'left',
                editable: false,
                valueGetter: 'node.rowIndex + 1'
            },
            
            // 고객사
            {
                headerName: '고객사',
                field: 'customer',
                width: 120,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: this.getCustomerList()
                }
            },
            
            // 차종
            {
                headerName: '차종',
                field: 'vehicle',
                width: 120,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: (params) => {
                    return {
                        values: this.getVehicleList(params.data.customer)
                    };
                }
            },
            
            // 프로젝트
            {
                headerName: '프로젝트',
                field: 'project',
                width: 150,
                pinned: 'left',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: (params) => {
                    return {
                        values: this.getProjectList(params.data.vehicle)
                    };
                }
            },
            
            // LEVEL 컬럼들 (동적 생성) - 트리 구조와 함께 표시
            ...this.getLevelColumns(),
            
            // 품번
            {
                headerName: 'Part No.',
                children: [
                    {
                        headerName: '품번',
                        field: 'partNo',
                        width: 150,
                        pinned: 'left'
                    },
                    {
                        headerName: 'S/ON 품번',
                        field: 'sonPartNo',
                        width: 150
                    },
                    {
                        headerName: '대체품번',
                        field: 'altPartNo',
                        width: 150
                    }
                ]
            },
            
            // PART NAME
            {
                headerName: 'PART NAME',
                field: 'partName',
                width: 200,
                pinned: 'left'
            },
            
            // IMAGE
            {
                headerName: 'IMAGE',
                field: 'image',
                width: 100,
                pinned: 'left',
                cellRenderer: this.imageCellRenderer,
                editable: false
            },
            
            // U/S (사양별 수량) - 동적 생성
            ...this.getSpecColumns(),
            
            // 재질 정보
            {
                headerName: '재질 정보',
                children: [
                    {
                        headerName: '재질',
                        field: 'material',
                        width: 120,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: this.getMaterialList()
                        }
                    },
                    {
                        headerName: '표면처리',
                        field: 'surface',
                        width: 120
                    }
                ]
            },
            
            // 도면 정보
            {
                headerName: '도면',
                children: [
                    {
                        headerName: '2D',
                        field: 'has2D',
                        width: 50,
                        cellRenderer: this.fileCellRenderer
                    },
                    {
                        headerName: '3D',
                        field: 'has3D',
                        width: 50,
                        cellRenderer: this.fileCellRenderer
                    },
                    {
                        headerName: 'EO NO',
                        field: 'eoNo',
                        width: 120
                    },
                    {
                        headerName: 'C/N',
                        field: 'revision',
                        width: 80
                    },
                    {
                        headerName: '타입',
                        field: 'type',
                        width: 100,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: ['ASSY', 'S/ASSY', 'Detail']
                        }
                    }
                ]
            },
            
            // 비고
            {
                headerName: '비고',
                field: 'remark',
                width: 200
            }
        ];
    }
    
    getLevelColumns() {
        const levels = [];
        for (let i = 0; i <= 4; i++) {
            levels.push({
                headerName: `LEVEL ${i}`,
                field: `level${i}`,
                width: 150,
                cellClass: (params) => {
                    // Level 0에서 PartNumber를 표시
                    if (i === 0 && params.data.level0) {
                        return 'level-cell level-0-cell';
                    }
                    return `level-cell level-${i}-cell`;
                },
                // Level 0 컬럼에 PartNumber 표시 수정
                valueGetter: (params) => {
                    if (i === 0) {
                        // Level 0에서는 level0 필드 또는 partNo를 표시
                        return params.data.level0 || (params.data.treePath && params.data.treePath.length === 1 ? params.data.partNo : '');
                    }
                    return params.data[`level${i}`] || '';
                },
                cellRenderer: (params) => {
                    // 트리 구조 라인을 포함한 렌더러
                    const value = params.value || '';
                    const level = params.node.level || 0;

                    if (i === level && value) {
                        // 현재 레벨에 해당하는 경우 트리 아이콘과 함께 표시
                        const hasChildren = params.node.allChildrenCount > 0;
                        const expanded = params.node.expanded;
                        const indent = level * 20;

                        return `
                            <div class="tree-cell" style="padding-left: ${indent}px;">
                                ${hasChildren ?
                                    `<span class="tree-icon ${expanded ? 'expanded' : 'collapsed'}">
                                        <i class="fas fa-${expanded ? 'chevron-down' : 'chevron-right'}"></i>
                                    </span>` :
                                    '<span class="tree-icon leaf"></span>'
                                }
                                <span class="tree-value">${value}</span>
                            </div>
                        `;
                    }
                    return value;
                }
            });
        }
        return levels;
    }
    
    getSpecColumns() {
        // 실제로는 API에서 가져옴
        const specs = ['SPEC01', 'SPEC02', 'SPEC03'];
        return specs.map(spec => ({
            headerName: spec,
            field: `us_${spec}`,
            width: 80,
            type: 'numericColumn',
            cellClass: 'spec-cell'
        }));
    }
    
    createGrid() {
        const gridDiv = document.querySelector('#bomGrid');
        if (gridDiv) {
            new agGrid.Grid(gridDiv, this.gridOptions);
            this.gridApi = this.gridOptions.api;
            this.columnApi = this.gridOptions.columnApi;
            this.loadData();
        }
    }
    
    async loadData() {
        try {
            // 샘플 데이터 로드 (실제로는 API 호출)
            const sampleData = typeof dataLoader !== 'undefined' ? 
                dataLoader.getBOMData() : this.getSampleData();
            this.gridApi.setRowData(sampleData);
        } catch (error) {
            console.error('Failed to load BOM data:', error);
        }
    }
    
    getSampleData() {
        return [
            {
                treePath: ['ASSY-001'],
                customer: '현대자동차',
                vehicle: '아반떼',
                project: 'CN7',
                level0: 'ASSY-001', // Level 0에 정확히 표시
                partNo: 'ASSY-001',
                partName: 'Main Assembly',
                material: 'Steel',
                type: 'ASSY',
                eoNo: 'EO-2024-001',
                revision: 'A',
                us_SPEC01: 1,
                us_SPEC02: 1,
                us_SPEC03: 1,
                has2D: true,
                has3D: true
            },
            {
                treePath: ['ASSY-001', 'SUB-001'],
                customer: '현대자동차',
                vehicle: '아반떼',
                project: 'CN7',
                level0: 'ASSY-001',
                level1: 'SUB-001',
                partNo: 'SUB-001',
                partName: 'Sub Assembly 1',
                material: 'Aluminum',
                type: 'S/ASSY',
                eoNo: 'EO-2024-002',
                revision: 'B',
                us_SPEC01: 2,
                us_SPEC02: 2,
                us_SPEC03: 1,
                has2D: true,
                has3D: false,
                modified: true
            },
            {
                treePath: ['ASSY-001', 'SUB-001', 'PART-001'],
                customer: '현대자동차',
                vehicle: '아반떼',
                project: 'CN7',
                level0: 'ASSY-001',
                level1: 'SUB-001',
                level2: 'PART-001',
                partNo: 'PART-001',
                partName: 'Bolt M10x30',
                material: 'SUS304',
                type: 'Detail',
                eoNo: 'EO-2024-003',
                revision: 'A',
                us_SPEC01: 10,
                us_SPEC02: 10,
                us_SPEC03: 8,
                has2D: true,
                has3D: true
            }
        ];
    }
    
    setupEventHandlers() {
        // 버튼 이벤트 핸들러
        document.getElementById('btnAddRow')?.addEventListener('click', () => this.addRow());
        document.getElementById('btnSave')?.addEventListener('click', () => this.saveData());
        document.getElementById('btnExport')?.addEventListener('click', () => this.exportToExcel());
        document.getElementById('btnFullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        
        // 트리 버튼
        document.getElementById('btnFoldAll')?.addEventListener('click', () => this.collapseAll());
        document.getElementById('btnUnfoldAll')?.addEventListener('click', () => this.expandAll());
        document.getElementById('btnRefresh')?.addEventListener('click', () => this.refreshData());
        
        // 검색 폼
        document.getElementById('searchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchBOM();
        });
    }
    
    onCellValueChanged(params) {
        // 셀 값 변경 시 수정 플래그 설정
        params.node.setDataValue('modified', true);
        this.gridApi.refreshCells({
            rowNodes: [params.node],
            force: true
        });
    }
    
    onRowSelected(params) {
        // 행 선택 시 미리보기 업데이트
        if (params.node.isSelected()) {
            this.updatePreview(params.data);
        }
    }
    
    onCellContextMenu(params) {
        // 컨텍스트 메뉴 표시
        const contextMenu = new ContextMenuManager();
        contextMenu.show(params.event, params.data);
    }
    
    getRowStyle(params) {
        // 행 스타일 설정 - 레벨별 색상 추가
        const level = params.node.level || 0;
        const levelColors = [
            '#f0f4ff', // Level 0 - 연한 파란색
            '#f5f0ff', // Level 1 - 연한 보라색
            '#f0fff4', // Level 2 - 연한 초록색
            '#fff9f0', // Level 3 - 연한 주황색
            '#fff0f5'  // Level 4 - 연한 분홍색
        ];

        // 상태별 스타일 우선 적용
        if (params.data.deleted) {
            return { background: '#ffcccc' };
        }
        if (params.data.modified) {
            return { background: '#ffffcc' };
        }
        if (params.data.deployed) {
            return { background: '#e0e0e0' };
        }

        // 레벨별 배경색 적용
        if (level < levelColors.length) {
            return { background: levelColors[level] };
        }

        return null;
    }
    
    getCellStyle(params) {
        // 셀 스타일 설정
        if (params.data.searchMatch && params.colDef.field === 'partNo') {
            return { background: '#cce5ff' };
        }
        if (params.data.requiredMissing && this.isRequiredField(params.colDef.field)) {
            return { background: '#ffccdd' };
        }
        return null;
    }

    getRowClass(params) {
        // 행 클래스 설정 - 레벨별 스타일링을 위해
        const classes = [];
        const level = params.node.level || 0;

        // 레벨별 클래스 추가
        classes.push(`ag-row-level-${level}`);

        // 상태별 클래스 추가
        if (params.data.deleted) {
            classes.push('highlight-deleted');
        } else if (params.data.modified) {
            classes.push('highlight-modified');
        } else if (params.data.deployed) {
            classes.push('highlight-deployed');
        }

        return classes.join(' ');
    }
    
    imageCellRenderer(params) {
        if (params.value) {
            return `<div class="image-cell"><img src="${params.value}" alt="Part Image"></div>`;
        }
        return '<div class="image-cell"><i class="fas fa-image text-muted"></i></div>';
    }
    
    fileCellRenderer(params) {
        if (params.value) {
            return '<i class="fas fa-circle file-icon"></i>';
        }
        return '<i class="fas fa-circle file-icon missing"></i>';
    }
    
    updatePreview(data) {
        const previewContainer = document.getElementById('previewContainer');
        if (data.image) {
            previewContainer.innerHTML = `<img src="${data.image}" class="img-fluid" alt="${data.partName}">`;
        } else {
            previewContainer.innerHTML = '<p class="text-muted">이미지가 없습니다.</p>';
        }
    }
    
    // 데이터 소스 메서드
    getCustomerList() {
        return ['현대자동차', '기아자동차', 'GM', '르노'];
    }
    
    getVehicleList(customer) {
        // 실제로는 customer에 따라 다른 리스트
        return ['아반떼', '소나타', '그랜저', '싼타페'];
    }
    
    getProjectList(vehicle) {
        // 실제로는 vehicle에 따라 다른 리스트
        return ['CN7', 'DN8', 'LX2'];
    }
    
    getMaterialList() {
        return ['Steel', 'Aluminum', 'Plastic', 'Rubber', 'SUS304', 'ABS'];
    }
    
    isRequiredField(field) {
        const requiredFields = ['customer', 'vehicle', 'project', 'partNo', 'partName', 'type', 'eoNo'];
        return requiredFields.includes(field);
    }
    
    // 기능 메서드
    addRow() {
        const newRow = {
            treePath: ['NEW-' + Date.now()],
            customer: '',
            vehicle: '',
            project: '',
            partNo: '',
            partName: '',
            type: 'Detail',
            modified: true
        };
        
        this.gridApi.applyTransaction({ add: [newRow] });
    }
    
    saveData() {
        const rowData = [];
        this.gridApi.forEachNode(node => rowData.push(node.data));
        
        console.log('Saving data:', rowData);
        alert('데이터가 저장되었습니다.');
    }
    
    exportToExcel() {
        this.gridApi.exportDataAsExcel({
            fileName: 'BOM_Export_' + new Date().toISOString().split('T')[0] + '.xlsx'
        });
    }
    
    toggleFullscreen() {
        const gridContainer = document.querySelector('.col-md-9');
        gridContainer.classList.toggle('fullscreen-mode');
        this.gridApi.sizeColumnsToFit();
    }
    
    expandAll() {
        this.gridApi.expandAll();
    }
    
    collapseAll() {
        this.gridApi.collapseAll();
    }
    
    refreshData() {
        this.loadData();
    }
    
    searchBOM() {
        const searchParams = {
            customer: document.getElementById('customer').value,
            vehicle: document.getElementById('vehicle').value,
            project: document.getElementById('project').value,
            eoNo: document.getElementById('eoNo').value,
            partNo: document.getElementById('partNo').value
        };
        
        console.log('Searching with params:', searchParams);
        // API 호출하여 검색 결과 로드
        this.loadData();
    }
}

// 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    const bomGrid = new BOMGridManager();
    window.bomGrid = bomGrid;
});