import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ProjectDashboard } from './components/project-dashboard/project-dashboard';
import { RepositoryComponent } from './components/repository/repository';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'projects', component: ProjectDashboard },
  { path: 'projects/:id', component: RepositoryComponent },
  { 
    path: 'projects/:id/repository', 
    redirectTo: 'projects/:id', 
    pathMatch: 'full' 
  },
  { path: '**', redirectTo: 'projects' }
];
