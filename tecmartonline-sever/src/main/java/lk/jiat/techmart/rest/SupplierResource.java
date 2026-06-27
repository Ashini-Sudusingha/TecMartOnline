package lk.jiat.techmart.rest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.entity.Supplier;
import lk.jiat.techmart.entity.Brand;
import lk.jiat.techmart.entity.Category;
import lk.jiat.techmart.dto.SupplierDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;
import java.util.ArrayList;

@Path("/suppliers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SupplierResource {

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
    public Response getAllSuppliers(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<Supplier> query = em.createQuery("SELECT s FROM Supplier s", Supplier.class);
            List<Supplier> suppliers = query.getResultList();
            
            List<SupplierDTO> dtos = new ArrayList<>();
            for (Supplier s : suppliers) {
                dtos.add(new SupplierDTO(
                    s.getId(),
                    s.getName(),
                    s.getBrand().getId(),
                    s.getBrand().getName(),
                    s.getCategory().getId(),
                    s.getCategory().getName(),
                    s.getMobile(),
                    s.getEmail()
                ));
            }
            return ResponseUtil.buildSuccessResponse("Suppliers retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving suppliers.");
        }
    }

    @GET
    @Path("/{id}")
    public Response getSupplierById(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            Supplier s = em.find(Supplier.class, id);
            if (s == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Supplier not found.");
            }
            
            SupplierDTO dto = new SupplierDTO(
                s.getId(),
                s.getName(),
                s.getBrand().getId(),
                s.getBrand().getName(),
                s.getCategory().getId(),
                s.getCategory().getName(),
                s.getMobile(),
                s.getEmail()
            );
            return ResponseUtil.buildSuccessResponse("Supplier retrieved successfully", dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving supplier.");
        }
    }

    @POST
    @jakarta.transaction.Transactional
    public Response addSupplier(@HeaderParam("Authorization") String authHeader, SupplierDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty() || 
            dto.getBrandId() == null || dto.getCategoryId() == null || 
            dto.getMobile() == null || dto.getMobile().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Supplier name, brand, category, and mobile are required.");
        }

        try {
            Brand brand = em.find(Brand.class, dto.getBrandId());
            Category category = em.find(Category.class, dto.getCategoryId());

            if (brand == null || category == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid Brand or Category specified.");
            }

            Supplier s = new Supplier();
            
            // Get max ID + 1 since ID is BIGINT NOT NULL
            TypedQuery<Long> query = em.createQuery("SELECT COALESCE(MAX(sup.id), 0) FROM Supplier sup", Long.class);
            Long maxId = query.getSingleResult();
            s.setId(maxId + 1);

            s.setName(dto.getName().trim());
            s.setBrand(brand);
            s.setCategory(category);
            s.setMobile(dto.getMobile().trim());
            s.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");

            em.persist(s);

            dto.setId(s.getId());
            dto.setBrandName(brand.getName());
            dto.setCategoryName(category.getName());

            return ResponseUtil.buildSuccessResponse("Supplier created successfully", dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error creating supplier: " + e.getMessage());
        }
    }

    @PUT
    @Path("/{id}")
    @jakarta.transaction.Transactional
    public Response updateSupplier(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id, SupplierDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty() || 
            dto.getBrandId() == null || dto.getCategoryId() == null || 
            dto.getMobile() == null || dto.getMobile().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Supplier name, brand, category, and mobile are required.");
        }

        try {
            Supplier s = em.find(Supplier.class, id);
            if (s == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Supplier not found.");
            }

            Brand brand = em.find(Brand.class, dto.getBrandId());
            Category category = em.find(Category.class, dto.getCategoryId());

            if (brand == null || category == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Invalid Brand or Category specified.");
            }

            s.setName(dto.getName().trim());
            s.setBrand(brand);
            s.setCategory(category);
            s.setMobile(dto.getMobile().trim());
            s.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");

            em.merge(s);

            dto.setBrandName(brand.getName());
            dto.setCategoryName(category.getName());

            return ResponseUtil.buildSuccessResponse("Supplier updated successfully", dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error updating supplier: " + e.getMessage());
        }
    }

    @DELETE
    @Path("/{id}")
    @jakarta.transaction.Transactional
    public Response deleteSupplier(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        try {
            Supplier s = em.find(Supplier.class, id);
            if (s == null) {
                return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Supplier not found.");
            }

            em.remove(s);
            return ResponseUtil.buildSuccessResponse("Supplier deleted successfully", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error deleting supplier: " + e.getMessage());
        }
    }
}
