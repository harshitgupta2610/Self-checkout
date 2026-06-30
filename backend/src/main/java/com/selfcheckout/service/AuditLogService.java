package com.selfcheckout.service;

import com.selfcheckout.entity.AuditLog;
import com.selfcheckout.entity.User;

import java.util.List;

public interface AuditLogService {
    void log(User user, String action, String details);
    void log(String action, String details);
    List<AuditLog> getAllLogs();
}
