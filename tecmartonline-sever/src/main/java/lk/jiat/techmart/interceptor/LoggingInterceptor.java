package lk.jiat.techmart.interceptor;

import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.InvocationContext;
import java.util.Arrays;

public class LoggingInterceptor {

    @AroundInvoke
    public Object logMethodInvocation(InvocationContext context) throws Exception {
        String className = context.getTarget().getClass().getName();
        String methodName = context.getMethod().getName();
        Object[] parameters = context.getParameters();

        System.out.println("LOGGING INTERCEPTOR: Entering: " + className + "." + methodName + "() with parameters: " + Arrays.toString(parameters));

        try {
            Object result = context.proceed();
            System.out.println("LOGGING INTERCEPTOR: Exiting: " + className + "." + methodName + "() returning: " + result);
            return result;
        } catch (Exception e) {
            System.err.println("LOGGING INTERCEPTOR: Exception thrown in: " + className + "." + methodName + "(): " + e.getMessage());
            throw e;
        }
    }
}
