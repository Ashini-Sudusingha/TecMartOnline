package lk.jiat.techmart.async;

import jakarta.ejb.AsyncResult;
import jakarta.ejb.Asynchronous;
import jakarta.ejb.Stateless;
import java.util.concurrent.Future;

@Stateless
public class EmailService {

    @Asynchronous
    public Future<Boolean> sendEmailAsync(String to, String subject, String body) {
        try {
            System.out.println("EmailService: Starting asynchronous email transmission to " + to);
            // Simulate slow email sending network call
            Thread.sleep(3000); 
            System.out.println("EmailService: Email sent successfully to " + to);
            return new AsyncResult<>(true);
        } catch (InterruptedException e) {
            System.err.println("EmailService: Email transmission interrupted to " + to);
            Thread.currentThread().interrupt();
            return new AsyncResult<>(false);
        } catch (Exception e) {
            e.printStackTrace();
            return new AsyncResult<>(false);
        }
    }
}
