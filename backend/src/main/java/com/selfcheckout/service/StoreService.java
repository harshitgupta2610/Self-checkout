package com.selfcheckout.service;

import com.selfcheckout.dto.CatalogDto.StoreDto;
import com.selfcheckout.entity.Store;

import java.util.List;
import java.util.UUID;

public interface StoreService {
    Store getStoreByQr(String qrIdentifier);
    Store createStore(StoreDto storeDto);
    List<Store> getAllStores();
    Store getStoreById(UUID storeId);
}
