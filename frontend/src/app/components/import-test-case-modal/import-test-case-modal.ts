import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-test-case-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-test-case-modal.html',
  styleUrl: './import-test-case-modal.css',
})
export class ImportTestCaseModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitImport = new EventEmitter<File>();

  selectedFile: File | null = null;
  isDragging = false;

  onClose() {
    this.close.emit();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (this.isValidFile(file)) {
        this.selectedFile = file;
      } else {
        alert('Invalid file type. Please upload a .csv or .xlsx file.');
      }
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && this.isValidFile(file)) {
      this.selectedFile = file;
    }
  }

  isValidFile(file: File): boolean {
    return file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
  }

  onSubmit() {
    if (this.selectedFile) {
      this.submitImport.emit(this.selectedFile);
    }
  }
}
