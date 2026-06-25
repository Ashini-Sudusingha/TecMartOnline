package lk.jiat.techmart.jms;

import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.JMSContext;
import jakarta.jms.Queue;

@ApplicationScoped
public class OrderProducer {

    @Inject
    private JMSContext context;

    @Resource(lookup = "jms/OrderQueue")
    private Queue queue;

    public void sendOrderMessage(String orderJson) {
        try {
            if (context != null && queue != null) {
                context.createProducer().send(queue, orderJson);
                System.out.println("JMS OrderProducer: Sent order message to jms/OrderQueue successfully.");
            } else {
                System.err.println("JMS OrderProducer: Context or Queue resource injection failed.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
