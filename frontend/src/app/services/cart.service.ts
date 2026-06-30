import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../config';

export interface CartItemDto {
  productId: string;
  barcode: string;
  name: string;
  imageUrl: string;
  price: number;
  gstPercentage: number;
  quantity: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface ShoppingCart {
  storeId: string;
  userId: string;
  items: CartItemDto[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedCouponCode: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/cart';
  
  private cartSubject = new BehaviorSubject<ShoppingCart | null>(null);
  cart$ = this.cartSubject.asObservable();

  fetchCart(): Observable<ShoppingCart> {
    return this.http.get<ShoppingCart>(this.apiUrl).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(storeId: string, barcode: string, quantity: number = 1): Observable<ShoppingCart> {
    const params = new HttpParams()
      .set('storeId', storeId)
      .set('barcode', barcode)
      .set('quantity', quantity.toString());
    
    return this.http.post<ShoppingCart>(`${this.apiUrl}/add`, null, { params }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  updateQuantity(productId: string, quantity: number): Observable<ShoppingCart> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity.toString());

    return this.http.put<ShoppingCart>(`${this.apiUrl}/update`, null, { params }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeItem(productId: string): Observable<ShoppingCart> {
    return this.http.delete<ShoppingCart>(`${this.apiUrl}/remove/${productId}`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  applyCoupon(code: string): Observable<ShoppingCart> {
    const params = new HttpParams().set('code', code);
    return this.http.post<ShoppingCart>(`${this.apiUrl}/coupon`, null, { params }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeCoupon(): Observable<ShoppingCart> {
    return this.http.delete<ShoppingCart>(`${this.apiUrl}/coupon`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear`).pipe(
      tap(() => this.cartSubject.next(null))
    );
  }

  getActiveStoreId(): string | null {
    const cart = this.cartSubject.value;
    return cart ? cart.storeId : null;
  }
}
