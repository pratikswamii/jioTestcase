import { Component, OnInit, HostListener, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService, Folder, TestCase } from '../../services/repository.service';
import { AddFolderModalComponent } from '../add-folder-modal/add-folder-modal';
import { AddTestCaseModalComponent } from '../add-test-case-modal/add-test-case-modal';
import { ImportTestCaseModalComponent } from '../import-test-case-modal/import-test-case-modal';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [CommonModule, FormsModule, AddFolderModalComponent, AddTestCaseModalComponent, ImportTestCaseModalComponent],
  templateUrl: './repository.html',
  styleUrl: './repository.css',
})
export class RepositoryComponent implements OnInit {
  projectId: string = '';
  folderSelection: string = 'all';

  folders: Folder[] = [];
  folderTree: any[] = [];
  folderSearchTerm = '';
  searchTitle = '';
  filterPriority = '';
  filterType = '';
  expandedFolderIds: Set<string> = new Set();
  activeFolderMenu: string | null = null;
  activeFolderParentId: string | null = null;

  selectedTestCase: TestCase | null = null;
  activeTab = 'Comments';

  selectedCaseIds: Set<string> = new Set();
  testCaseToEdit: TestCase | null = null;
  folderToEdit: Folder | null = null;

  isFolderModalOpen = false;
  isTestCaseModalOpen = false;
  isImportOpen = false;
  isExportOpen = false;
  isGlobalImportModalOpen = false;
  isAddMenuOpen = false;
  isColumnsMenuOpen = false;

