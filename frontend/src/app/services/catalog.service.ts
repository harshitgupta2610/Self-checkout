import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config';

export interface StoreDto {
  id: string;
  name: string;
  address: string;
  qrIdentifier: string;
}

export interface ProductDto {
  id: string;
  barcode: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  gstPercentage: number;
  stockQuantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStoreSession(qrIdentifier: string): Observable<StoreDto> {
    return this.http.get<StoreDto>(`${this.apiUrl}/stores/session/${qrIdentifier}`);
  }

  getStores(): Observable<StoreDto[]> {
    return this.http.get<StoreDto[]>(`${this.apiUrl}/stores`);
  }

  getProductByBarcode(barcode: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.apiUrl}/products/barcode/${barcode}`);
  }

  getProducts(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products`);
  }
}
