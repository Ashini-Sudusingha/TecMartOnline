package lk.jiat.techmart.rest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.entity.Warehouse;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/warehouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WarehouseResource {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

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
}
