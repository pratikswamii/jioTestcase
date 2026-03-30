import { Component, OnInit, inject } from '@angular/core';
import { Api } from '../../services/api';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private apiService = inject(Api);

  ngOnInit() {
    this.apiService.getTestMessage().subscribe({
      next: (response) => {
        console.log(response); // "Backend working!"
      },
      error: (error) => {
        console.error('Error calling backend:', error);
      }
    });
  }
}
