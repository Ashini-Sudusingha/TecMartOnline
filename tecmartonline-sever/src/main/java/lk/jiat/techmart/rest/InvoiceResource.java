package lk.jiat.techmart.rest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.entity.Invoice;
import lk.jiat.techmart.entity.Supplier;
import lk.jiat.techmart.dto.InvoiceDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;
import java.util.ArrayList;

@Path("/invoices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InvoiceResource {

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
    public Response getAllInvoices(@HeaderParam("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Missing or invalid Authorization header.");
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Token is invalid or expired.");
        }

        try {
            TypedQuery<Invoice> query = em.createQuery("SELECT i FROM Invoice i ORDER BY i.createdAt DESC", Invoice.class);
            List<Invoice> invoices = query.getResultList();
            
            List<InvoiceDTO> dtos = new ArrayList<>();
            for (Invoice i : invoices) {
                dtos.add(new InvoiceDTO(
                    i.getId(),
                    i.getSupplier().getId(),
                    i.getSupplier().getName(),
                    i.getTotalAmount(),
                    i.getCreatedAt() != null ? i.getCreatedAt().getTime() : null
                ));
            }
            return ResponseUtil.buildSuccessResponse("Invoices retrieved successfully", dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error retrieving invoices.");
        }
    }

    @POST
    @jakarta.transaction.Transactional
    public Response addInvoice(@HeaderParam("Authorization") String authHeader, InvoiceDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getSupplierId() == null || dto.getTotalAmount() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Supplier ID and valid total amount are required.");
        }

        try {
            Supplier supplier = em.find(Supplier.class, dto.getSupplierId());
            if (supplier == null) {
                return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Supplier not found.");
            }

            Invoice invoice = new Invoice();
            
            // Get max ID + 1 since ID is BIGINT NOT NULL
            TypedQuery<Long> query = em.createQuery("SELECT COALESCE(MAX(i.id), 0) FROM Invoice i", Long.class);
            Long maxId = query.getSingleResult();
            invoice.setId(maxId + 1);

            invoice.setSupplier(supplier);
            invoice.setTotalAmount(dto.getTotalAmount());
            invoice.setCreatedAt(new java.util.Date());

            em.persist(invoice);

            dto.setId(invoice.getId());
            dto.setSupplierName(supplier.getName());
            dto.setCreatedAt(invoice.getCreatedAt() != null ? invoice.getCreatedAt().getTime() : null);

            return ResponseUtil.buildSuccessResponse("Invoice created successfully", dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Database error creating invoice: " + e.getMessage());
        }
    }
}
