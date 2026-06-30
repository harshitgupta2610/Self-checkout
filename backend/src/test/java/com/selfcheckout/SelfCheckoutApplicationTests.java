package com.selfcheckout;

import com.selfcheckout.dto.AuthDto.LoginRequest;
import com.selfcheckout.dto.AuthDto.SignupRequest;
import com.selfcheckout.dto.CartDto.ShoppingCart;
import com.selfcheckout.dto.CatalogDto.ProductDto;
import com.selfcheckout.dto.CatalogDto.StoreDto;
import com.selfcheckout.entity.*;
import com.selfcheckout.repository.*;
import com.selfcheckout.service.AuthService;
import com.selfcheckout.service.CartService;
import com.selfcheckout.service.ProductService;
import com.selfcheckout.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SelfCheckoutApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private CartService cartService;

    @Autowired
    private StoreService storeService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Store testStore;
    private Product testProduct;
    private Coupon testCoupon;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        productRepository.deleteAll();
        storeRepository.deleteAll();
        couponRepository.deleteAll();

        // 1. Create a user
        testUser = User.builder()
                .username("testcustomer")
                .email("customer@test.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_CUSTOMER)
                .active(true)
                .build();
        userRepository.save(testUser);

        // 2. Create a store
        testStore = Store.builder()
                .name("Supermart Bengaluru")
                .address("Indiranagar, Bangalore")
                .qrIdentifier("BLR_INDIRANAGAR_01")
                .build();
        storeRepository.save(testStore);

        // 3. Create a product with EAN barcode
        testProduct = Product.builder()
                .barcode("8901030752185") // Standard Indian product EAN
                .name("Dove Moisturizing Soap")
                .price(BigDecimal.valueOf(100.00)) // MRP inclusive of GST
                .gstPercentage(BigDecimal.valueOf(18.0)) // 18% GST
                .stockQuantity(50)
                .build();
        productRepository.save(testProduct);

        // 4. Create a discount coupon
        testCoupon = Coupon.builder()
                .code("SUPER20")
                .discountPercentage(BigDecimal.valueOf(20.0))
                .maxDiscountAmount(BigDecimal.valueOf(50.00))
                .minCartValue(BigDecimal.valueOf(150.00))
                .active(true)
                .expiryDate(LocalDate.now().plusDays(10))
                .build();
        couponRepository.save(testCoupon);
    }

    @Test
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(cartService);
        assertNotNull(productService);
    }

    @Test
    void testUserAuthentication() {
        // Authenticate with valid credentials
        LoginRequest req = new LoginRequest("testcustomer", "password123");
        var res = authService.authenticateUser(req);
        
        assertNotNull(res.getToken());
        assertEquals("testcustomer", res.getUsername());
        assertEquals("ROLE_CUSTOMER", res.getRole());
    }

    @Test
    void testCartCalculationsMRPInclusive() {
        UUID userId = testUser.getId();
        UUID storeId = testStore.getId();

        // Add 2 Dove soaps (price: 100.00 each)
        ShoppingCart cart = cartService.addItemToCart(userId, storeId, "8901030752185", 2);

        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItems().get(0).getQuantity());
        
        // Final Amount should be 200.00 (Inclusive of tax, no coupon applied)
        assertEquals(BigDecimal.valueOf(200.00).setScale(2), cart.getFinalAmount());
        
        // GST Calculation: tax = 200 - (200 / 1.18) = 200 - 169.49 = 30.51
        // Subtotal = 169.49
        assertEquals(BigDecimal.valueOf(169.49), cart.getSubtotal());
        assertEquals(BigDecimal.valueOf(30.51), cart.getTaxAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), cart.getDiscountAmount());
    }

    @Test
    void testCartWithCouponCalculations() {
        UUID userId = testUser.getId();
        UUID storeId = testStore.getId();

        // Add 2 soaps -> raw total 200.00. Apply coupon SUPER20 (20% off min 150.00)
        cartService.addItemToCart(userId, storeId, "8901030752185", 2);
        ShoppingCart cart = cartService.applyCoupon(userId, "SUPER20");

        assertEquals("SUPER20", cart.getAppliedCouponCode());
        
        // Discount: 20% of 200 = 40.00 (below maxDiscountAmount of 50.00)
        assertEquals(BigDecimal.valueOf(40.00).setScale(2), cart.getDiscountAmount());
        
        // Final Amount: 200.00 - 40.00 = 160.00
        assertEquals(BigDecimal.valueOf(160.00).setScale(2), cart.getFinalAmount());

        // Back-calculated tax on 160.00: tax = 160 - (160 / 1.18) = 160 - 135.59 = 24.41
        // Subtotal = 135.59
        assertEquals(BigDecimal.valueOf(135.59), cart.getSubtotal());
        assertEquals(BigDecimal.valueOf(24.41), cart.getTaxAmount());
    }
}
