package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.LoginRequest;
import lk.jiat.techmart.dto.LoginResponse;
import lk.jiat.techmart.dto.SignupRequest;
import lk.jiat.techmart.service.remote.AuthServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @EJB
    private AuthServiceRemote authService;

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Email and Password are required.");
        }
        LoginResponse response = authService.login(request);
        if (response != null) {
            return ResponseUtil.buildSuccessResponse("Login successful", response);
        } else {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Invalid email or password.");
        }
    }

    @POST
    @Path("/register")
    public Response register(SignupRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Required fields are missing.");
        }
        boolean registered = authService.register(request);
        if (registered) {
            return ResponseUtil.buildSuccessResponse("Registration successful", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.CONFLICT, "Email address already registered.");
        }
    }
}
