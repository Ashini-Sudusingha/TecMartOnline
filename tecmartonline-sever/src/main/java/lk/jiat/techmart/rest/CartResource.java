package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.CartDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.CartServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/cart")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CartResource {

    @EJB
    private CartServiceRemote cartService;

    @GET
    @Path("/{userId}")
    public Response getCart(@HeaderParam("Authorization") String authHeader, @PathParam("userId") Long userId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<CartDTO> cartItems = cartService.getCartByUserId(userId);
        return ResponseUtil.buildSuccessResponse("Cart items retrieved successfully", cartItems);
    }

    @POST
    @Path("/{userId}")
    public Response addToCart(@HeaderParam("Authorization") String authHeader,
                             @PathParam("userId") Long userId,
                             @QueryParam("productId") Long productId,
                             @QueryParam("quantity") int quantity) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        if (productId == null || quantity <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Product ID and valid quantity are required.");
        }

        boolean success = cartService.addToCart(userId, productId, quantity);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Item added to cart successfully", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Failed to add item to cart.");
        }
    }

    @DELETE
    @Path("/item/{cartItemId}")
    public Response removeFromCart(@HeaderParam("Authorization") String authHeader, @PathParam("cartItemId") Long cartItemId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        boolean success = cartService.removeFromCart(cartItemId);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Item removed from cart successfully", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Cart item not found or removal failed.");
        }
    }

    private Response checkAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }
        return null;
    }
}
