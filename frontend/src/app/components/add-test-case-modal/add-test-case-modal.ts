import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Folder } from '../../services/repository.service';

@Component({
  selector: 'app-add-test-case-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-test-case-modal.html',
  styleUrl: './add-test-case-modal.css',
})
export class AddTestCaseModalComponent implements OnInit {
  @Input() folders: Folder[] = [];
  @Input() editData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() submitTestCase = new EventEmitter<any>();

  testCaseForm: FormGroup;
  steps: any[] = [{ description: '', expectedResult: '' }, { description: '', expectedResult: '' }];

  constructor(private fb: FormBuilder) {
    this.testCaseForm = this.fb.group({
      title: ['', Validators.required],
      owner: [''],
      priority: ['Medium'],
      type: ['Functional'],
      state: ['Design'],
      isAutomated: [false],
      automationScript: [''],
      precondition: [''],
      tags: [''],
      folderId: ['']
    });
  }

  ngOnInit() {
    if (this.editData) {
      if (this.editData.name) {
        this.editData.title = this.editData.name;
      }
      this.testCaseForm.patchValue(this.editData);
      if (this.editData.steps && this.editData.steps.length > 0) {
        this.steps = [...this.editData.steps];
      }
    }
  }

  addStep() {
    this.steps.push({ description: '', expectedResult: '' });
  }

  removeStep(index: number) {
    this.steps.splice(index, 1);
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.testCaseForm.valid) {
      const payload = {
        ...this.testCaseForm.value,
        name: this.testCaseForm.value.title,
        steps: this.steps.filter(s => s.description?.trim() || s.expectedResult?.trim())
      };
      this.submitTestCase.emit(payload);
    } else {
      Object.keys(this.testCaseForm.controls).forEach(key => {
        this.testCaseForm.get(key)?.markAsTouched();
      });
    }
  }
}
