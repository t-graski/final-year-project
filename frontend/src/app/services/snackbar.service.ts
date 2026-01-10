import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SnackbarMessage {
  message: string;
  statusCode: number;
  errorCode?: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private messagesSubject = new BehaviorSubject<SnackbarMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private messageId = 0;

  show(message: string, statusCode: number = 200, errorCode?: string): void {
    const id = this.messageId++;
    const snackbar: SnackbarMessage = { message, statusCode, errorCode, id };

    const current = this.messagesSubject.value;
    this.messagesSubject.next([...current, snackbar]);

    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  showFromApiResponse(response: any): void {
    const statusCode = response?.statusCode ?? 200;
    const message = response?.errors?.join(', ') || response?.message || 'Operation completed';
    const errorCode = response?.errorCode || (statusCode >= 400 ? `ERROR_${statusCode}` : undefined);
    this.show(message, statusCode, errorCode);
  }

  remove(id: number): void {
    const current = this.messagesSubject.value;
    this.messagesSubject.next(current.filter(m => m.id !== id));
  }
}
