package lk.jiat.techmart.service.singleton;

import jakarta.ejb.ConcurrencyManagement;
import jakarta.ejb.ConcurrencyManagementType;
import jakarta.ejb.Lock;
import jakarta.ejb.LockType;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Singleton
@Startup
@ConcurrencyManagement(ConcurrencyManagementType.CONTAINER)
public class PerformanceTrackerBean {

    private final List<MethodMetric> metrics = Collections.synchronizedList(new ArrayList<>());
    private int cacheLookups = 0;
    private int cacheHits = 0;
    private int ordersProcessed = 0;

    public static class MethodMetric implements Serializable {
        private static final long serialVersionUID = 1L;
        private String className;
        private String methodName;
        private long durationMs;
        private long timestamp;

        public MethodMetric(String className, String methodName, long durationMs, long timestamp) {
            this.className = className;
            this.methodName = methodName;
            this.durationMs = durationMs;
            this.timestamp = timestamp;
        }

        public String getClassName() { return className; }
        public String getMethodName() { return methodName; }
        public long getDurationMs() { return durationMs; }
        public long getTimestamp() { return timestamp; }
    }

    @Lock(LockType.WRITE)
    public void recordMetric(String className, String methodName, long durationMs) {
        if (metrics.size() > 50) {
            metrics.remove(0);
        }
        metrics.add(new MethodMetric(className, methodName, durationMs, System.currentTimeMillis()));
    }

    @Lock(LockType.READ)
    public List<MethodMetric> getMetrics() {
        return new ArrayList<>(metrics);
    }

    @Lock(LockType.WRITE)
    public void recordCacheLookup(boolean hit) {
        cacheLookups++;
        if (hit) {
            cacheHits++;
        }
    }

    @Lock(LockType.READ)
    public int getCacheLookups() { return cacheLookups; }

    @Lock(LockType.READ)
    public int getCacheHits() { return cacheHits; }

    @Lock(LockType.WRITE)
    public void recordOrderProcessed() {
        ordersProcessed++;
    }

    @Lock(LockType.READ)
    public int getOrdersProcessed() { return ordersProcessed; }
}
