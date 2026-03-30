import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TestCase {
  id: string;
  name: string;
  priority: string;
  owner?: string;
  state?: string;
  type?: string;
  configurations?: string;
  automationType?: string;
  isAutomated?: boolean;
  automationScript?: string;
  precondition?: string;
  tags?: string;
  steps?: { description?: string, expectedResult?: string }[];
  folderId?: string;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface Folder {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  cases: TestCase[];
  createdAt: Date;
  parentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private folders: Folder[] = [];

  private nextFolderId = 1;
  private nextTestCaseId = 1;

  constructor(private http: HttpClient) {
    this.loadFolders();
  }

  private loadFolders() {
    const saved = localStorage.getItem('testmo_folders');
    if (saved) {
      try {
        this.folders = JSON.parse(saved);
        let maxId = 0;
        this.folders.forEach(f => {
          if (f.id.startsWith('F-')) {
            const num = parseInt(f.id.substring(2));
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
        this.nextFolderId = maxId + 1;
      } catch (e) {
        this.folders = [];
      }
    }
  }

  private saveFolders() {
    const foldersToSave = this.folders.map(f => ({ ...f, cases: [] }));
    localStorage.setItem('testmo_folders', JSON.stringify(foldersToSave));
  }

  // ✅ Get all folders of project
  getFolders(projectId: string): Folder[] {
    return this.folders.filter(f => f.projectId === projectId);
  }

  // ✅ Add folder
  addFolder(projectId: string, data: Partial<Folder>): Folder {
    const newFolder: Folder = {
      id: 'F-' + this.nextFolderId++,
      projectId,
      name: data.name || 'Untitled Folder',
      description: data.description || '',
      cases: [],
      createdAt: new Date(),
      parentId: data.parentId
    };

    this.folders.push(newFolder);
    this.saveFolders();
    return newFolder;
  }

  // --- MONGODB API LOGIC FOR TEST CASES ---
  private apiUrl = 'http://localhost:8081/api/testcases';

  getAllCases(): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(this.apiUrl);
  }

  addCaseAPI(caseData: Partial<TestCase>): Observable<TestCase> {
    return this.http.post<TestCase>(this.apiUrl, caseData);
  }

  updateCaseAPI(caseId: string, data: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.apiUrl}/${caseId}`, data);
  }

  bulkUpdateCaseStateAPI(ids: string[] | number[], state: string): Observable<TestCase[]> {
    return this.http.put<TestCase[]>(`${this.apiUrl}/bulk-update-state`, { ids, state });
  }

  deleteCaseAPI(caseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${caseId}`);
  }

  // The below in-memory functions for TestCases are NO LONGER USED by the UI.
  // We keep the old Folder logic since it relies on in-memory storage for now.

  // ✅ Add test case (DEPRECATED)
  addCase(folderId: string, caseData: Partial<TestCase>): TestCase | null {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return null;

    const newTestCase: TestCase = {
      id: 'TC-' + this.nextTestCaseId++,
      name: caseData.name || 'Untitled Test Case',
      priority: caseData.priority || 'Normal',
      owner: caseData.owner || 'Unassigned',
      state: caseData.state || 'Not Run',
      type: caseData.type || 'Functional',
      configurations: caseData.configurations || '',
      automationType: caseData.automationType || 'None',
      automationScript: caseData.automationScript || '',
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    folder.cases.push(newTestCase);
    return newTestCase;
  }

  // ✅ Delete selected cases
  deleteCases(folderId: string, caseIds: Set<string> | string[]): boolean {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return false;

    const idsToDelete = new Set(caseIds);
    folder.cases = folder.cases.filter(tc => !idsToDelete.has(tc.id));

    return true;
  }

  // ✅ Get cases of a folder
  getCases(folderId: string): TestCase[] {
    const folder = this.folders.find(f => f.id === folderId);
    return folder ? folder.cases : [];
  }

  deleteFolder(folderId: string): void {
    this.folders = this.folders.filter(f => f.id !== folderId);
    this.saveFolders();
  }

  updateFolder(folderId: string, data: Partial<Folder>): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      Object.assign(folder, data);
      this.saveFolders();
    }
  }

  updateCase(folderId: string, caseId: string, data: Partial<TestCase>): void {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) return;
    const testCase = folder.cases.find(tc => tc.id === caseId);
    if (testCase) {
      Object.assign(testCase, data);
      testCase.modifiedAt = new Date();
    }
  }

  //  NEW: Get single folder (VERY IMPORTANT for UI sync)
  getFolderById(folderId: string): Folder | undefined {
    return this.folders.find(f => f.id === folderId);
  }

  //  Import test cases via API
  importTestCases(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('/api/testcases/import', formData);
  }
}
