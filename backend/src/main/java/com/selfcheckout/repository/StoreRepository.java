package com.selfcheckout.repository;

import com.selfcheckout.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {
    Optional<Store> findByQrIdentifier(String qrIdentifier);
}
