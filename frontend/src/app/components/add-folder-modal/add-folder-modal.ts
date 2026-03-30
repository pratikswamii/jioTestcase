import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-folder-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-folder-modal.html',
  styleUrl: './add-folder-modal.css',
})
export class AddFolderModalComponent implements OnInit {
  @Input() editData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() submitFolder = new EventEmitter<any>();

  folderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.folderForm = this.fb.group({
      name: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    if (this.editData) {
      this.folderForm.patchValue(this.editData);
    }
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.folderForm.valid) {
      this.submitFolder.emit(this.folderForm.value);
    } else {
      Object.keys(this.folderForm.controls).forEach(key => {
        this.folderForm.get(key)?.markAsTouched();
      });
    }
  }
}
