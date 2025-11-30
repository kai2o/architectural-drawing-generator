import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';

  // Form data
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  role = 'HouseOwner';

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.email = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  private login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect to return URL or dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  private register(): void {
    if (!this.email || !this.password || !this.firstName || !this.lastName) {
      this.errorMessage = 'Please fill in all required fields';
      this.isLoading = false;
      return;
    }

    this.authService.register({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role
    }).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect to return URL or dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.errors) {
          this.errorMessage = Array.isArray(error.error.errors) 
            ? error.error.errors.join(', ')
            : 'Registration failed. Please check your information.';
        } else {
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
