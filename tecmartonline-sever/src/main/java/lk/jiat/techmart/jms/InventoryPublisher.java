package lk.jiat.techmart.jms;

import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.JMSContext;
import jakarta.jms.Topic;

@ApplicationScoped
public class InventoryPublisher {

    @Inject
    private JMSContext context;

    @Resource(lookup = "jms/InventoryTopic")
    private Topic topic;

    public void publishInventoryUpdate(String stockUpdateJson) {
        try {
            if (context != null && topic != null) {
                context.createProducer().send(topic, stockUpdateJson);
                System.out.println("JMS InventoryPublisher: Published stock update message to jms/InventoryTopic.");
            } else {
                System.err.println("JMS InventoryPublisher: Context or Topic resource injection failed.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
