package com.selfcheckout.service;

import com.selfcheckout.dto.AuthDto.*;

public interface AuthService {
    JwtResponse authenticateUser(LoginRequest loginRequest);
    JwtResponse registerUser(SignupRequest signupRequest);
    TokenRefreshResponse refreshAccessToken(TokenRefreshRequest refreshRequest);
}
