package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.ProductDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.ProductServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @EJB
    private ProductServiceRemote productService;

    @GET
    public Response getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseUtil.buildSuccessResponse("Products retrieved successfully", products);
    }

    @GET
    @Path("/{id}")
    public Response getProductById(@PathParam("id") Long id) {
        ProductDTO product = productService.getProductById(id);
        if (product != null) {
            return ResponseUtil.buildSuccessResponse("Product retrieved successfully", product);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Product not found.");
        }
    }

    @POST
    public Response addProduct(@HeaderParam("Authorization") String authHeader, ProductDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getPrice() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Required product fields are missing or invalid.");
        }

        boolean success = productService.addProduct(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Product created successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Failed to create product.");
        }
    }

    @PUT
    public Response updateProduct(@HeaderParam("Authorization") String authHeader, ProductDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getId() == null || dto.getName() == null || dto.getPrice() <= 0) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Product ID and required fields are missing.");
        }

        boolean success = productService.updateProduct(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Product updated successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Product not found or update failed.");
        }
    }

    @DELETE
    @Path("/{id}")
    public Response deleteProduct(@HeaderParam("Authorization") String authHeader, @PathParam("id") Long id) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        boolean success = productService.deleteProduct(id);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Product deleted successfully", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Product not found or deletion failed.");
        }
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
