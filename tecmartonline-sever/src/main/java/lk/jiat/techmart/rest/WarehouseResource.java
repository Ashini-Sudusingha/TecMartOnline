package lk.jiat.techmart.rest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.entity.Warehouse;
import lk.jiat.techmart.dto.WarehouseDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/warehouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WarehouseResource {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

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

    @GET
    public Response getAllWarehouses(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<Warehouse> query = em.createQuery("SELECT w FROM Warehouse w", Warehouse.class);
            List<Warehouse> warehouses = query.getResultList();
            return ResponseUtil.buildSuccessResponse("Warehouses retrieved successfully", warehouses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving warehouses.");
        }
    }

    @GET
    @Path("/{id}")
    public Response getWarehouseById(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            Warehouse warehouse = em.find(Warehouse.class, id);
            if (warehouse == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse not found.");
            }
            return ResponseUtil.buildSuccessResponse("Warehouse retrieved successfully", warehouse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving warehouse.");
        }
    }

    @POST
    @jakarta.transaction.Transactional
    public Response addWarehouse(@HeaderParam("Authorization") String authHeader, WarehouseDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty() || dto.getLocation() == null || dto.getLocation().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Warehouse name and location are required.");
        }

        try {
            Warehouse warehouse = new Warehouse();
            
            // Fetch max ID + 1 since ID is BIGINT NOT NULL
            TypedQuery<Long> query = em.createQuery("SELECT COALESCE(MAX(w.id), 0) FROM Warehouse w", Long.class);
            Long maxId = query.getSingleResult();
            warehouse.setId(maxId + 1);

            warehouse.setName(dto.getName().trim());
            warehouse.setContactPhone(dto.getContactPhone() != null ? dto.getContactPhone().trim() : "");
            warehouse.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");
            warehouse.setLocation(dto.getLocation().trim());
            warehouse.setCreatedAt(new java.util.Date());
            warehouse.setIsActive(dto.isIsActive());

            em.persist(warehouse);

            return ResponseUtil.buildSuccessResponse("Warehouse created successfully", warehouse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error creating warehouse: " + e.getMessage());
        }
    }

    @PUT
    @Path("/{id}")
    @jakarta.transaction.Transactional
    public Response updateWarehouse(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id, WarehouseDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty() || dto.getLocation() == null || dto.getLocation().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Warehouse name and location are required.");
        }

        try {
            Warehouse warehouse = em.find(Warehouse.class, id);
            if (warehouse == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse not found.");
            }

            warehouse.setName(dto.getName().trim());
            warehouse.setContactPhone(dto.getContactPhone() != null ? dto.getContactPhone().trim() : "");
            warehouse.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");
            warehouse.setLocation(dto.getLocation().trim());
            warehouse.setIsActive(dto.isIsActive());

            em.merge(warehouse);

            return ResponseUtil.buildSuccessResponse("Warehouse updated successfully", warehouse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error updating warehouse: " + e.getMessage());
        }
    }

    @DELETE
    @Path("/{id}")
    @jakarta.transaction.Transactional
    public Response deleteWarehouse(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        try {
            Warehouse warehouse = em.find(Warehouse.class, id);
            if (warehouse == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse not found.");
            }

            em.remove(warehouse);
            return ResponseUtil.buildSuccessResponse("Warehouse deleted successfully", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error deleting warehouse: " + e.getMessage());
        }
    }

    @GET
    @Path("/{warehouseId}/locations")
    public Response getWarehouseLocations(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<lk.jiat.techmart.entity.WarehouseLocation> query = em.createQuery(
                "SELECT wl FROM WarehouseLocation wl WHERE wl.warehouse.id = :warehouseId", 
                lk.jiat.techmart.entity.WarehouseLocation.class
            );
            query.setParameter("warehouseId", warehouseId);
            List<lk.jiat.techmart.entity.WarehouseLocation> list = query.getResultList();
            
            // Map to DTOs
            java.util.List<lk.jiat.techmart.dto.WarehouseLocationDTO> dtos = new java.util.ArrayList<>();
            for (lk.jiat.techmart.entity.WarehouseLocation wl : list) {
                dtos.add(new lk.jiat.techmart.dto.WarehouseLocationDTO(
                    wl.getId(),
                    wl.getLocation(),
                    wl.getMaxCapacity(),
                    wl.getQuantity(),
                    wl.getWarehouse().getId(),
                    wl.getWarehouse().getName()
                ));
            }

            return ResponseUtil.buildSuccessResponse("Warehouse locations retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving warehouse locations.");
        }
    }

    @POST
    @Path("/{warehouseId}/locations")
    @jakarta.transaction.Transactional
    public Response addWarehouseLocation(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId, lk.jiat.techmart.dto.WarehouseLocationDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getLocation() == null || dto.getLocation().trim().isEmpty() || dto.getMaxCapacity() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Location name and valid max capacity are required.");
        }

        try {
            Warehouse warehouse = em.find(Warehouse.class, warehouseId);
            if (warehouse == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse not found.");
            }

            lk.jiat.techmart.entity.WarehouseLocation wl = new lk.jiat.techmart.entity.WarehouseLocation();
            
            // Generate unique 19-digit positive Long ID
            long uniqueId = java.util.concurrent.ThreadLocalRandom.current().nextLong(1000000000000000000L, Long.MAX_VALUE);
            wl.setId(uniqueId);

            wl.setLocation(dto.getLocation().trim());
            wl.setMaxCapacity(dto.getMaxCapacity());
            wl.setQuantity(dto.getQuantity());
            wl.setWarehouse(warehouse);

            em.persist(wl);

            return ResponseUtil.buildSuccessResponse("Warehouse location created successfully", new lk.jiat.techmart.dto.WarehouseLocationDTO(
                wl.getId(),
                wl.getLocation(),
                wl.getMaxCapacity(),
                wl.getQuantity(),
                wl.getWarehouse().getId(),
                wl.getWarehouse().getName()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error creating warehouse location: " + e.getMessage());
        }
    }

    @PUT
    @Path("/{warehouseId}/locations/{locationId}")
    @jakarta.transaction.Transactional
    public Response updateWarehouseLocation(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId, @PathParam("locationId") Long locationId, lk.jiat.techmart.dto.WarehouseLocationDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getLocation() == null || dto.getLocation().trim().isEmpty() || dto.getMaxCapacity() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Location name and valid max capacity are required.");
        }

        try {
            lk.jiat.techmart.entity.WarehouseLocation wl = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, locationId);
            if (wl == null || !wl.getWarehouse().getId().equals(warehouseId)) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse location not found.");
            }

            wl.setLocation(dto.getLocation().trim());
            wl.setMaxCapacity(dto.getMaxCapacity());
            wl.setQuantity(dto.getQuantity());

            em.merge(wl);

            return ResponseUtil.buildSuccessResponse("Warehouse location updated successfully", new lk.jiat.techmart.dto.WarehouseLocationDTO(
                wl.getId(),
                wl.getLocation(),
                wl.getMaxCapacity(),
                wl.getQuantity(),
                wl.getWarehouse().getId(),
                wl.getWarehouse().getName()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error updating warehouse location: " + e.getMessage());
        }
    }

    @DELETE
    @Path("/{warehouseId}/locations/{locationId}")
    @jakarta.transaction.Transactional
    public Response deleteWarehouseLocation(@HeaderParam("Authorization") String authHeader, @PathParam("warehouseId") Long warehouseId, @PathParam("locationId") Long locationId) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        try {
            lk.jiat.techmart.entity.WarehouseLocation wl = em.find(lk.jiat.techmart.entity.WarehouseLocation.class, locationId);
            if (wl == null || !wl.getWarehouse().getId().equals(warehouseId)) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Warehouse location not found.");
            }

            em.remove(wl);
            return ResponseUtil.buildSuccessResponse("Warehouse location deleted successfully", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error deleting warehouse location: " + e.getMessage());
        }
    }
}
