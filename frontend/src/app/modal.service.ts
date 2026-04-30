import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalState {
  isOpen: boolean;
  message: string;
  isError: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private state = new BehaviorSubject<ModalState>({ isOpen: false, message: '', isError: false });
  state$ = this.state.asObservable();

  show(message: string, isError: boolean = false) {
    this.state.next({ isOpen: true, message, isError });
  }

  close() {
    this.state.next({ isOpen: false, message: '', isError: false });
  }
}
