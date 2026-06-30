package com.selfcheckout.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank
        private String usernameOrEmail;

        @NotBlank
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        @NotBlank
        @Size(min = 3, max = 50)
        private String username;

        @NotBlank
        @Size(max = 100)
        @Email
        private String email;

        @NotBlank
        @Size(min = 6, max = 40)
        private String password;

        private String role; // CUSTOMER, GUARD, ADMIN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JwtResponse {
        private String token;
        private String refreshToken;
        private UUID id;
        private String username;
        private String email;
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenRefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TokenRefreshResponse {
        private String accessToken;
        private String refreshToken;
    }
}
