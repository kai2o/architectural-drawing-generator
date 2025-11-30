import { Component, signal, inject, OnInit, effect, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  sidebarCollapsed = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<any>(null);

  constructor() {
    // Update auth state when it changes (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.isAuthenticated.set(this.authService.isAuthenticated());
        this.currentUser.set(this.authService.getCurrentUser());
      });
    }
  }

  ngOnInit(): void {
    // Only check authentication in browser
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticated.set(this.authService.isAuthenticated());
      this.currentUser.set(this.authService.getCurrentUser());
    }
  }

  ngAfterViewInit(): void {
    // Update auth state after view init (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticated.set(this.authService.isAuthenticated());
      this.currentUser.set(this.authService.getCurrentUser());
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  isAuthPage(): boolean {
    return this.router.url === '/auth' || this.router.url.startsWith('/auth');
  }
}
