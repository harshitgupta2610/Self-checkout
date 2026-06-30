package com.selfcheckout.controller;

import com.selfcheckout.dto.CatalogDto.ProductDto;
import com.selfcheckout.entity.Product;
import com.selfcheckout.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Endpoints for product barcode scanning and catalog details")
public class ProductController {

    private final ProductService productService;

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Lookup a product using its scanned EAN/UPC barcode")
    public ResponseEntity<ProductDto> getProductByBarcode(@PathVariable String barcode) {
        Product product = productService.getProductByBarcode(barcode);
        ProductDto dto = mapToProductDto(product);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    @Operation(summary = "Get list of all catalog products")
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> dtos = productService.getAllProducts().stream()
                .map(this::mapToProductDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private ProductDto mapToProductDto(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .barcode(product.getBarcode())
                .name(product.getName())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .price(product.getPrice())
                .gstPercentage(product.getGstPercentage())
                .stockQuantity(product.getStockQuantity())
                .build();
    }
}
