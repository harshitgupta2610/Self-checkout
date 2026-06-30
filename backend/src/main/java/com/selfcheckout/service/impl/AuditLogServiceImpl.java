package com.selfcheckout.service.impl;

import com.selfcheckout.entity.AuditLog;
import com.selfcheckout.entity.User;
import com.selfcheckout.repository.AuditLogRepository;
import com.selfcheckout.repository.UserRepository;
import com.selfcheckout.security.UserPrincipal;
import com.selfcheckout.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void log(User user, String action, String details) {
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
        log.info("AUDIT LOG - User: {}, Action: {}, Details: {}", 
                user != null ? user.getUsername() : "ANONYMOUS", action, details);
    }

    @Override
    @Transactional
    public void log(String action, String details) {
        User user = getCurrentUser();
        log(user, action, details);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        
        try {
            if (authentication.getPrincipal() instanceof UserPrincipal principal) {
                return userRepository.findById(principal.getId()).orElse(null);
            }
        } catch (Exception e) {
            log.error("Failed to retrieve current user details from security context", e);
        }
        return null;
    }
}
