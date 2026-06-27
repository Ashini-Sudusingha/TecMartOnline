package lk.jiat.techmart.rest;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.InventoryDTO;
import lk.jiat.techmart.jms.InventoryPublisher;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;
import java.util.ArrayList;

@Path("/inventory")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InventoryResource {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Inject
    private InventoryPublisher inventoryPublisher;

    @GET
    @Path("/invoice/{invoiceId}")
    public Response getInventoryByInvoice(@HeaderParam("Authorization") String authHeader, @PathParam("invoiceId") Long invoiceId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<lk.jiat.techmart.entity.Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.invoice.id = :invoiceId", 
                lk.jiat.techmart.entity.Inventory.class
            );
            query.setParameter("invoiceId", invoiceId);
            java.util.List<lk.jiat.techmart.entity.Inventory> list = query.getResultList();
            
            java.util.List<InventoryDTO> dtos = new java.util.ArrayList<>();
            for (lk.jiat.techmart.entity.Inventory i : list) {
                dtos.add(new InventoryDTO(
                    i.getId(),
                    i.getProduct().getId(),
                    i.getProduct().getName(),
                    i.getWarehouse().getId(),
                    i.getWarehouse().getName(),
                    i.getWarehouseLocation().getId(),
                    i.getWarehouseLocation().getLocation(),
                    i.getStockQuantity(),
                    i.getBuyingPrice(),
                    i.getInvoice().getId(),
                    i.getStatus().getName()
                ));
            }
            return ResponseUtil.buildSuccessResponse("Invoice inventory items retrieved", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving invoice inventory items.");
        }
    }

    @GET
    @Path("/warehouse/{warehouseId}")
    public Response getInventoryByWarehouse(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<lk.jiat.techmart.entity.Inventory> query = em.createQuery(
                "SELECT i FROM Inventory i WHERE i.warehouse.id = :warehouseId", 
                lk.jiat.techmart.entity.Inventory.class
            );
            query.setParameter("warehouseId", warehouseId);
            java.util.List<lk.jiat.techmart.entity.Inventory> list = query.getResultList();
            
            java.util.List<InventoryDTO> dtos = new java.util.ArrayList<>();
            for (lk.jiat.techmart.entity.Inventory i : list) {
                dtos.add(new InventoryDTO(
                    i.getId(),
                    i.getProduct().getId(),
                    i.getProduct().getName(),
                    i.getWarehouse().getId(),
                    i.getWarehouse().getName(),
                    i.getWarehouseLocation().getId(),
                    i.getWarehouseLocation().getLocation(),
                    i.getStockQuantity(),
                    i.getBuyingPrice(),
                    i.getInvoice().getId(),
                    i.getStatus().getName()
                ));
            }
            return ResponseUtil.buildSuccessResponse("Warehouse inventory items retrieved", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving warehouse inventory items: " + e.getMessage());
        }
    }

    @POST
    @Path("/invoice/{invoiceId}")
    @jakarta.transaction.Transactional
    public Response addInventoryItem(@HeaderParam("Authorization") String authHeader, @PathParam("invoiceId") Long invoiceId, InventoryDTO dto) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        if (dto == null || dto.getProductId() == null || dto.getWarehouseId() == null || 
            dto.getWarehouseLocationId() == null || dto.getStockQuantity() <= 0 || dto.getBuyingPrice() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Product, warehouse, location, quantity, and price are required.");
        }

        try {
            lk.jiat.techmart.entity.Invoice invoice = em.find(lk.jiat.techmart.entity.Invoice.class, invoiceId);
            lk.jiat.techmart.entity.Product product = em.find(lk.jiat.techmart.entity.Product.class, dto.getProductId());
            lk.jiat.techmart.entity.Warehouse warehouse = em.find(lk.jiat.techmart.entity.Warehouse.class, dto.getWarehouseId());
            lk.jiat.techmart.entity.WarehouseLocation location = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, dto.getWarehouseLocationId());

            if (invoice == null || product == null || warehouse == null || location == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid invoice, product, warehouse, or location references.");
            }

            // Check capacity limit
            if (location.getQuantity() + dto.getStockQuantity() > location.getMaxCapacity()) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, 
                    "Location exceeds capacity limit (" + location.getQuantity() + "/" + location.getMaxCapacity() + ").");
            }

            // Update location quantity
            location.setQuantity(location.getQuantity() + dto.getStockQuantity());
            em.merge(location);

            // Fetch default Status ID 1 (Active/Available)
            lk.jiat.techmart.entity.Status status = em.find(lk.jiat.techmart.entity.Status.class, 1);
            if (status == null) {
                TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s", lk.jiat.techmart.entity.Status.class);
                sq.setMaxResults(1);
                status = sq.getSingleResult();
            }

            lk.jiat.techmart.entity.Inventory inv = new lk.jiat.techmart.entity.Inventory();
            inv.setInvoice(invoice);
            inv.setProduct(product);
            inv.setWarehouse(warehouse);
            inv.setWarehouseLocation(location);
            inv.setStockQuantity(dto.getStockQuantity());
            inv.setBuyingPrice(dto.getBuyingPrice());
            inv.setCreatedAt(new java.util.Date());
            inv.setStatus(status);

            em.persist(inv);

            // Publish WebSocket notification message via JMS topic
            String notificationJson = String.format(
                "{\"productId\": %d, \"productName\": \"%s\", \"replenishedQuantity\": %d, \"warehouseName\": \"%s\", \"locationName\": \"%s\", \"timestamp\": %d}",
                product.getId(),
                product.getName().replace("\"", "\\\""),
                dto.getStockQuantity(),
                warehouse.getName().replace("\"", "\\\""),
                location.getLocation().replace("\"", "\\\""),
                System.currentTimeMillis()
            );
            inventoryPublisher.publishInventoryUpdate(notificationJson);

            dto.setId(inv.getId());
            dto.setProductName(product.getName());
            dto.setWarehouseName(warehouse.getName());
            dto.setLocation(location.getLocation());
            dto.setInvoiceId(invoice.getId());
            dto.setStatusName(status.getName());

            return ResponseUtil.buildSuccessResponse("Stock added to inventory successfully", dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error adding inventory: " + e.getMessage());
        }
    }

    @POST
    @Path("/invoice/{invoiceId}/bulk")
    @jakarta.transaction.Transactional
    public Response addInventoryItemsBulk(@HeaderParam("Authorization") String authHeader, @PathParam("invoiceId") Long invoiceId, List<InventoryDTO> dtos) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        if (dtos == null || dtos.isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "No inventory items provided.");
        }

        try {
            lk.jiat.techmart.entity.Invoice invoice = em.find(lk.jiat.techmart.entity.Invoice.class, invoiceId);
            if (invoice == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invoice not found.");
            }

            List<InventoryDTO> savedDtos = new ArrayList<>();
            lk.jiat.techmart.entity.Status status = em.find(lk.jiat.techmart.entity.Status.class, 1);
            if (status == null) {
                TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s", lk.jiat.techmart.entity.Status.class);
                sq.setMaxResults(1);
                status = sq.getSingleResult();
            }

            for (InventoryDTO dto : dtos) {
                if (dto.getProductId() == null || dto.getWarehouseId() == null || 
                    dto.getWarehouseLocationId() == null || dto.getStockQuantity() <= 0 || dto.getBuyingPrice() <= 0) {
                    return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "All fields are required for all items.");
                }

                lk.jiat.techmart.entity.Product product = em.find(lk.jiat.techmart.entity.Product.class, dto.getProductId());
                lk.jiat.techmart.entity.Warehouse warehouse = em.find(lk.jiat.techmart.entity.Warehouse.class, dto.getWarehouseId());
                lk.jiat.techmart.entity.WarehouseLocation location = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, dto.getWarehouseLocationId());

                if (product == null || warehouse == null || location == null) {
                    return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid references specified for an item.");
                }

                // Check capacity limits
                if (location.getQuantity() + dto.getStockQuantity() > location.getMaxCapacity()) {
                    return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, 
                        "Location '" + location.getLocation() + "' exceeds maximum capacity limit (" + 
                        location.getQuantity() + " occupied, max " + location.getMaxCapacity() + ").");
                }

                // Update location quantity
                location.setQuantity(location.getQuantity() + dto.getStockQuantity());
                em.merge(location);

                lk.jiat.techmart.entity.Inventory inv = new lk.jiat.techmart.entity.Inventory();
                inv.setInvoice(invoice);
                inv.setProduct(product);
                inv.setWarehouse(warehouse);
                inv.setWarehouseLocation(location);
                inv.setStockQuantity(dto.getStockQuantity());
                inv.setBuyingPrice(dto.getBuyingPrice());
                inv.setCreatedAt(new java.util.Date());
                inv.setStatus(status);

                em.persist(inv);

                // Publish WebSocket notification message via JMS topic
                String notificationJson = String.format(
                    "{\"productId\": %d, \"productName\": \"%s\", \"replenishedQuantity\": %d, \"warehouseName\": \"%s\", \"locationName\": \"%s\", \"timestamp\": %d}",
                    product.getId(),
                    product.getName().replace("\"", "\\\""),
                    dto.getStockQuantity(),
                    warehouse.getName().replace("\"", "\\\""),
                    location.getLocation().replace("\"", "\\\""),
                    System.currentTimeMillis()
                );
                inventoryPublisher.publishInventoryUpdate(notificationJson);

                savedDtos.add(new InventoryDTO(
                    inv.getId(),
                    product.getId(),
                    product.getName(),
                    warehouse.getId(),
                    warehouse.getName(),
                    location.getId(),
                    location.getLocation(),
                    inv.getStockQuantity(),
                    inv.getBuyingPrice(),
                    invoice.getId(),
                    status.getName()
                ));
            }

            return ResponseUtil.buildSuccessResponse("All items added to inventory successfully", savedDtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error adding inventory items bulk: " + e.getMessage());
        }
    }

    @POST
    @Path("/replenish")
    public Response replenishStock(@HeaderParam("Authorization") String authHeader, InventoryDTO dto) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        if (dto == null || dto.getProductId() == null || dto.getStockQuantity() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Product ID and positive quantity are required.");
        }

        System.out.println("InventoryResource: Stock replenished for product: " + dto.getProductId() + " with qty: " + dto.getStockQuantity());

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
