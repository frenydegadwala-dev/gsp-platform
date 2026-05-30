import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  // Quick-switch accounts for demo purposes
  demoUsers = [
    { label: 'Counsellor', email: 'counsellor@gsp.com' },
    { label: 'QA Officer', email: 'qa@gsp.com' },
    { label: 'Admissions Officer', email: 'admissions@gsp.com' },
    { label: 'Visa Officer', email: 'visa@gsp.com' },
    { label: 'Enrolment Officer', email: 'enrolment@gsp.com' },
    { label: 'Agent', email: 'agent@gsp.com' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  fillDemo(email: string) {
    this.email = email;
    this.password = 'password123';
  }

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/applications']),
      error: (err) => {
        this.error = err.error?.error || 'Login failed';
        this.loading = false;
      },
    });
  }
}
