import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentInitResponse {
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  redirectUrl?: string;
}

export interface PaymentVerifyRequest {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface OrderItemDto {
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface OrderDto {
  orderId: string;
  orderNumber: string;
  storeName: string;
  storeAddress: string;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  receiptQrToken: string;
  createdAt: string;
  items: OrderItemDto[];
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/orders';

  checkout(couponCode?: string | null): Observable<PaymentInitResponse> {
    return this.http.post<PaymentInitResponse>(`${this.apiUrl}/checkout`, { couponCode });
  }

  verifyPayment(verifyRequest: PaymentVerifyRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.apiUrl}/verify`, verifyRequest);
  }

  verifyPhonePeStatus(orderNumber: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/verify-status/${orderNumber}`);
  }

  getMyOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}/my-orders`);
  }

  getOrderDetails(orderId: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/${orderId}`);
  }

  getOrderDetailsByNumber(orderNumber: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/by-number/${orderNumber}`);
  }

  payWithRazorpay(
    initRes: PaymentInitResponse,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ): void {
    const Razorpay = (window as any).Razorpay;
    
    if (!Razorpay) {
      onFailure({ message: 'Razorpay SDK failed to load. Please verify internet connectivity.' });
      return;
    }

    // Razorpay checkout visual settings
    const options = {
      key: initRes.keyId,
      amount: Math.round(initRes.amount * 100), // convert rupees to paise
      currency: initRes.currency,
      name: 'Smart Self-Checkout',
      description: `Payment for Order #${initRes.orderNumber}`,
      order_id: initRes.razorpayOrderId,
      handler: (response: any) => {
        onSuccess({
          orderNumber: initRes.orderNumber,
          razorpayOrderId: initRes.razorpayOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      prefill: {
        name: localStorage.getItem('user_name') || '',
        email: localStorage.getItem('user_email') || ''
      },
      theme: {
        color: '#6366f1' // Indigo
      },
      modal: {
        ondismiss: () => {
          onFailure({ message: 'Payment cancelled by user.' });
        }
      }
    };

    // Check if mock mode keys are active
    if (initRes.keyId.includes("mock")) {
      console.warn("Using Mock Razorpay Checkout flow due to developer key settings.");
      // Instantly succeed mock checkout for local simulation
      setTimeout(() => {
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 12);
        const mockSignature = 'sig_mock_' + Math.random().toString(36).substring(2, 12);
        onSuccess({
          orderNumber: initRes.orderNumber,
          razorpayOrderId: initRes.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature
        });
      }, 800);
      return;
    }

    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      onFailure({ message: 'Error opening Razorpay payment window.' });
    }
  }
}
