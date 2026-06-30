import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config';
import { StoreDto, ProductDto } from './catalog.service';
import { OrderDto } from './payment.service';

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface StoreSales {
  storeId: string;
  storeName: string;
  revenue: number;
  orderCount: number;
}

export interface AuditLogDto {
  id: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardData {
  salesSummary: SalesSummary;
  storeSales: StoreSales[];
  recentOrders: OrderDto[];
  recentLogs: AuditLogDto[];
}

export interface Coupon {
  id?: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minCartValue: number;
  active: boolean;
  expiryDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/admin';

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }

  createStore(store: StoreDto): Observable<StoreDto> {
    return this.http.post<StoreDto>(`${this.apiUrl}/stores`, store);
  }

  createProduct(product: ProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: ProductDto): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.apiUrl}/coupons`);
  }

  createCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.apiUrl}/coupons`, coupon);
  }

  updateCoupon(id: string, coupon: Coupon): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.apiUrl}/coupons/${id}`, coupon);
  }

  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/coupons/${id}`);
  }
}
