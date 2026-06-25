package lk.jiat.techmart.mdb;

import jakarta.ejb.ActivationConfigProperty;
import jakarta.ejb.MessageDriven;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.TextMessage;

@MessageDriven(activationConfig = {
    @ActivationConfigProperty(propertyName = "destinationLookup", propertyValue = "jms/OrderQueue"),
    @ActivationConfigProperty(propertyName = "destinationType", propertyValue = "jakarta.jms.Queue")
})
public class OrderProcessorMDB implements MessageListener {

    @Override
    public void onMessage(Message message) {
        try {
            if (message instanceof TextMessage) {
                TextMessage textMessage = (TextMessage) message;
                String orderJson = textMessage.getText();
                System.out.println("MDB OrderProcessorMDB: Received order message to process async: " + orderJson);
                // Perform order verification, stock deduction, and status updates here...
            } else {
                System.err.println("MDB OrderProcessorMDB: Received unsupported message type.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
