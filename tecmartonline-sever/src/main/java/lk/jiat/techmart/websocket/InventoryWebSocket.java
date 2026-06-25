package lk.jiat.techmart.websocket;

import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@ServerEndpoint("/ws/inventory")
public class InventoryWebSocket {

    private static final Set<Session> clients = Collections.synchronizedSet(new HashSet<>());

    @OnOpen
    public void onOpen(Session session) {
        clients.add(session);
        System.out.println("InventoryWebSocket client connected: " + session.getId());
    }

    @OnClose
    public void onClose(Session session) {
        clients.remove(session);
        System.out.println("InventoryWebSocket client disconnected: " + session.getId());
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("InventoryWebSocket received message from client " + session.getId() + ": " + message);
    }

    @OnError
    public void onError(Throwable throwable, Session session) {
        System.err.println("InventoryWebSocket error for client " + session.getId() + ": " + throwable.getMessage());
    }

    public static void broadcast(String message) {
        synchronized (clients) {
            for (Session client : clients) {
                if (client.isOpen()) {
                    try {
                        client.getBasicRemote().sendText(message);
                    } catch (IOException e) {
                        System.err.println("InventoryWebSocket broadcast failed for client " + client.getId());
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}
