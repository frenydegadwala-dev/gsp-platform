import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { ActionAvailablePipe } from '../../../shared/action-available.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionAvailablePipe],
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  fileBaseUrl = environment.fileBaseUrl;

  app: any = null;
  loading = true;
  error = '';

  // Transition
  selectedStage = '';
  transitionNote = '';
  transitioning = false;
  transitionError = '';
  transitionSuccess = '';

  // Note
  noteContent = '';
  noteInternal = true;
  addingNote = false;

  // Attachment
  docType = 'passport';
  docFile: File | null = null;
  addingDoc = false;
  docError = '';

  // Review note (admission officer)
  reviewNoteText = '';
  savingReviewNote = false;

  // AI review
  aiLoading = false;
  aiResult: any = null;
  aiError = '';

  // Contextual actions panel
  activeAction = '';
  taskTitle = '';
  taskDueDate = '';
  newCourse = '';
  newUniversity = '';
  actionNote = '';
  actionLoading = false;
  actionError = '';
  actionSuccess = '';

  docTypes = ['passport', 'transcript', 'english_test', 'personal_statement', 'reference', 'other'];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  get id(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  load() {
    this.loading = true;
    this.api.getApplication(this.id).subscribe({
      next: (app) => {
        this.app = app;
        this.reviewNoteText = app.reviewNote ?? '';
        this.loading = false;
        if (app.aiAssessments?.length) {
          this.aiResult = app.aiAssessments[app.aiAssessments.length - 1];
        }
      },
      error: () => { this.error = 'Failed to load application'; this.loading = false; },
    });
  }

  doTransition() {
    if (!this.selectedStage) return;
    this.transitioning = true;
    this.transitionError = '';
    this.transitionSuccess = '';
    this.api.transition(this.id, this.selectedStage, this.transitionNote).subscribe({
      next: (res) => {
        this.transitioning = false;
        this.transitionSuccess = res.message;
        this.selectedStage = '';
        this.transitionNote = '';
        this.load();
      },
      error: (err) => {
        const body = err.error;
        this.transitionError = body?.error || body?.errors?.map((e: any) => e.msg).join(' · ') || err.message || 'Transition failed';
        this.transitioning = false;
      },
    });
  }

  addNote() {
    if (!this.noteContent.trim()) return;
    this.addingNote = true;
    this.api.addNote(this.id, this.noteContent, this.noteInternal).subscribe({
      next: () => { this.noteContent = ''; this.addingNote = false; this.load(); },
      error: () => { this.addingNote = false; },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.docFile = input.files?.[0] ?? null;
    this.docError = '';
  }

  addDoc() {
    this.docError = '';
    if (!this.docFile) { this.docError = 'Please select a file.'; return; }
    this.addingDoc = true;
    this.api.addAttachment(this.id, this.docType, this.docFile).subscribe({
      next: () => {
        this.docFile = null;
        if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
        this.addingDoc = false;
        this.load();
      },
      error: (err) => { this.docError = err.error?.error || 'Failed to attach document.'; this.addingDoc = false; },
    });
  }

  saveReviewNote() {
    this.savingReviewNote = true;
    this.api.setReviewNote(this.id, this.reviewNoteText).subscribe({
      next: () => { this.savingReviewNote = false; this.load(); },
      error: () => { this.savingReviewNote = false; },
    });
  }

  runAiReview() {
    this.aiLoading = true;
    this.aiError = '';
    this.api.getAiReview(this.id).subscribe({
      next: (result) => { this.aiResult = result; this.aiLoading = false; },
      error: (err) => { this.aiError = err.error?.error || 'AI review failed'; this.aiLoading = false; },
    });
  }

  // ── Contextual actions ───────────────────────────────────────────────────────

  openAction(key: string) {
    if (this.activeAction === key) {
      this.activeAction = '';
      return;
    }
    this.activeAction = key;
    this.taskTitle = '';
    this.taskDueDate = '';
    this.newCourse = this.app?.course ?? '';
    this.newUniversity = this.app?.university ?? '';
    this.actionNote = '';
    this.actionError = '';
    this.actionSuccess = '';
  }

  submitActiveAction() {
    this.actionError = '';
    let payload: any = {};

    switch (this.activeAction) {
      case 'add_task':
        if (!this.taskTitle.trim()) { this.actionError = 'Task title is required.'; return; }
        payload = { title: this.taskTitle, dueDate: this.taskDueDate || undefined };
        break;
      case 'change_course':
        if (!this.newCourse.trim() && !this.newUniversity.trim()) {
          this.actionError = 'Enter a new course or university.'; return;
        }
        payload = { course: this.newCourse, university: this.newUniversity };
        break;
      case 'defer':
      case 'withdraw':
      case 'cancel':
      case 'refund':
      case 'drop_out':
        payload = { reason: this.actionNote };
        break;
      default:
        return;
    }

    this.actionLoading = true;
    this.api.performAction(this.id, this.activeAction, payload).subscribe({
      next: (res) => {
        this.actionSuccess = res.message || 'Done';
        this.actionLoading = false;
        this.activeAction = '';
        this.load();
      },
      error: (err) => {
        this.actionError = err.error?.error || 'Action failed.';
        this.actionLoading = false;
      },
    });
  }

  actionButtonLabel(): string {
    const labels: Record<string, string> = {
      add_task: 'Add Task',
      defer: 'Confirm Defer',
      change_course: 'Update Course',
      withdraw: 'Confirm Withdraw',
      cancel: 'Confirm Cancel',
      refund: 'Confirm Refund',
      drop_out: 'Confirm Drop Out',
    };
    return labels[this.activeAction] ?? 'Confirm';
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  stageLabel(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  stageBadgeClass(stage: string): string {
    const map: Record<string, string> = {
      new_app: 'badge-blue', qa_review: 'badge-yellow', app_review: 'badge-yellow',
      decision: 'badge-purple', deposit: 'badge-teal', cas_review: 'badge-teal',
      enrolment: 'badge-green', app_rejected: 'badge-red', closed_lost: 'badge-gray',
      offer_exists: 'badge-purple',
    };
    return map[stage] ?? 'badge-gray';
  }

  showAiPanel(): boolean {
    return ['qa_review', 'app_review'].includes(this.app?.currentStage) &&
      this.auth.currentUser?.role !== 'agent';
  }

  isAdmissionOfficer(): boolean {
    return this.auth.currentUser?.role === 'admission_officer';
  }

  goBack() {
    this.router.navigate(['/applications']);
  }
}
