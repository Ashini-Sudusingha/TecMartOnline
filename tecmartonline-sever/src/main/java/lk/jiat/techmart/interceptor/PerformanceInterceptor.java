package lk.jiat.techmart.interceptor;

import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.InvocationContext;

public class PerformanceInterceptor {

    private static final long SLOW_METHOD_THRESHOLD_MS = 500;

    @AroundInvoke
    public Object measureExecutionTime(InvocationContext context) throws Exception {
        String className = context.getTarget().getClass().getName();
        String methodName = context.getMethod().getName();

        long startTime = System.currentTimeMillis();
        try {
            return context.proceed();
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("PERFORMANCE INTERCEPTOR: Method " + className + "." + methodName + "() took " + duration + " ms to execute.");
            if (duration > SLOW_METHOD_THRESHOLD_MS) {
                System.err.println("PERFORMANCE WARNING: Method " + className + "." + methodName + "() exceeded execution limit of " + SLOW_METHOD_THRESHOLD_MS + " ms.");
            }
        }
    }
}
