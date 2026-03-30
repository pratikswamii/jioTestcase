import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-dashboard.html',
  styleUrl: './project-dashboard.css',
})
export class ProjectDashboard implements OnInit {
  constructor(
    private router: Router
  ) {}

  ngOnInit() {
  }

  goToProject(id: string) {
    this.router.navigate(['/projects', id]);
  }
}
