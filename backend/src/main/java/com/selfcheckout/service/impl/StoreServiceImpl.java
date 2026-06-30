package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CatalogDto.StoreDto;
import com.selfcheckout.entity.Store;
import com.selfcheckout.exception.ResourceNotFoundException;
import com.selfcheckout.repository.StoreRepository;
import com.selfcheckout.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;

    @Override
    @Transactional(readOnly = true)
    public Store getStoreByQr(String qrIdentifier) {
        return storeRepository.findByQrIdentifier(qrIdentifier)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with QR: " + qrIdentifier));
    }

    @Override
    @Transactional
    public Store createStore(StoreDto storeDto) {
        Store store = Store.builder()
                .name(storeDto.getName())
                .address(storeDto.getAddress())
                .qrIdentifier(storeDto.getQrIdentifier())
                .build();
        return storeRepository.save(store);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Store getStoreById(UUID storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with ID: " + storeId));
    }
}
