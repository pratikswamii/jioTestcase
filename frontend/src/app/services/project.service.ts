import { Injectable } from '@angular/core';

export interface Project {
  id: string;
  name: string;
  summary: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projects: Project[] = [];
  
  // Simulated incremental ID
  private nextId = 1;

  constructor() {
    // Add a dummy project so there is something to see initially, optional.
    // Let's start with an empty array or maybe one dummy project to illustrate.
    this.projects = [
      {
        id: 'P-' + this.nextId++,
        name: 'Demo Project',
        summary: 'This is a sample project to demonstrate listing.',
        createdAt: new Date()
      }
    ];
  }

  getProjects(): Project[] {
    return this.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  addProject(projectData: Partial<Project>): Project {
    const newProject: Project = {
      id: 'P-' + this.nextId++,
      name: projectData.name || 'Untitled Project',
      summary: projectData.summary || '',
      createdAt: new Date()
    };
    
    this.projects.push(newProject);
    return newProject;
  }
}
