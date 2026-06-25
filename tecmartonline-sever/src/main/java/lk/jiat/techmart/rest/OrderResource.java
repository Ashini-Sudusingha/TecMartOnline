package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.OrderDTO;
import lk.jiat.techmart.dto.OrderRequestDTO;
import lk.jiat.techmart.jms.OrderProducer;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.OrderServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrderResource {

    @EJB
    private OrderServiceRemote orderService;

    @Inject
    private OrderProducer orderProducer;

    @POST
    public Response placeOrder(@HeaderParam("Authorization") String authHeader, OrderRequestDTO orderRequest) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        if (orderRequest == null || orderRequest.getUserId() == null || orderRequest.getTotal() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Required order parameters are missing.");
        }

        boolean placed = orderService.placeOrder(
                orderRequest.getUserId(),
                orderRequest.getAddressId(),
                orderRequest.getPaymentMethodId(),
                orderRequest.getTotal(),
                orderRequest.getSubtotal()
        );

        if (placed) {
            // Trigger JMS Point-to-Point asynchronous processing!
            String orderJson = String.format(
                "{\"userId\": %d, \"total\": %.2f, \"status\": \"PLACED\", \"timestamp\": %d}",
                orderRequest.getUserId(),
                orderRequest.getTotal(),
                System.currentTimeMillis()
            );
            orderProducer.sendOrderMessage(orderJson);

            return ResponseUtil.buildSuccessResponse("Order placed successfully. Processing in background.", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Checkout execution failed.");
        }
    }

    @GET
    @Path("/user/{userId}")
    public Response getOrdersByUserId(@HeaderParam("Authorization") String authHeader, @PathParam("userId") Long userId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<OrderDTO> orders = orderService.getOrdersByUserId(userId);
        return ResponseUtil.buildSuccessResponse("User orders list retrieved successfully", orders);
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
