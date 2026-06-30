package com.selfcheckout.config;

import com.selfcheckout.entity.*;
import com.selfcheckout.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DbSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedStores();
        seedProducts();
        seedCoupons();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            log.info("Seeding users...");
            userRepository.save(User.builder()
                    .username("customer")
                    .email("customer@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.ROLE_CUSTOMER)
                    .active(true)
                    .build());

            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .build());

            userRepository.save(User.builder()
                    .username("guard")
                    .email("guard@example.com")
                    .password(passwordEncoder.encode("password"))
                    .role(Role.ROLE_GUARD)
                    .active(true)
                    .build());
            log.info("Users seeded successfully.");
        }
    }

    private void seedStores() {
        if (storeRepository.count() == 0) {
            log.info("Seeding stores...");
            storeRepository.save(Store.builder()
                    .name("Smart Mart - Downtown")
                    .address("123 Main Street, City Centre")
                    .qrIdentifier("STORE-DOWNTOWN-001")
                    .build());
            storeRepository.save(Store.builder()
                    .name("Smart Mart - Uptown")
                    .address("789 High Street, Uptown Area")
                    .qrIdentifier("STORE-UPTOWN-002")
                    .build());
            log.info("Stores seeded successfully.");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            log.info("Seeding products...");
            productRepository.save(Product.builder()
                    .barcode("8901030753757")
                    .name("Dove Intense Repair Shampoo")
                    .description("Dove Intense Repair Shampoo for damaged hair, 340ml")
                    .imageUrl("https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200")
                    .price(new BigDecimal("350.00"))
                    .gstPercentage(new BigDecimal("18.00"))
                    .stockQuantity(100)
                    .build());

            productRepository.save(Product.builder()
                    .barcode("8901719101037")
                    .name("Oreo Chocolate Sandwich Biscuits")
                    .description("Oreo Chocolate Cookies with Vanilla Cream, 120g")
                    .imageUrl("https://images.unsplash.com/photo-1558961309-dbdf6600827a?w=200")
                    .price(new BigDecimal("35.00"))
                    .gstPercentage(new BigDecimal("18.00"))
                    .stockQuantity(250)
                    .build());

            productRepository.save(Product.builder()
                    .barcode("8901207040444")
                    .name("Tata Salt Lite")
                    .description("Tata Salt Lite Low Sodium Salt, 1kg")
                    .imageUrl("https://images.unsplash.com/photo-1604838604921-9957774e142b?w=200")
                    .price(new BigDecimal("45.00"))
                    .gstPercentage(new BigDecimal("5.00"))
                    .stockQuantity(150)
                    .build());

            productRepository.save(Product.builder()
                    .barcode("1234567890128")
                    .name("Coca-Cola Original Taste")
                    .description("Coca-Cola Soft Drink Can, 330ml")
                    .imageUrl("https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200")
                    .price(new BigDecimal("40.00"))
                    .gstPercentage(new BigDecimal("28.00"))
                    .stockQuantity(500)
                    .build());

            productRepository.save(Product.builder()
                    .barcode("9876543210123")
                    .name("Organic Honey")
                    .description("Pure Wild Forest Organic Honey, 250g")
                    .imageUrl("https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200")
                    .price(new BigDecimal("249.00"))
                    .gstPercentage(new BigDecimal("5.00"))
                    .stockQuantity(80)
                    .build());
            log.info("Products seeded successfully.");
        }
    }

    private void seedCoupons() {
        if (couponRepository.count() == 0) {
            log.info("Seeding coupons...");
            couponRepository.save(Coupon.builder()
                    .code("WELCOME10")
                    .discountPercentage(new BigDecimal("10.00"))
                    .maxDiscountAmount(new BigDecimal("100.00"))
                    .minCartValue(new BigDecimal("200.00"))
                    .active(true)
                    .expiryDate(LocalDate.now().plusMonths(6))
                    .build());

            couponRepository.save(Coupon.builder()
                    .code("SUPER30")
                    .discountPercentage(new BigDecimal("30.00"))
                    .maxDiscountAmount(new BigDecimal("300.00"))
                    .minCartValue(new BigDecimal("500.00"))
                    .active(true)
                    .expiryDate(LocalDate.now().plusMonths(6))
                    .build());
            log.info("Coupons seeded successfully.");
        }
    }
}
