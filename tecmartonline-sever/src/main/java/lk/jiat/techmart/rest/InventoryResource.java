package lk.jiat.techmart.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.InventoryDTO;
import lk.jiat.techmart.jms.InventoryPublisher;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

@Path("/inventory")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InventoryResource {

    @Inject
    private InventoryPublisher inventoryPublisher;

    @POST
    @Path("/replenish")
    public Response replenishStock(@HeaderParam("Authorization") String authHeader, InventoryDTO dto) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        if (dto == null || dto.getProductId() == null || dto.getStockQuantity() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Product ID and positive quantity are required.");
        }

        // Simulate db replenishment update logic...
        System.out.println("InventoryResource: Stock replenished for product: " + dto.getProductId() + " with qty: " + dto.getStockQuantity());

        // Publish Stock warning signals to administrators or system caches
        String stockJson = String.format(
            "{\"productId\": %d, \"replenishedQuantity\": %d, \"warehouseName\": \"%s\", \"timestamp\": %d}",
            dto.getProductId(),
            dto.getStockQuantity(),
            dto.getWarehouseName() != null ? dto.getWarehouseName() : "Main Warehouse",
            System.currentTimeMillis()
        );
        inventoryPublisher.publishInventoryUpdate(stockJson);

        return ResponseUtil.buildSuccessResponse("Stock replenished and topic message published.", dto);
    }

    private Response checkAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }
        String role = JWTUtil.getRole(token);
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseUtil.buildErrorResponse(Status.FORBIDDEN, "Permission denied. Admin role required.");
        }
        return null;
    }
}
