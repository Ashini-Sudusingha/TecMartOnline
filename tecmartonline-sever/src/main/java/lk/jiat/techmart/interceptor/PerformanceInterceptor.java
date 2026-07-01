package lk.jiat.techmart.interceptor;

import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.InvocationContext;

public class PerformanceInterceptor {

    private static final long SLOW_METHOD_THRESHOLD_MS = 500;

    @jakarta.ejb.EJB
    private lk.jiat.techmart.service.singleton.PerformanceTrackerBean tracker;

    @AroundInvoke
    public Object measureExecutionTime(InvocationContext context) throws Exception {
        String className = context.getTarget().getClass().getName();
        String methodName = context.getMethod().getName();

        // Extract simple class name
        int lastDot = className.lastIndexOf('.');
        String simpleName = (lastDot != -1) ? className.substring(lastDot + 1) : className;

        long startTime = System.currentTimeMillis();
        try {
            return context.proceed();
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("PERFORMANCE INTERCEPTOR: Method " + simpleName + "." + methodName + "() took " + duration + " ms to execute.");
            
            if (tracker != null) {
                try {
                    tracker.recordMetric(simpleName, methodName, duration);
                } catch (Exception e) {
                    // Prevent circular interceptor calling loop if tracker itself is intercepted
                }
            }

            if (duration > SLOW_METHOD_THRESHOLD_MS) {
                System.err.println("PERFORMANCE WARNING: Method " + simpleName + "." + methodName + "() exceeded execution limit of " + SLOW_METHOD_THRESHOLD_MS + " ms.");
            }
        }
    }
}
