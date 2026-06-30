package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CatalogDto.ProductDto;
import com.selfcheckout.entity.Product;
import com.selfcheckout.exception.BadRequestException;
import com.selfcheckout.exception.ResourceNotFoundException;
import com.selfcheckout.repository.ProductRepository;
import com.selfcheckout.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with barcode: " + barcode));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    @Override
    @Transactional
    public Product createProduct(ProductDto productDto) {
        if (productRepository.findByBarcode(productDto.getBarcode()).isPresent()) {
            throw new BadRequestException("Product with barcode " + productDto.getBarcode() + " already exists!");
        }

        Product product = Product.builder()
                .barcode(productDto.getBarcode())
                .name(productDto.getName())
                .description(productDto.getDescription())
                .imageUrl(productDto.getImageUrl())
                .price(productDto.getPrice())
                .gstPercentage(productDto.getGstPercentage())
                .stockQuantity(productDto.getStockQuantity())
                .build();
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product updateProduct(UUID id, ProductDto productDto) {
        Product product = getProductById(id);

        // check barcode uniqueness if changed
        if (!product.getBarcode().equals(productDto.getBarcode())) {
            if (productRepository.findByBarcode(productDto.getBarcode()).isPresent()) {
                throw new BadRequestException("Product with barcode " + productDto.getBarcode() + " already exists!");
            }
            product.setBarcode(productDto.getBarcode());
        }

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setImageUrl(productDto.getImageUrl());
        product.setPrice(productDto.getPrice());
        product.setGstPercentage(productDto.getGstPercentage());
        product.setStockQuantity(productDto.getStockQuantity());

        return productRepository.save(product);
    }

    @Override
    @Transactional
    public void deleteProduct(UUID id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
}
