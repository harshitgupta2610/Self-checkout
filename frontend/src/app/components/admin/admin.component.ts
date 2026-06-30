import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, DashboardData, Coupon } from '../../services/admin.service';
import { CatalogService, StoreDto, ProductDto } from '../../services/catalog.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container admin-shell">
      <h2 class="neon-text-primary"><mat-icon>dashboard</mat-icon> Administrator Console</h2>

      <mat-tab-group class="admin-tabs" (selectedTabChange)="onTabChange($event)">
        
        <!-- Dashboard Tab -->
        <mat-tab label="Analytics Dashboard">
          <div class="tab-content" *ngIf="dashboardData">
            <!-- Summary row -->
            <div class="analytics-row">
              <div class="glass-panel metric-card">
                <mat-icon class="metric-icon revenue">payments</mat-icon>
                <div class="metric-text">
                  <span class="metric-lbl">Total Sales Revenue</span>
                  <h3 class="metric-val">₹{{ dashboardData.salesSummary.totalRevenue | number:'1.2-2' }}</h3>
                </div>
              </div>
              
              <div class="glass-panel metric-card">
                <mat-icon class="metric-icon volume">shopping_bag</mat-icon>
                <div class="metric-text">
                  <span class="metric-lbl">Order Volumes</span>
                  <h3 class="metric-val">{{ dashboardData.salesSummary.totalOrders }}</h3>
                </div>
              </div>

              <div class="glass-panel metric-card">
                <mat-icon class="metric-icon basket">analytics</mat-icon>
                <div class="metric-text">
                  <span class="metric-lbl">Average basket size</span>
                  <h3 class="metric-val">₹{{ dashboardData.salesSummary.averageOrderValue | number:'1.2-2' }}</h3>
                </div>
              </div>
            </div>

            <!-- Stores split -->
            <div class="dashboard-split">
              <div class="glass-panel performance-card">
                <h4 class="card-headline">Branch Sales Split</h4>
                <div class="custom-table-container">
                  <table class="custom-table">
                    <thead>
                      <tr>
                        <th>Store Branch</th>
                        <th>Orders Count</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let branch of dashboardData.storeSales">
                        <td>{{ branch.storeName }}</td>
                        <td>{{ branch.orderCount }}</td>
                        <td class="amt">₹{{ branch.revenue | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Audit log panel -->
              <div class="glass-panel audit-card">
                <h4 class="card-headline">Recent Security Audit Logs</h4>
                <div class="audit-logs-list">
                  <div class="log-entry" *ngFor="let log of dashboardData.recentLogs">
                    <div class="log-meta">
                      <span class="log-action" [ngClass]="log.action.toLowerCase()">{{ log.action }}</span>
                      <span class="log-time">{{ log.timestamp | date:'shortTime' }}</span>
                    </div>
                    <p class="log-desc"><strong>{{ log.username }}</strong>: {{ log.details }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Product management -->
        <mat-tab label="Product Catalog">
          <div class="tab-content">
            <div class="catalog-actions-row">
              <button class="primary-button add-item-btn" (click)="toggleProductForm()">
                <mat-icon>{{ showProductForm ? 'close' : 'add' }}</mat-icon>
                <span>{{ showProductForm ? 'Cancel Form' : 'Add New Product' }}</span>
              </button>
            </div>

            <!-- Add/Edit form -->
            <div class="glass-panel form-card" *ngIf="showProductForm">
              <h3 class="form-title">{{ editingProduct ? 'Modify Product' : 'Create Product Catalog Entry' }}</h3>
              <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="admin-form">
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Product Barcode (EAN-13)</mat-label>
                    <input matInput formControlName="barcode" placeholder="e.g. 8901030752185">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Product Name</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>MRP Price (Inclusive of Tax)</mat-label>
                    <input matInput type="number" formControlName="price">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>GST Rate (%)</mat-label>
                    <input matInput type="number" formControlName="gstPercentage">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Stock Count</mat-label>
                    <input matInput type="number" formControlName="stockQuantity">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Image URL Link</mat-label>
                    <input matInput formControlName="imageUrl">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Description Details</mat-label>
                    <input matInput formControlName="description">
                  </mat-form-field>
                </div>

                <button type="submit" class="accent-button form-submit-btn" [disabled]="productForm.invalid">
                  Save Catalog Item
                </button>
              </form>
            </div>

            <!-- Listing grid -->
            <div class="glass-panel catalog-grid-card">
              <h3 class="panel-headline">Active Catalog Products</h3>
              <div class="custom-table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Barcode</th>
                      <th>Price</th>
                      <th>GST</th>
                      <th>Stock Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let prod of products">
                      <td><img [src]="prod.imageUrl || 'assets/placeholder-soap.webp'" alt="img" class="grid-thumbnail" (error)="setDefaultImage($event)"></td>
                      <td><strong>{{ prod.name }}</strong></td>
                      <td><span class="mono-code">{{ prod.barcode }}</span></td>
                      <td>₹{{ prod.price | number:'1.2-2' }}</td>
                      <td>{{ prod.gstPercentage }}%</td>
                      <td [ngClass]="{'low-stock-text': prod.stockQuantity < 10}">{{ prod.stockQuantity }} units</td>
                      <td>
                        <div class="action-btns">
                          <button mat-icon-button class="edit-btn" (click)="editProduct(prod)"><mat-icon>edit</mat-icon></button>
                          <button mat-icon-button class="delete-btn" (click)="deleteProduct(prod.id)"><mat-icon>delete</mat-icon></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Coupon management -->
        <mat-tab label="Coupon Discount Rules">
          <div class="tab-content">
            <div class="catalog-actions-row">
              <button class="primary-button add-item-btn" (click)="toggleCouponForm()">
                <mat-icon>{{ showCouponForm ? 'close' : 'add' }}</mat-icon>
                <span>{{ showCouponForm ? 'Cancel Form' : 'Add New Coupon' }}</span>
              </button>
            </div>

            <!-- Add Coupon Form -->
            <div class="glass-panel form-card" *ngIf="showCouponForm">
              <h3 class="form-title">{{ editingCoupon ? 'Modify Coupon Rule' : 'Create New Coupon Rule' }}</h3>
              <form [formGroup]="couponForm" (ngSubmit)="saveCoupon()" class="admin-form">
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Coupon Code</mat-label>
                    <input matInput formControlName="code" placeholder="e.g. SUPER20">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Discount Percentage (%)</mat-label>
                    <input matInput type="number" formControlName="discountPercentage">
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Min Basket Value (₹)</mat-label>
                    <input matInput type="number" formControlName="minCartValue">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Max Cap Amount (₹)</mat-label>
                    <input matInput type="number" formControlName="maxDiscountAmount">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Expiry Date (YYYY-MM-DD)</mat-label>
                    <input matInput formControlName="expiryDate" placeholder="e.g. 2026-12-31">
                  </mat-form-field>
                  
                  <mat-form-field appearance="fill">
                    <mat-label>Active Status</mat-label>
                    <mat-select formControlName="active">
                      <mat-option [value]="true">Active</mat-option>
                      <mat-option [value]="false">Inactive</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <button type="submit" class="accent-button form-submit-btn" [disabled]="couponForm.invalid">
                  Save Coupon Rule
                </button>
              </form>
            </div>

            <!-- Coupon rule table -->
            <div class="glass-panel catalog-grid-card">
              <h3 class="panel-headline">Active Promo Coupon Rules</h3>
              <div class="custom-table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Coupon Code</th>
                      <th>Discount Rate</th>
                      <th>Min Cart Size</th>
                      <th>Max Cap Limit</th>
                      <th>Expiration</th>
                      <th>Active Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let coup of coupons">
                      <td><span class="mono-code coupon-tag">{{ coup.code }}</span></td>
                      <td>{{ coup.discountPercentage }}%</td>
                      <td>₹{{ coup.minCartValue }}</td>
                      <td>₹{{ coup.maxDiscountAmount }}</td>
                      <td>{{ coup.expiryDate }}</td>
                      <td>
                        <span class="status-indicator" [ngClass]="coup.active ? 'active' : 'inactive'"></span>
                        <span>{{ coup.active ? 'Armed' : 'Inactive' }}</span>
                      </td>
                      <td>
                        <div class="action-btns">
                          <button mat-icon-button class="edit-btn" (click)="editCoupon(coup)"><mat-icon>edit</mat-icon></button>
                          <button mat-icon-button class="delete-btn" (click)="deleteCoupon(coup.id!)"><mat-icon>delete</mat-icon></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Stores configuration -->
        <mat-tab label="Stores Branches Configuration">
          <div class="tab-content">
            <div class="catalog-actions-row">
              <button class="primary-button add-item-btn" (click)="toggleStoreForm()">
                <mat-icon>{{ showStoreForm ? 'close' : 'add' }}</mat-icon>
                <span>{{ showStoreForm ? 'Cancel Form' : 'Add New Branch' }}</span>
              </button>
            </div>

            <!-- Add Store Form -->
            <div class="glass-panel form-card" *ngIf="showStoreForm">
              <h3 class="form-title">Register Store Branch</h3>
              <form [formGroup]="storeForm" (ngSubmit)="saveStore()" class="admin-form">
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Branch Name</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="fill">
                    <mat-label>Store QR Identifier code</mat-label>
                    <input matInput formControlName="qrIdentifier" placeholder="e.g. BLR_INDIRANAGAR_01">
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="fill">
                    <mat-label>Physical Address Details</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>
                </div>

                <button type="submit" class="accent-button form-submit-btn" [disabled]="storeForm.invalid">
                  Register Outlet Branch
                </button>
              </form>
            </div>

            <!-- Outlet Table -->
            <div class="glass-panel catalog-grid-card">
              <h3 class="panel-headline">Registered Outlet Stores</h3>
              <div class="custom-table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>Store QR Code Link</th>
                      <th>Physical Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let st of stores">
                      <td><strong>{{ st.name }}</strong></td>
                      <td><span class="mono-code">{{ st.qrIdentifier }}</span></td>
                      <td>{{ st.address }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-shell {
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.6rem;
    }

    .admin-tabs {
      background: transparent !important;
    }

    .tab-content {
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Metric Cards */
    .analytics-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 20px;
    }

    .metric-icon {
      font-size: 2.2rem;
      width: auto;
      height: auto;
      
      &.revenue { color: var(--accent); }
      &.volume { color: var(--primary); }
      &.basket { color: var(--warning); }
    }

    .metric-text {
      display: flex;
      flex-direction: column;
    }

    .metric-lbl {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .metric-val {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Dashboard Split */
    .dashboard-split {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 20px;
    }

    .card-headline {
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .amt {
      color: var(--accent);
      font-weight: 600;
    }

    /* Logs */
    .audit-logs-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
    }

    .log-entry {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.7rem;
    }

    .log-action {
      background: var(--primary);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      
      &.payment_success { background: var(--accent); }
      &.payment_failed { background: var(--danger); }
      &.guard_verify_success { background: var(--primary); }
      &.guard_reuse_attempt { background: var(--warning); }
    }

    .log-time {
      color: var(--text-muted);
    }

    .log-desc {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    /* Form and grid configurations */
    .catalog-actions-row {
      display: flex;
      justify-content: flex-end;
    }

    .form-card {
      padding: 24px;
    }

    .form-title {
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .admin-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      
      & > * {
        flex: 1;
      }
    }

    .form-submit-btn {
      width: fit-content;
      align-self: flex-end;
    }

    .panel-headline {
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .grid-thumbnail {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: contain;
      background: white;
      border: 1px solid var(--border-color);
    }

    .mono-code {
      font-family: monospace;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .coupon-tag {
      background: rgba(99, 102, 241, 0.05);
      color: var(--primary);
      border-color: var(--border-color-glow);
      font-weight: 600;
    }

    .low-stock-text {
      color: var(--warning) !important;
      font-weight: 600;
    }

    .status-indicator {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
      
      &.active {
        background: var(--accent);
        box-shadow: 0 0 6px var(--accent);
      }
      &.inactive {
        background: var(--danger);
        box-shadow: 0 0 6px var(--danger);
      }
    }

    .action-btns {
      display: flex;
      gap: 4px;
    }

    .edit-btn {
      color: var(--text-secondary);
      &:hover { color: var(--primary); }
    }

    .delete-btn {
      color: var(--text-muted);
      &:hover { color: var(--danger); }
    }

    @media (max-width: 768px) {
      .analytics-row {
        grid-template-columns: 1fr;
      }
      .dashboard-split {
        grid-template-columns: 1fr;
      }
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private catalogService = inject(CatalogService);
  private fb = inject(FormBuilder);

  dashboardData: DashboardData | null = null;
  products: ProductDto[] = [];
  stores: StoreDto[] = [];
  coupons: Coupon[] = [];

  showProductForm = false;
  editingProduct: ProductDto | null = null;
  productForm!: FormGroup;

  showCouponForm = false;
  editingCoupon: Coupon | null = null;
  couponForm!: FormGroup;

  showStoreForm = false;
  storeForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.fetchDashboard();
  }

  initForms() {
    this.productForm = this.fb.group({
      barcode: ['', Validators.required],
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      gstPercentage: [18, [Validators.required, Validators.min(0)]],
      stockQuantity: [100, [Validators.required, Validators.min(0)]],
      imageUrl: [''],
      description: ['']
    });

    this.couponForm = this.fb.group({
      code: ['', Validators.required],
      discountPercentage: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      minCartValue: [100, [Validators.required, Validators.min(0)]],
      maxDiscountAmount: [50, [Validators.required, Validators.min(0)]],
      expiryDate: ['', Validators.required],
      active: [true, Validators.required]
    });

    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      qrIdentifier: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  onTabChange(event: any) {
    const label = event.tab.textLabel;
    if (label === 'Analytics Dashboard') {
      this.fetchDashboard();
    } else if (label === 'Product Catalog') {
      this.fetchProducts();
    } else if (label === 'Coupon Discount Rules') {
      this.fetchCoupons();
    } else if (label === 'Stores Branches Configuration') {
      this.fetchStores();
    }
  }

  fetchDashboard() {
    this.adminService.getDashboardData().subscribe(data => this.dashboardData = data);
  }

  fetchProducts() {
    this.catalogService.getProducts().subscribe(data => this.products = data);
  }

  fetchCoupons() {
    this.adminService.getCoupons().subscribe(data => this.coupons = data);
  }

  fetchStores() {
    this.catalogService.getStores().subscribe(data => this.stores = data);
  }

  // --- Product CRUD ---
  toggleProductForm() {
    this.showProductForm = !this.showProductForm;
    this.editingProduct = null;
    this.productForm.reset({ price: 0, gstPercentage: 18, stockQuantity: 100 });
  }

  editProduct(prod: ProductDto) {
    this.editingProduct = prod;
    this.showProductForm = true;
    this.productForm.patchValue(prod);
  }

  saveProduct() {
    if (this.productForm.invalid) return;
    const body = this.productForm.value;

    if (this.editingProduct) {
      this.adminService.updateProduct(this.editingProduct.id, body).subscribe(() => {
        this.fetchProducts();
        this.toggleProductForm();
      });
    } else {
      this.adminService.createProduct(body).subscribe(() => {
        this.fetchProducts();
        this.toggleProductForm();
      });
    }
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product from catalog?')) {
      this.adminService.deleteProduct(id).subscribe(() => this.fetchProducts());
    }
  }

  // --- Coupon CRUD ---
  toggleCouponForm() {
    this.showCouponForm = !this.showCouponForm;
    this.editingCoupon = null;
    this.couponForm.reset({ discountPercentage: 10, minCartValue: 100, maxDiscountAmount: 50, active: true });
  }

  editCoupon(coupon: Coupon) {
    this.editingCoupon = coupon;
    this.showCouponForm = true;
    this.couponForm.patchValue(coupon);
  }

  saveCoupon() {
    if (this.couponForm.invalid) return;
    const body = this.couponForm.value;

    if (this.editingCoupon) {
      this.adminService.updateCoupon(this.editingCoupon.id!, body).subscribe(() => {
        this.fetchCoupons();
        this.toggleCouponForm();
      });
    } else {
      this.adminService.createCoupon(body).subscribe(() => {
        this.fetchCoupons();
        this.toggleCouponForm();
      });
    }
  }

  deleteCoupon(id: string) {
    if (confirm('Delete this coupon?')) {
      this.adminService.deleteCoupon(id).subscribe(() => this.fetchCoupons());
    }
  }

  // --- Store CRUD ---
  toggleStoreForm() {
    this.showStoreForm = !this.showStoreForm;
    this.storeForm.reset();
  }

  saveStore() {
    if (this.storeForm.invalid) return;
    const body = this.storeForm.value;

    this.adminService.createStore(body).subscribe(() => {
      this.fetchStores();
      this.toggleStoreForm();
    });
  }

  setDefaultImage(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
  }
}
