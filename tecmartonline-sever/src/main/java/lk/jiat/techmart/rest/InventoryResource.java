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
import lk.jiat.techmart.dto.LocationTransferRequestDTO;
import lk.jiat.techmart.entity.Inventory;
import lk.jiat.techmart.entity.WarehouseLocation;
import lk.jiat.techmart.entity.WarehouseInventoryTransfer;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.jms.InventoryPublisher;
import jakarta.transaction.Transactional;
import java.util.Date;
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
            lk.jiat.techmart.entity.WarehouseLocation location = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, dto.getWarehouseLocationIdAsLong());

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

            // Fetch default Status (Active/Available)
            lk.jiat.techmart.entity.Status status = null;
            try {
                TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", lk.jiat.techmart.entity.Status.class);
                sq.setParameter("name", "Active");
                status = sq.getSingleResult();
            } catch (Exception ex1) {
                try {
                    TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", lk.jiat.techmart.entity.Status.class);
                    sq.setParameter("name", "Available");
                    status = sq.getSingleResult();
                } catch (Exception ex2) {
                    status = em.find(lk.jiat.techmart.entity.Status.class, 1);
                }
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

            // Recalculate invoice total amount (Buying Price * Delivered Quantity)
            double newTotal = 0.0;
            try {
                Double sum = em.createQuery(
                    "SELECT SUM(i.buyingPrice * i.stockQuantity) FROM Inventory i WHERE i.invoice.id = :invoiceId", 
                    Double.class
                ).setParameter("invoiceId", invoiceId).getSingleResult();
                if (sum != null) {
                    newTotal = sum;
                }
            } catch (Exception exTotal) {
                exTotal.printStackTrace();
            }
            invoice.setTotalAmount(newTotal);
            em.merge(invoice);

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
            // Fetch default Status (Active/Available)
            lk.jiat.techmart.entity.Status status = null;
            try {
                TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", lk.jiat.techmart.entity.Status.class);
                sq.setParameter("name", "Active");
                status = sq.getSingleResult();
            } catch (Exception ex1) {
                try {
                    TypedQuery<lk.jiat.techmart.entity.Status> sq = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", lk.jiat.techmart.entity.Status.class);
                    sq.setParameter("name", "Available");
                    status = sq.getSingleResult();
                } catch (Exception ex2) {
                    status = em.find(lk.jiat.techmart.entity.Status.class, 1);
                }
            }

            for (InventoryDTO dto : dtos) {
                if (dto.getProductId() == null || dto.getWarehouseId() == null || 
                    dto.getWarehouseLocationId() == null || dto.getStockQuantity() <= 0 || dto.getBuyingPrice() <= 0) {
                    return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "All fields are required for all items.");
                }

                lk.jiat.techmart.entity.Product product = em.find(lk.jiat.techmart.entity.Product.class, dto.getProductId());
                lk.jiat.techmart.entity.Warehouse warehouse = em.find(lk.jiat.techmart.entity.Warehouse.class, dto.getWarehouseId());
                lk.jiat.techmart.entity.WarehouseLocation location = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, dto.getWarehouseLocationIdAsLong());

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

            // Recalculate invoice total amount (Buying Price * Delivered Quantity)
            double newTotal = 0.0;
            try {
                Double sum = em.createQuery(
                    "SELECT SUM(i.buyingPrice * i.stockQuantity) FROM Inventory i WHERE i.invoice.id = :invoiceId", 
                    Double.class
                ).setParameter("invoiceId", invoiceId).getSingleResult();
                if (sum != null) {
                    newTotal = sum;
                }
            } catch (Exception exTotal) {
                exTotal.printStackTrace();
            }
            invoice.setTotalAmount(newTotal);
            em.merge(invoice);

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

    @POST
    @Path("/transfer")
    @Transactional
    public Response transferLocation(@HeaderParam("Authorization") String authHeader, LocationTransferRequestDTO request) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        if (request == null || request.getInventoryId() == null || request.getNewLocationId() == null) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Inventory and target location parameters are required.");
        }

        try {
            String token = authHeader.substring(7);
            String email = JWTUtil.getSubject(token);

            TypedQuery<User> userQuery = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class);
            userQuery.setParameter("email", email);
            User user = userQuery.getSingleResult();

            Inventory inventory = em.find(Inventory.class, request.getInventoryId());
            Long newLocId = Long.parseLong(request.getNewLocationId());
            WarehouseLocation newLoc = em.find(WarehouseLocation.class, newLocId);

            if (inventory == null || newLoc == null || user == null) {
                System.out.println("=== DEBUG LOCATION TRANSFER ===");
                System.out.println("inventoryId passed: " + request.getInventoryId() + " -> loaded: " + (inventory != null));
                System.out.println("newLocationId passed: " + request.getNewLocationId() + " -> loaded: " + (newLoc != null));
                System.out.println("user email: " + email + " -> loaded: " + (user != null));
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid inventory, location, or user references. (Inv: " + (inventory != null) + ", Loc: " + (newLoc != null) + ", User: " + (user != null) + ")");
            }

            WarehouseLocation oldLoc = inventory.getWarehouseLocation();
            if (oldLoc.getId().equals(newLoc.getId())) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Target location is the same as the current location.");
            }

            if (newLoc.getQuantity() + inventory.getStockQuantity() > newLoc.getMaxCapacity()) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, 
                    "Target location exceeds capacity limit (" + newLoc.getQuantity() + "/" + newLoc.getMaxCapacity() + ").");
            }

            // Adjust location quantities
            oldLoc.setQuantity(oldLoc.getQuantity() - inventory.getStockQuantity());
            em.merge(oldLoc);

            newLoc.setQuantity(newLoc.getQuantity() + inventory.getStockQuantity());
            em.merge(newLoc);

            // Update inventory record location and warehouse
            inventory.setWarehouseLocation(newLoc);
            inventory.setWarehouse(newLoc.getWarehouse());
            em.merge(inventory);

            // Find or create "Completed" status
            TypedQuery<lk.jiat.techmart.entity.Status> statusQuery = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", lk.jiat.techmart.entity.Status.class);
            statusQuery.setParameter("name", "Completed");
            List<lk.jiat.techmart.entity.Status> statuses = statusQuery.getResultList();
            lk.jiat.techmart.entity.Status status;
            if (!statuses.isEmpty()) {
                status = statuses.get(0);
            } else {
                status = new lk.jiat.techmart.entity.Status();
                status.setName("Completed");
                em.persist(status);
            }

            // Log WarehouseInventoryTransfer
            WarehouseInventoryTransfer transfer = new WarehouseInventoryTransfer();
            transfer.setOldLocation(oldLoc);
            transfer.setNewLocation(newLoc);
            transfer.setInventory(inventory);
            transfer.setCreatedAt(new Date());
            transfer.setUser(user);
            transfer.setStatus(status);
            em.persist(transfer);

            // Broadcast WebSocket alert!
            String wsMsg = String.format(
                "{\"type\": \"locationTransfer\", \"productName\": \"%s\", \"oldLoc\": \"%s\", \"newLoc\": \"%s\", \"qty\": %d, \"sourceWarehouseId\": %d, \"sourceWarehouseName\": \"%s\", \"destWarehouseId\": %d, \"destWarehouseName\": \"%s\"}",
                inventory.getProduct().getName().replace("\"", "\\\""),
                oldLoc.getLocation().replace("\"", "\\\""),
                newLoc.getLocation().replace("\"", "\\\""),
                inventory.getStockQuantity(),
                oldLoc.getWarehouse().getId(),
                oldLoc.getWarehouse().getName().replace("\"", "\\\""),
                newLoc.getWarehouse().getId(),
                newLoc.getWarehouse().getName().replace("\"", "\\\"")
            );
            lk.jiat.techmart.websocket.InventoryWebSocket.broadcast(wsMsg);

            return ResponseUtil.buildSuccessResponse("Inventory location transferred successfully", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Internal server error: " + e.getMessage());
        }
    }

    @GET
    @Path("/transfers")
    public Response getTransferHistory(@HeaderParam("Authorization") String authHeader) {
        Response authCheck = checkAdmin(authHeader);
        if (authCheck != null) return authCheck;

        try {
            TypedQuery<WarehouseInventoryTransfer> query = em.createQuery(
                "SELECT wit FROM WarehouseInventoryTransfer wit ORDER BY wit.createdAt DESC",
                WarehouseInventoryTransfer.class
            );
            List<WarehouseInventoryTransfer> list = query.getResultList();

            List<lk.jiat.techmart.dto.WarehouseInventoryTransferDTO> dtos = new ArrayList<>();
            for (WarehouseInventoryTransfer wit : list) {
                String srcWh = wit.getOldLocation().getWarehouse() != null ? wit.getOldLocation().getWarehouse().getName() : "Unknown";
                String destWh = wit.getNewLocation().getWarehouse() != null ? wit.getNewLocation().getWarehouse().getName() : "Unknown";
                String userName = wit.getUser() != null ? wit.getUser().getFname() + " " + wit.getUser().getLname() : "System";

                dtos.add(new lk.jiat.techmart.dto.WarehouseInventoryTransferDTO(
                    wit.getId(),
                    wit.getInventory().getProduct().getName(),
                    wit.getInventory().getStockQuantity(),
                    wit.getOldLocation().getLocation(),
                    wit.getNewLocation().getLocation(),
                    srcWh,
                    destWh,
                    wit.getCreatedAt().getTime(),
                    userName,
                    wit.getStatus().getName()
                ));
            }

            return ResponseUtil.buildSuccessResponse("Transfer history retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Internal server error: " + e.getMessage());
        }
    }

    @GET
    @Path("/low-stock")
    public Response getLowStockAlerts(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            String jpql = "SELECT i.warehouse.id, i.warehouse.name, p.id, p.name, p.category.name, SUM(i.stockQuantity), p.lowStockLimit " +
                          "FROM Inventory i JOIN i.product p " +
                          "WHERE p.isActive = true " +
                          "GROUP BY i.warehouse.id, i.warehouse.name, p.id, p.name, p.category.name, p.lowStockLimit";

            TypedQuery<Object[]> query = em.createQuery(jpql, Object[].class);
            List<Object[]> results = query.getResultList();

            List<java.util.Map<String, Object>> alerts = new java.util.ArrayList<>();
            for (Object[] r : results) {
                Long warehouseId = (Long) r[0];
                String warehouseName = (String) r[1];
                Long productId = (Long) r[2];
                String productName = (String) r[3];
                String categoryName = (String) r[4];
                Long stockQty = (Long) r[5];
                Integer lowStockLimit = (Integer) r[6];

                if (stockQty <= lowStockLimit) {
                    java.util.Map<String, Object> alert = new java.util.HashMap<>();
                    alert.put("warehouseId", warehouseId);
                    alert.put("warehouseName", warehouseName);
                    alert.put("productId", productId);
                    alert.put("productName", productName);
                    alert.put("categoryName", categoryName);
                    alert.put("stockQty", stockQty);
                    alert.put("lowStockLimit", lowStockLimit);
                    alerts.add(alert);
                }
            }

            return ResponseUtil.buildSuccessResponse("Low stock alerts retrieved", alerts);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error: " + e.getMessage());
        }
    }

    @GET
    @Path("/product/{productId}/distribution")
    public Response getProductStockDistribution(@HeaderParam("Authorization") String authHeader, @PathParam("productId") Long productId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            String jpql = "SELECT i.warehouse.id, i.warehouse.name, SUM(i.stockQuantity) " +
                          "FROM Inventory i " +
                          "WHERE i.product.id = :productId " +
                          "GROUP BY i.warehouse.id, i.warehouse.name";
            TypedQuery<Object[]> query = em.createQuery(jpql, Object[].class);
            query.setParameter("productId", productId);
            List<Object[]> results = query.getResultList();

            List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
            for (Object[] r : results) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("warehouseId", r[0]);
                map.put("warehouseName", r[1]);
                map.put("stockQty", r[2]);
                list.add(map);
            }

            return ResponseUtil.buildSuccessResponse("Product warehouse stock distribution retrieved", list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error: " + e.getMessage());
        }
    }
}
