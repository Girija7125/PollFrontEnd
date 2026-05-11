import { Component } from '@angular/core';
import { PollService } from '../poll-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class Auth {
  activeTab: 'login' | 'register' = 'login';
  registerError = '';
  registerSuccess = '';
  registerLoading = false;
  loginLoading = false;
  loginError = '';
  showPassword = false;
  generatedToken = '';

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  constructor(public pollService: PollService, private router: Router) {}

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.registerError = 'Passwords do not match.';
      return;
    }
    this.registerLoading = true;
    const { name, email } = this.registerForm.value;
    this.pollService.createUser(name!, email!, password!).subscribe({
      next: () => {
        this.registerSuccess = 'Account created successfully.';
        this.registerLoading = false;
        this.registerForm.reset();
        setTimeout(() => { this.activeTab = 'login'; this.registerSuccess = ''; }, 1500);
      },
      error: (err) => {
        this.registerError = err.error?.message || 'Registration failed!';
        this.registerLoading = false;
      }
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginLoading = true;
    const { email, password } = this.loginForm.value;
    this.pollService.login(email!, password!).subscribe({
      next: (res: any) => {
        this.pollService.setLoggedIn(res.token, res.user);
        this.loginLoading = false;
        this.router.navigate(['/vote']);
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Wrong email or password!';
        this.loginLoading = false;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = '';
    this.generatedToken = '';
  }
}
