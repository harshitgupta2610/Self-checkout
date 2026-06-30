package com.selfcheckout.controller;

import com.selfcheckout.dto.CatalogDto.StoreDto;
import com.selfcheckout.entity.Store;
import com.selfcheckout.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
@Tag(name = "Stores", description = "Endpoints for store lookup and session initialization")
public class StoreController {

    private final StoreService storeService;

    @GetMapping("/session/{qrIdentifier}")
    @Operation(summary = "Validate a store entrance QR code and fetch active store branch details")
    public ResponseEntity<StoreDto> getStoreSessionDetails(@PathVariable String qrIdentifier) {
        Store store = storeService.getStoreByQr(qrIdentifier);
        StoreDto dto = StoreDto.builder()
                .id(store.getId())
                .name(store.getName())
                .address(store.getAddress())
                .qrIdentifier(store.getQrIdentifier())
                .build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    @Operation(summary = "Get list of all stores")
    public ResponseEntity<List<StoreDto>> getAllStores() {
        List<StoreDto> dtos = storeService.getAllStores().stream()
                .map(store -> StoreDto.builder()
                        .id(store.getId())
                        .name(store.getName())
                        .address(store.getAddress())
                        .qrIdentifier(store.getQrIdentifier())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
