import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {UserDetailDto} from '../api/model/userDetailDto';
import {UserService as ApiUserService} from '../api/';

@Injectable({providedIn: 'root'})
export class UserService {
  private readonly apiUserService = inject(ApiUserService);
  private readonly currentUserSub = new BehaviorSubject<UserDetailDto | null>(null);

  readonly currentUser$: Observable<UserDetailDto | null> = this.currentUserSub.asObservable();

  getCurrentUser(): UserDetailDto | null {
    return this.currentUserSub.value;
  }

  loadCurrentUser(): Observable<UserDetailDto> {
    return this.apiUserService.apiUsersMeGet().pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No user data in response');
        }
        return response.data;
      }),
      tap(user => this.currentUserSub.next(user))
    )
  }

  clearCurrentUser(): void {
    this.currentUserSub.next(null);
  }
}
