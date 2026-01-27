import {inject, Injectable, signal} from '@angular/core';
import {map, Observable, tap} from 'rxjs';
import {UserDetailDto} from '../api';
import {UserService as ApiUserService} from '../api/';
import {toObservable} from '@angular/core/rxjs-interop';

@Injectable({providedIn: 'root'})
export class UserService {
  private readonly apiUserService = inject(ApiUserService);
  private readonly currentUserSignal = signal<UserDetailDto | null>(null);

  readonly currentUser$ = toObservable(this.currentUserSignal);

  getCurrentUser(): UserDetailDto | null {
    return this.currentUserSignal();
  }

  loadCurrentUser(): Observable<UserDetailDto> {
    return this.apiUserService.apiUsersMeGet().pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No user data in response');
        }
        return response.data;
      }),
      tap(user => this.currentUserSignal.set(user))
    )
  }

  clearCurrentUser(): void {
    this.currentUserSignal.set(null);
  }
}
