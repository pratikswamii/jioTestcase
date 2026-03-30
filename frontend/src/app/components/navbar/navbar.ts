import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AddProjectModal } from '../add-project-modal/add-project-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AddProjectModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  isProjectModalOpen = false;

  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['/projects']);
  }

  openProjectModal() {
    this.isProjectModalOpen = true;
  }

  closeProjectModal() {
    this.isProjectModalOpen = false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
