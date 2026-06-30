package com.selfcheckout.service.impl;

import com.selfcheckout.dto.AuthDto.*;
import com.selfcheckout.entity.Role;
import com.selfcheckout.entity.User;
import com.selfcheckout.exception.BadRequestException;
import com.selfcheckout.repository.UserRepository;
import com.selfcheckout.security.JwtTokenProvider;
import com.selfcheckout.security.UserPrincipal;
import com.selfcheckout.service.AuthService;
import com.selfcheckout.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateAccessToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getUsername());

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new BadRequestException("User record not found."));

        auditLogService.log(user, "USER_LOGIN", "User logged in successfully");

        return JwtResponse.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .id(userPrincipal.getId())
                .username(userPrincipal.getUsername())
                .email(userPrincipal.getEmail())
                .role(userPrincipal.getAuthorities().iterator().next().getAuthority())
                .build();
    }

    @Override
    @Transactional
    public JwtResponse registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new BadRequestException("Email Address already in use!");
        }

        Role userRole = Role.ROLE_CUSTOMER;
        if (signupRequest.getRole() != null) {
            try {
                userRole = Role.valueOf("ROLE_" + signupRequest.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role selected. Supported: CUSTOMER, GUARD, ADMIN");
            }
        }

        User user = User.builder()
                .username(signupRequest.getUsername())
                .email(signupRequest.getEmail())
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .role(userRole)
                .active(true)
                .build();

        userRepository.save(user);
        auditLogService.log(user, "USER_SIGNUP", "Created new user profile with role: " + userRole.name());

        // Authenticate the user directly after registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        signupRequest.getUsername(),
                        signupRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(user.getUsername());

        return JwtResponse.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TokenRefreshResponse refreshAccessToken(TokenRefreshRequest refreshRequest) {
        String requestRefreshToken = refreshRequest.getRefreshToken();

        if (tokenProvider.validateToken(requestRefreshToken)) {
            String username = tokenProvider.getUsernameFromJWT(requestRefreshToken);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadRequestException("Token refers to an invalid user."));

            String token = tokenProvider.generateAccessTokenFromUsername(username, user.getRole().name());
            String newRefreshToken = tokenProvider.generateRefreshToken(username);

            return TokenRefreshResponse.builder()
                    .accessToken(token)
                    .refreshToken(newRefreshToken)
                    .build();
        } else {
            throw new BadRequestException("Refresh token is invalid or expired.");
        }
    }
}