  columns = [
    { key: 'id', label: 'ID', default: true },
    { key: 'title', label: 'Title', default: true },
    { key: 'owner', label: 'Owner', default: true },
    { key: 'state', label: 'State', default: true },
    { key: 'type', label: 'Type', default: true },
    { key: 'automation', label: 'Automation', default: false },
    { key: 'priority', label: 'Priority', default: false },
    { key: 'createdAt', label: 'Created At', default: false },
    { key: 'modifiedAt', label: 'Modified At', default: false },
    { key: 'modifiedBy', label: 'Modified By', default: false }
  ];
  visibleColumns: Set<string> = new Set();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  importType = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repositoryService: RepositoryService,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadColumnPreferences();

    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = id;
        this.loadData();
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = id;
        this.loadData();
      }
    });
  }

  loadData() {
    if (this.projectId) {
      this.folders = this.repositoryService.getFolders(this.projectId);
      if (this.folders.length === 0) {
        this.repositoryService.addFolder(this.projectId, { name: 'Restored Test Cases' });
        this.folders = this.repositoryService.getFolders(this.projectId);
      }
      this.buildFolderTree();
      
      this.repositoryService.getAllCases().subscribe({
        next: (cases) => {
          this.folders.forEach(f => f.cases = []);
          
          cases.forEach(tc => {
            let folder = this.folders.find(f => f.id === tc.folderId);
            if (!folder && this.folders.length > 0) {
              folder = this.folders[0]; 
            }
            if (folder) {
              folder.cases.push(tc);
            }
          });

          this.folders = [...this.folders]; // Force update reference
          this.buildFolderTree();
          this.updateFilteredTestCases();
          this.cdr.detectChanges(); // Explicitly trigger update mapping
        },
        error: (err) => console.error('Failed to load test cases', err)
      });
    }
  }

  buildFolderTree() {
    const folderMap = new Map<string, any>();
    this.folders.forEach(f => folderMap.set(f.id, { ...f, children: [] }));

    const tree: any[] = [];
    folderMap.forEach(f => {
      if (f.parentId && folderMap.has(f.parentId)) {
        folderMap.get(f.parentId).children.push(f);
      } else {
        tree.push(f);
      }
    });
    this.folderTree = tree;
  }

  get filteredFolderTree() {
    if (!this.folderSearchTerm) return this.folderTree;

    const term = this.folderSearchTerm.toLowerCase();

    const filterNode = (node: any): any => {
      const children = node.children.map(filterNode).filter((c: any) => c !== null);
      if (node.name.toLowerCase().includes(term) || children.length > 0) {
        if (this.folderSearchTerm) {
          this.expandedFolderIds.add(node.id);
        }
        return { ...node, children };
      }
      return null;
    };

    return this.folderTree.map(filterNode).filter(n => n !== null);
  }

  toggleFolderExpand(event: Event, folderId: string) {
    event.stopPropagation();
    if (this.expandedFolderIds.has(folderId)) {
      this.expandedFolderIds.delete(folderId);
    } else {
      this.expandedFolderIds.add(folderId);
    }
  }

  toggleFolderMenu(event: Event, folderId: string) {
    event.stopPropagation();
    const wasOpen = this.activeFolderMenu === folderId;
    this.closeAllMenus();
    this.activeFolderMenu = wasOpen ? null : folderId;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    this.closeAllMenus();
  }

  closeAllMenus() {
    this.isImportOpen = false;
    this.isExportOpen = false;
    this.activeFolderMenu = null;
    this.isAddMenuOpen = false;
    this.isColumnsMenuOpen = false;
    this.isBulkEditMenuOpen = false;
  }

  expandAllFolders() {
    this.folders.forEach(f => this.expandedFolderIds.add(f.id));
  }

  collapseAllFolders() {
    this.expandedFolderIds.clear();
  }

  goToDashboard() {
    this.router.navigate(['/projects']);
  }

  currentFilteredTestCases: TestCase[] = [];

  updateFilteredTestCases() {
    let list: TestCase[] = [];
    if (this.folderSelection === 'all') {
      this.folders.forEach(f => {
        if (f.cases) {
          list.push(...f.cases);
        }
      });
    } else if (this.folderSelection === 'unassigned') {
      list = [];
    } else {
      const f = this.folders.find(x => x.id === this.folderSelection);
      list = f ? f.cases || [] : [];
    }

    if (this.searchTitle) {
      const term = this.searchTitle.toLowerCase();
      list = list.filter(tc => tc.name.toLowerCase().includes(term));
    }
    if (this.filterPriority) {
      list = list.filter(tc => tc.priority === this.filterPriority);
    }
    if (this.filterType) {
      list = list.filter(tc => tc.type === this.filterType);
    }
    
    this.currentFilteredTestCases = list;
  }

  formatId(id: string | number | undefined): string {
    if (!id) return '';
    const num = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(num)) return id.toString();
    return 'TC-' + num.toString().padStart(4, '0');
  }

  getTotalTestCases(): number {
    return this.folders.reduce((acc, f) => acc + (f.cases ? f.cases.length : 0), 0);
  }

  getFolderTestCaseCount(folderId: string): number {
    let count = 0;
    const folder = this.folders.find(x => x.id === folderId);
    if (folder) {
      count += folder.cases ? folder.cases.length : 0;
      const children = this.folders.filter(f => f.parentId === folderId);
      children.forEach(c => {
        count += this.getFolderTestCaseCount(c.id);
      });
    }
    return count;
  }

  getSelectionTitle(): string {
    if (this.folderSelection === 'all') return 'All test cases';
    if (this.folderSelection === 'unassigned') return 'Test cases in no folder';
    const f = this.folders.find(x => x.id === this.folderSelection);
    return f ? f.name : 'Unknown folder';
  }

  selectSpecialFolder(type: string) {
    this.folderSelection = type;
    this.selectedTestCase = null;
    this.selectedCaseIds.clear();
    this.updateFilteredTestCases();
  }

  selectFolder(folder: Folder) {
    this.folderSelection = folder.id;
    this.selectedTestCase = null;
    this.selectedCaseIds.clear();
    this.updateFilteredTestCases();
  }

  getTagsArray(tags: string | undefined): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  selectTestCase(tc: TestCase) {
    this.selectedTestCase = tc;
    this.activeTab = 'Comments';
  }

  closeTestCaseDetail() {
    this.selectedTestCase = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeAllMenus();

      if (this.selectedTestCase) {
        this.closeTestCaseDetail();
      }
    }
  }

  openFolderModal() {
    this.folderToEdit = null;
    this.activeFolderParentId = null;
    this.isFolderModalOpen = true;
  }

  openAddSubfolder(parent: any) {
    this.folderToEdit = null;
    this.activeFolderParentId = parent.id;
    this.isFolderModalOpen = true;
    this.activeFolderMenu = null;
  }

  openRenameFolder(folder: any) {
    this.folderToEdit = folder;
    this.isFolderModalOpen = true;
    this.activeFolderMenu = null;
  }

  deleteFolder(folder: any) {
    if (confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      this.repositoryService.deleteFolder(folder.id);
      if (this.folderSelection === folder.id) {
        this.folderSelection = 'all';
      }
      this.loadData();
    }
    this.activeFolderMenu = null;
  }

  moveFolder(folder: any) {
    console.log('Move placeholder for', folder.name);
    this.activeFolderMenu = null;
  }

  copyFolder(folder: any) {
    console.log('Copy placeholder for', folder.name);
    this.activeFolderMenu = null;
  }

  closeFolderModal() {
    this.isFolderModalOpen = false;
  }

  onFolderSubmit(folderData: any) {
    if (this.folderToEdit) {
      this.repositoryService.updateFolder(this.folderToEdit.id, folderData);
    } else {
      this.repositoryService.addFolder(this.projectId, { ...folderData, parentId: this.activeFolderParentId });
    }
    this.closeFolderModal();
    this.loadData();
  }

  openTestCaseModal() {
    this.testCaseToEdit = null;
    this.isTestCaseModalOpen = true;
  }

  closeTestCaseModal() {
    this.isTestCaseModalOpen = false;
  }

  isSubmittingCase = false;

  onTestCaseSubmit(testCaseData: any) {
    if (this.isSubmittingCase) return;
    this.isSubmittingCase = true;

    let targetFolderId = this.folderSelection;
    if (targetFolderId === 'all' || targetFolderId === 'unassigned') {
      if (this.folders.length > 0) {
        targetFolderId = this.folders[0].id;
      } else {
        const newF = this.repositoryService.addFolder(this.projectId, { name: 'Default Folder' });
        targetFolderId = newF.id;
        this.loadData();
      }
    }

    testCaseData.folderId = targetFolderId;

    if (this.testCaseToEdit) {
      this.repositoryService.updateCaseAPI(this.testCaseToEdit.id!, testCaseData).subscribe({
        next: () => {
          this.isSubmittingCase = false;
          this.closeTestCaseModal();
          this.selectSpecialFolder('all');
          this.loadData();
        },
        error: () => this.isSubmittingCase = false
      });
    } else {
      this.repositoryService.addCaseAPI(testCaseData).subscribe({
        next: () => {
          this.isSubmittingCase = false;
          this.closeTestCaseModal();
          this.selectSpecialFolder('all');
          this.loadData();
        },
        error: () => this.isSubmittingCase = false
      });
    }
  }

  updateTestCaseState(tc: TestCase) {
    // Find the folder this test case belongs to
    // Since UI flatten test cases across folders for 'all', we search through all folders
    let folderId = '';
    for (const f of this.folders) {
      if (f.cases && f.cases.find(c => c.id === tc.id)) {
        folderId = f.id;
        break;
      }
    }

    if (folderId) {
      this.repositoryService.updateCaseAPI(tc.id!, { state: tc.state }).subscribe({
        next: () => console.log(`Updated state for ${tc.id!} to ${tc.state}`),
        error: (err) => console.error('Failed to update state', err)
      });
    }
  }

  getTimeAgo(dateParam: Date | string | undefined): string {
    if (!dateParam) return '-';
    // Handle the case where the system local time might be ahead (e.g if created at the same millisecond)
    const date = new Date(dateParam);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} min ago`;
    return 'Just now';
  }

  toggleCaseSelection(event: Event, caseId: string) {
    event.stopPropagation();
    if (this.selectedCaseIds.has(caseId)) {
      this.selectedCaseIds.delete(caseId);
    } else {
      this.selectedCaseIds.add(caseId);
    }
  }

  get allSelected(): boolean {
    const list = this.currentFilteredTestCases;
    return list.length > 0 && list.every(tc => this.selectedCaseIds.has(tc.id));
  }

  get someSelected(): boolean {
    const list = this.currentFilteredTestCases;
    let selectedCount = 0;
    for (const tc of list) {
      if (this.selectedCaseIds.has(tc.id)) {
        selectedCount++;
      }
    }
    return selectedCount > 0 && selectedCount < list.length;
  }

  toggleAllCases(event: any) {
    if (event.target.checked) {
      this.currentFilteredTestCases.forEach(tc => this.selectedCaseIds.add(tc.id));
    } else {
      this.currentFilteredTestCases.forEach(tc => this.selectedCaseIds.delete(tc.id));
    }
  }

  getSingleSelectedCaseId() {
    return Array.from(this.selectedCaseIds)[0];
  }

  editSelectedCases(event?: Event) {
    if (event) event.stopPropagation();
    if (this.selectedCaseIds.size === 1) {
      this.editSelectedCase(this.getSingleSelectedCaseId());
    } else if (this.selectedCaseIds.size > 1) {
      const wasOpen = this.isBulkEditMenuOpen;
      this.closeAllMenus();
      this.isBulkEditMenuOpen = !wasOpen;
    }
  }

  isBulkEditMenuOpen = false;
  bulkEditState = 'Design';

  applyBulkEdit() {
    const ids = Array.from(this.selectedCaseIds);
    this.repositoryService.bulkUpdateCaseStateAPI(ids, this.bulkEditState).subscribe({
      next: () => {
        this.isBulkEditMenuOpen = false;
        this.selectedCaseIds.clear();
        this.loadData();
      },
      error: (err) => console.error('Failed to bulk update state', err)
    });
  }

  editSelectedCase(id: string) {
    const list = this.currentFilteredTestCases;
    const tc = list.find(c => c.id === id);
    if (!tc) return;
    this.testCaseToEdit = tc;
    this.isTestCaseModalOpen = true;
  }

  deleteSelectedCases() {
    if (confirm(`Are you sure you want to delete ${this.selectedCaseIds.size} case(s)?`)) {
      const ids = Array.from(this.selectedCaseIds);
      let deletionsCompleted = 0;
      ids.forEach(id => {
        this.repositoryService.deleteCaseAPI(id).subscribe({
          next: () => {
            deletionsCompleted++;
            if (deletionsCompleted === ids.length) {
              if (this.selectedTestCase && this.selectedCaseIds.has(this.selectedTestCase.id!)) {
                this.selectedTestCase = null;
              }
              this.selectedCaseIds.clear();
              this.loadData();
            }
          },
          error: (err) => console.error('Failed to delete', err)
        });
      });
    }
  }

  deleteSingleCase(id: string) {
    if (confirm(`Are you sure you want to delete this test case?`)) {
      this.repositoryService.deleteCaseAPI(id).subscribe({
        next: () => {
          if (this.selectedTestCase?.id === id) {
            this.selectedTestCase = null;
          }
          this.selectedCaseIds.delete(id);
          this.loadData();
        },
        error: (err) => console.error('Failed to delete', err)
      });
    }
  }

  // Column Customization Logic
  loadColumnPreferences() {
    const saved = localStorage.getItem('testmo_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        this.visibleColumns = new Set(
          Object.keys(parsed).filter(key => parsed[key])
        );
      } catch (e) {
        this.restoreDefaultColumns();
      }
    } else {
      this.restoreDefaultColumns();
    }
  }

  saveColumnPreferences() {
    const prefs: any = {};
    this.columns.forEach(col => {
      prefs[col.key] = this.visibleColumns.has(col.key);
    });
    localStorage.setItem('testmo_columns', JSON.stringify(prefs));
  }

  restoreDefaultColumns() {
    this.visibleColumns.clear();
    this.columns.forEach(col => {
      if (col.default) {
        this.visibleColumns.add(col.key);
      }
    });
    this.saveColumnPreferences();
  }

  toggleColumnsMenu(event: Event) {
    event.stopPropagation();
    const wasOpen = this.isColumnsMenuOpen;
    this.closeAllMenus();
    this.isColumnsMenuOpen = !wasOpen;
  }

  toggleColumn(key: string) {
    const col = this.columns.find(c => c.key === key);

    if (this.visibleColumns.has(key)) {
      this.visibleColumns.delete(key);
    } else {
      this.visibleColumns.add(key);
    }
    this.saveColumnPreferences();
  }

  isColumnVisible(key: string): boolean {
    return this.visibleColumns.has(key);
  }

  // Split Button Logic
  toggleAddMenu(event: Event) {
    event.stopPropagation();
    const wasOpen = this.isAddMenuOpen;
    this.closeAllMenus();
    this.isAddMenuOpen = !wasOpen;
  }

  openGlobalImportModal() {
    this.isAddMenuOpen = false;
    this.isGlobalImportModalOpen = true;
  }

  closeGlobalImportModal() {
    this.isGlobalImportModalOpen = false;
  }

  onGlobalImportSubmit(file: File) {
    this.repositoryService.importTestCases(file).subscribe({
      next: (res) => {
        this.closeGlobalImportModal();
        this.loadData();
        alert('Test cases imported successfully!');
      },
      error: (err) => {
        console.error('Import failed', err);
        alert('Error importing test cases. Please try again.');
      }
    });
  }

  toggleImport(event: Event) {
    event.stopPropagation();
    const wasOpen = this.isImportOpen;
    this.closeAllMenus();
    this.isImportOpen = !wasOpen;
    if (this.isImportOpen) this.isExportOpen = false;
  }

  onImport(type: string) {
    this.importType = type;
    this.isImportOpen = false;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (this.importType === 'JSON' || file.name.endsWith('.json')) {
      this.importJSON(file);
    } else if (this.importType === 'CSV' || file.name.endsWith('.csv')) {
      this.importCSV(file);
    } else if (this.importType === 'Excel' || file.name.endsWith('.xlsx')) {
      this.importExcel(file);
    }

    event.target.value = '';
  }

  importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          const target = this.folders.length > 0 ? this.folders[0].id : this.repositoryService.addFolder(this.projectId, { name: 'Imports' }).id;
          let added = 0;
          data.forEach(item => {
            this.repositoryService.addCaseAPI({
              folderId: target,
              name: item.name,
              priority: item.priority || 'Normal'
            }).subscribe(() => {
              added++;
              if (added === data.length) this.loadData();
            });
          });
        }
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
  }

  importCSV(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split('\n');
      if (lines.length > 1) {
        const target = this.folders.length > 0 ? this.folders[0].id : this.repositoryService.addFolder(this.projectId, { name: 'Imports' }).id;
        let added = 0;
        let validLines = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          validLines++;
        }
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',');
          if (values.length >= 1) {
            this.repositoryService.addCaseAPI({
              folderId: target,
              name: values[0] ? values[0].trim().replace(/^"|"$/g, '') : 'Unnamed',
              priority: values[1] ? values[1].trim().replace(/^"|"$/g, '') : 'Normal'
            }).subscribe(() => {
              added++;
              if (added === validLines) this.loadData();
            });
          }
        }
      }
    };
    reader.readAsText(file);
  }

  importExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      const target = this.folders.length > 0 ? this.folders[0].id : this.repositoryService.addFolder(this.projectId, { name: 'Imports' }).id;
      let added = 0;
      json.forEach(item => {
        this.repositoryService.addCaseAPI({
          folderId: target,
          name: item.name || item.Name || 'Unnamed',
          priority: item.priority || item.Priority || 'Normal'
        }).subscribe(() => {
          added++;
          if (added === json.length) this.loadData();
        });
      });
    };
    reader.readAsArrayBuffer(file);
  }
}