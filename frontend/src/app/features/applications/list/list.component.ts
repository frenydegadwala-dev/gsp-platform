import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list.component.html',
})
export class ListComponent implements OnInit {
  applications: any[] = [];
  loading = true;
  error = '';
  showCreate = false;

  newApp = {
    studentInfo: { firstName: '', lastName: '', email: '', nationality: '' },
    course: '',
    university: '',
    intakeYear: new Date().getFullYear(),
    intakeMonth: 'September',
  };
  creating = false;
  createError = '';

  months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getApplications().subscribe({
      next: (apps) => { this.applications = apps; this.loading = false; },
      error: () => { this.error = 'Failed to load applications'; this.loading = false; },
    });
  }

  open(id: string) {
    this.router.navigate(['/applications', id]);
  }

  logout() {
    this.auth.logout();
  }

  canCreate() {
    return ['agent', 'counsellor'].includes(this.auth.currentUser?.role ?? '');
  }

  submitCreate() {
    this.creating = true;
    this.createError = '';
    this.api.createApplication(this.newApp).subscribe({
      next: (app) => {
        this.creating = false;
        this.showCreate = false;
        this.router.navigate(['/applications', app._id]);
      },
      error: (err) => {
        const body = err.error;
        if (body?.errors?.length) {
          // express-validator array: [{msg, path}]
          this.createError = body.errors.map((e: any) => e.msg).join(' · ');
        } else {
          this.createError = body?.error || err.message || 'Unexpected error — check backend is running';
        }
        this.creating = false;
      },
    });
  }

  stageLabel(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  stageBadgeClass(stage: string): string {
    const map: Record<string, string> = {
      new_app: 'badge-blue',
      qa_review: 'badge-yellow',
      app_review: 'badge-yellow',
      decision: 'badge-purple',
      deposit: 'badge-teal',
      cas_review: 'badge-teal',
      enrolment: 'badge-green',
      app_rejected: 'badge-red',
      closed_lost: 'badge-gray',
      offer_exists: 'badge-purple',
    };
    return map[stage] ?? 'badge-gray';
  }
}
