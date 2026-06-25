package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.UserServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @EJB
    private UserServiceRemote userService;

    @GET
    public Response getAllUsers(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        List<UserDTO> users = userService.getAllUsers();
        return ResponseUtil.buildSuccessResponse("Users list retrieved successfully", users);
    }
}
