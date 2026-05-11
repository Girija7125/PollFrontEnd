import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private baseUrl = 'http://localhost:3000/api';

  private loggedIn = new BehaviorSubject<boolean>(!!sessionStorage.getItem('token'));
  private userSubject = new BehaviorSubject<any>(this.getUser());

  isLoggedIn$ = this.loggedIn.asObservable();
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  private get authHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`,
      }),
    };
  }

  createUser(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/user`, { name, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password });
  }

  setLoggedIn(token: string, user: any): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    this.loggedIn.next(true);
    this.userSubject.next(user);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.loggedIn.next(false);
    this.userSubject.next(null);
  }

  getUser(): any {
    const u = sessionStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  createPoll(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/poll`, data, this.authHeaders);
  }

  getPolls(search: string = ''): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/polls?search=${search}`);
  }

  deletePoll(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/polls/${id}`, this.authHeaders);
  }
  getPollById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/polls/${id}`);
  }

  vote(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vote`, data, this.authHeaders);
  }

  updatePoll(id: string, payload: any) {
    return this.http.put(`${this.baseUrl}/polls/${id}`, payload);
  }

  getResults(pollId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/results/${pollId}`);
  }
}
