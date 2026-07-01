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
import lk.jiat.techmart.dto.BrandDTO;
import lk.jiat.techmart.dto.CategoryDTO;
import lk.jiat.techmart.dto.ColorDTO;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.ProductServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @EJB
    private ProductServiceRemote productService;

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

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

    @GET
    @Path("/categories")
    public Response getAllCategories() {
        return ResponseUtil.buildSuccessResponse("Categories retrieved successfully", productService.getAllCategories());
    }

    @GET
    @Path("/brands")
    public Response getAllBrands() {
        return ResponseUtil.buildSuccessResponse("Brands retrieved successfully", productService.getAllBrands());
    }

    @GET
    @Path("/colors")
    public Response getAllColors() {
        return ResponseUtil.buildSuccessResponse("Colors retrieved successfully", productService.getAllColors());
    }

    @POST
    @Path("/categories")
    public Response addCategory(@HeaderParam("Authorization") String authHeader, CategoryDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Category name is required.");
        }

        boolean success = productService.addCategory(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Category created successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.CONFLICT, "Category already exists or creation failed.");
        }
    }

    @POST
    @Path("/brands")
    public Response addBrand(@HeaderParam("Authorization") String authHeader, BrandDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Brand name is required.");
        }

        boolean success = productService.addBrand(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Brand created successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.CONFLICT, "Brand already exists or creation failed.");
        }
    }

    @POST
    @Path("/colors")
    public Response addColor(@HeaderParam("Authorization") String authHeader, ColorDTO dto) {
        Response authResponse = checkAdmin(authHeader);
        if (authResponse != null) return authResponse;

        if (dto == null || dto.getColor() == null || dto.getColor().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Color name is required.");
        }

        boolean success = productService.addColor(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Color created successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.CONFLICT, "Color already exists or creation failed.");
        }
    }

    @GET
    @Path("/images/{filename}")
    @Produces({"image/png", "image/jpeg", "image/gif", "image/webp", "application/octet-stream"})
    public Response getProductImage(@PathParam("filename") String filename) {
        System.out.println("DEBUG IMAGE: filename received = '" + filename + "'");
        String homeDir = System.getProperty("user.home");
        java.io.File file = new java.io.File(homeDir + "/techmart_uploads", filename);
        System.out.println("DEBUG IMAGE: absolute path = '" + file.getAbsolutePath() + "'");
        System.out.println("DEBUG IMAGE: file.exists() = " + file.exists());

        if (!file.exists()) {
            System.out.println("DEBUG IMAGE: file does not exist, returning 404");
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        System.out.println("DEBUG IMAGE: extension = '" + ext + "'");
        String mediaType = "image/png";
        if (ext.equals("jpg") || ext.equals("jpeg")) {
            mediaType = "image/jpeg";
        } else if (ext.equals("gif")) {
            mediaType = "image/gif";
        } else if (ext.equals("webp")) {
            mediaType = "image/webp";
        }
        System.out.println("DEBUG IMAGE: mediaType determined = '" + mediaType + "'");
        
        try {
            byte[] data = java.nio.file.Files.readAllBytes(file.toPath());
            System.out.println("DEBUG IMAGE: read bytes count = " + data.length);
            return Response.ok(data).type(mediaType).build();
        } catch (Exception e) {
            System.out.println("DEBUG IMAGE: exception thrown!");
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
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
