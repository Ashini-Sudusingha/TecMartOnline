package lk.jiat.techmart.service.remote;

import jakarta.ejb.Remote;
import lk.jiat.techmart.dto.LoginRequest;
import lk.jiat.techmart.dto.LoginResponse;
import lk.jiat.techmart.dto.SignupRequest;

@Remote
public interface AuthServiceRemote {
    boolean register(SignupRequest request);
    LoginResponse login(LoginRequest request);
}
