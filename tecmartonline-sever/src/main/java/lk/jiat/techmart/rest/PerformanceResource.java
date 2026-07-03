package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.service.singleton.PerformanceTrackerBean;
import lk.jiat.techmart.util.ResponseUtil;

@Path("/performance")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PerformanceResource {

    @EJB
    private PerformanceTrackerBean tracker;

    @GET
    @Path("/metrics")
    public Response getMetrics() {
        try {
            if (tracker == null) {
                return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Tracker Bean not loaded");
            }
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("metrics", tracker.getMetrics());
            data.put("cacheLookups", tracker.getCacheLookups());
            data.put("cacheHits", tracker.getCacheHits());
            data.put("ordersProcessed", tracker.getOrdersProcessed());
            
            // Calculate JVM server uptime
            long uptimeMs = java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime();
            long seconds = uptimeMs / 1000;
            long minutes = seconds / 60;
            long hours = minutes / 60;
            long days = hours / 24;
            String uptimeStr = String.format("%dd %dh %dm", days, hours % 24, minutes % 60);
            data.put("uptime", uptimeStr);
            data.put("uptimeMs", uptimeMs);
            
            // Mock connection pool and EJB pool statistics for UI presentation
            java.util.Map<String, Object> pool = new java.util.HashMap<>();
            pool.put("poolName", "TechMartPool");
            pool.put("activeConnections", 2);
            pool.put("idleConnections", 18);
            pool.put("maxSize", 100);
            data.put("connectionPool", pool);

            java.util.Map<String, Object> ejbPool = new java.util.HashMap<>();
            ejbPool.put("statelessInstances", 15);
            ejbPool.put("statefulInstances", 4);
            ejbPool.put("singletonInstances", 3);
            data.put("ejbPool", ejbPool);
            
            return ResponseUtil.buildSuccessResponse("Performance metrics loaded", data);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
