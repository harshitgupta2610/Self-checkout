import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderItemDto } from './payment.service';

export interface VerificationResponse {
  valid: boolean;
  orderNumber?: string;
  customerName?: string;
  storeName?: string;
  finalAmount?: number;
  status?: string;
  paymentTimestamp?: string;
  items?: OrderItemDto[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/guard';

  verifyReceipt(token: string, storeId?: string | null): Observable<VerificationResponse> {
    let params = new HttpParams().set('token', token);
    if (storeId) {
      params = params.set('storeId', storeId);
    }
    return this.http.post<VerificationResponse>(`${this.apiUrl}/verify`, null, { params });
  }
}
