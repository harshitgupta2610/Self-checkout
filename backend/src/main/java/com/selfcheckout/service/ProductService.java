package com.selfcheckout.service;

import com.selfcheckout.dto.CatalogDto.ProductDto;
import com.selfcheckout.entity.Product;

import java.util.List;
import java.util.UUID;

public interface ProductService {
    Product getProductByBarcode(String barcode);
    Product getProductById(UUID id);
    Product createProduct(ProductDto productDto);
    Product updateProduct(UUID id, ProductDto productDto);
    void deleteProduct(UUID id);
    List<Product> getAllProducts();
}
