package lk.jiat.techmart.mdb;

import jakarta.ejb.ActivationConfigProperty;
import jakarta.ejb.MessageDriven;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.TextMessage;

@MessageDriven(activationConfig = {
    @ActivationConfigProperty(propertyName = "destinationLookup", propertyValue = "jms/InventoryTopic"),
    @ActivationConfigProperty(propertyName = "destinationType", propertyValue = "jakarta.jms.Topic")
})
public class NotificationMDB implements MessageListener {

    @Override
    public void onMessage(Message message) {
        try {
            if (message instanceof TextMessage) {
                TextMessage textMessage = (TextMessage) message;
                String stockUpdateJson = textMessage.getText();
                System.out.println("MDB NotificationMDB: Received stock update topic message: " + stockUpdateJson);
                // Broadcast to administrators via WebSocket
                lk.jiat.techmart.websocket.InventoryWebSocket.broadcast(stockUpdateJson);
            } else {
                System.err.println("MDB NotificationMDB: Received unsupported message type.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
