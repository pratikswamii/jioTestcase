import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-project-modal.html',
  styleUrl: './add-project-modal.css',
})
export class AddProjectModal {
  @Output() close = new EventEmitter<void>();

  projectForm: FormGroup;
  activeTab = 'PROJECT';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      summary: ['']
    });
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      const newProject = this.projectService.addProject(formValue);
      this.close.emit();
      this.router.navigate(['/projects', newProject.id]);
    } else {
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
}

