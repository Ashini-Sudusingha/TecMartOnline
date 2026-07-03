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
import lk.jiat.techmart.dto.OrderItemDTO;
import lk.jiat.techmart.dto.PickListDTO;
import lk.jiat.techmart.dto.PickListRequestDTO;
import lk.jiat.techmart.dto.PackingItemDTO;
import lk.jiat.techmart.dto.PackItemRequestDTO;
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

        boolean placed = orderService.placeOrder(orderRequest);

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

    @GET
    public Response getAllOrders(@HeaderParam("Authorization") String authHeader) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseUtil.buildSuccessResponse("All store orders retrieved successfully", orders);
    }

    @GET
    @Path("/{orderId}/items")
    public Response getOrderItems(@HeaderParam("Authorization") String authHeader, @PathParam("orderId") Long orderId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<OrderItemDTO> items = orderService.getOrderItems(orderId);
        return ResponseUtil.buildSuccessResponse("Order items retrieved successfully", items);
    }

    @POST
    @Path("/pick-lists")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createPickList(@HeaderParam("Authorization") String authHeader, PickListRequestDTO request) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        boolean created = orderService.createPickList(request);
        if (created) {
            return ResponseUtil.buildSuccessResponse("Pick list created and assigned successfully", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Failed to create or assign pick list");
        }
    }

    @GET
    @Path("/warehouses/{warehouseId}/pick-lists")
    public Response getPickListsByWarehouse(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<PickListDTO> pickLists = orderService.getPickListsByWarehouseId(warehouseId);
        return ResponseUtil.buildSuccessResponse("Warehouse pick lists retrieved successfully", pickLists);
    }

    @GET
    @Path("/pick-lists")
    public Response getAllPickLists(@HeaderParam("Authorization") String authHeader) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<PickListDTO> pickLists = orderService.getAllPickLists();
        return ResponseUtil.buildSuccessResponse("All store pick lists retrieved successfully", pickLists);
    }

    @GET
    @Path("/pick-lists/{picklistId}/packing-details")
    public Response getPackingDetails(@HeaderParam("Authorization") String authHeader, @PathParam("picklistId") Long picklistId) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        List<PackingItemDTO> details = orderService.getPackingDetails(picklistId);
        return ResponseUtil.buildSuccessResponse("Pick list packing details retrieved successfully", details);
    }

    @POST
    @Path("/pack-item")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response packItem(@HeaderParam("Authorization") String authHeader, PackItemRequestDTO request) {
        Response authCheck = checkAuth(authHeader);
        if (authCheck != null) return authCheck;

        boolean success = orderService.packItem(request);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Item packed successfully and inventory updated", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Failed to pack item. Ensure enough stock is available.");
        }
    }

    @jakarta.ws.rs.PUT
    @Path("/{orderId}/status")
    public Response updateOrderStatus(@HeaderParam("Authorization") String authHeader, @PathParam("orderId") Long orderId, @jakarta.ws.rs.QueryParam("status") String statusName) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        if (statusName == null || statusName.trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Status parameter is required.");
        }

        boolean success = orderService.updateOrderStatus(orderId, statusName.trim());
        if (success) {
            return ResponseUtil.buildSuccessResponse("Order status updated successfully", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Order not found or update failed.");
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
