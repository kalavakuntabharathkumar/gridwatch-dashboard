import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <h1 class="text-xl font-bold text-gray-900">GridWatch</h1>
          </div>
          <nav class="hidden md:flex items-center gap-6">
            <a
              routerLink="/dashboard"
              routerLinkActive="text-blue-600 border-blue-600"
              class="px-3 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="https://www.eia.gov/opendata/" target="_blank" rel="noopener"
              class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              EIA API Docs
            </a>
          </nav>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent {}