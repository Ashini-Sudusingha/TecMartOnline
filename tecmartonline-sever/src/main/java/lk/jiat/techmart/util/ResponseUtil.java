package lk.jiat.techmart.util;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.util.HashMap;
import java.util.Map;

public class ResponseUtil {

    public static Response buildSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        return Response.ok(response).build();
    }

    public static Response buildErrorResponse(Status status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return Response.status(status).entity(response).build();
    }

    public static Response buildErrorResponse(int statusCode, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return Response.status(statusCode).entity(response).build();
    }
}
