import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getApplications() {
    return this.http.get<any[]>(`${this.base}/applications`, { headers: this.headers() });
  }

  getApplication(id: string) {
    return this.http.get<any>(`${this.base}/applications/${id}`, { headers: this.headers() });
  }

  createApplication(payload: any) {
    return this.http.post<any>(`${this.base}/applications`, payload, { headers: this.headers() });
  }

  transition(id: string, toStage: string, note: string = '') {
    return this.http.post<any>(
      `${this.base}/applications/${id}/transition`,
      { toStage, note },
      { headers: this.headers() }
    );
  }

  addNote(id: string, content: string, isInternal = true) {
    return this.http.post<any>(
      `${this.base}/applications/${id}/actions/add_note`,
      { content, isInternal },
      { headers: this.headers() }
    );
  }

  addAttachment(id: string, type: string, file: File) {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file, file.name);
    return this.http.post<any>(
      `${this.base}/applications/${id}/actions/add_attachment`,
      fd,
      { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }) }
    );
  }

  setReviewNote(id: string, note: string) {
    return this.http.post<any>(
      `${this.base}/applications/${id}/actions/set_review_note`,
      { note },
      { headers: this.headers() }
    );
  }

  getAiReview(id: string) {
    return this.http.get<any>(`${this.base}/applications/${id}/ai-review`, { headers: this.headers() });
  }

  performAction(id: string, action: string, payload: any = {}) {
    return this.http.post<any>(
      `${this.base}/applications/${id}/actions/${action}`,
      payload,
      { headers: this.headers() }
    );
  }
}
