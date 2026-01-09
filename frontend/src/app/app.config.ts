import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {jwtInterceptor} from './api/auth/jwt.interceptor';
import {BASE_PATH} from './api';
import {environment} from './api/auth/environment';
import {AppAuthService} from './api/auth/app-auth.service';
import {UserService} from './services/user.service';
import {catchError, of} from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    {provide: BASE_PATH, useValue: environment.apiBaseUrl},
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AppAuthService, userService: UserService) => () => {
        const token = authService.getAccessToken();
        if (token) {
          return userService.loadCurrentUser().pipe(
            catchError(() => {
              authService.logout();
              return of(null);
            })
          );
        }
        return of(null);
      },
      deps: [AppAuthService, UserService],
      multi: true
    }
  ]
};
