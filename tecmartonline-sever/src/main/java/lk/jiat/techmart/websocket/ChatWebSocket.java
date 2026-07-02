package lk.jiat.techmart.websocket;

import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import lk.jiat.techmart.dto.MessageDTO;
import lk.jiat.techmart.service.remote.MessageServiceRemote;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/chat/{userId}/{role}")
public class ChatWebSocket {

    private static final Map<Long, Session> userSessions = new ConcurrentHashMap<>();
    private static final Map<Long, String> userRoles = new ConcurrentHashMap<>();
    private static final Jsonb jsonb = JsonbBuilder.create();

    private MessageServiceRemote lookupMessageService() {
        try {
            javax.naming.InitialContext ctx = new javax.naming.InitialContext();
            return (MessageServiceRemote) ctx.lookup("java:global/tecmartonline-sever/MessageServiceBean!lk.jiat.techmart.service.remote.MessageServiceRemote");
        } catch (Exception e) {
            System.err.println("ChatWebSocket failed to lookup MessageServiceBean: " + e.getMessage());
            return null;
        }
    }

    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userIdStr, @PathParam("role") String role) {
        try {
            Long userId = Long.parseLong(userIdStr);
            userSessions.put(userId, session);
            userRoles.put(userId, role.toUpperCase());
            System.out.println("ChatWebSocket: User " + userId + " (" + role + ") connected via session " + session.getId());
        } catch (Exception e) {
            System.err.println("ChatWebSocket invalid connection parameters: " + e.getMessage());
            try {
                session.close();
            } catch (IOException ioException) {
                // ignore
            }
        }
    }

    @OnClose
    public void onClose(Session session, @PathParam("userId") String userIdStr) {
        try {
            Long userId = Long.parseLong(userIdStr);
            userSessions.remove(userId);
            userRoles.remove(userId);
            System.out.println("ChatWebSocket: User " + userId + " disconnected.");
        } catch (Exception e) {
            // ignore
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        try {
            MessageDTO dto = jsonb.fromJson(message, MessageDTO.class);
            MessageServiceRemote messageService = lookupMessageService();

            if (messageService == null) {
                System.err.println("ChatWebSocket error: MessageService EJB not available.");
                return;
            }

            // Persist message
            boolean success = messageService.sendMessage(dto);
            if (!success) {
                System.err.println("ChatWebSocket error: Failed to persist message.");
                return;
            }

            String jsonResponse = jsonb.toJson(dto);

            // 1. Direct Messaging (User to User)
            if (dto.getRecipientId() != null) {
                Session recipientSession = userSessions.get(dto.getRecipientId());
                if (recipientSession != null && recipientSession.isOpen()) {
                    recipientSession.getBasicRemote().sendText(jsonResponse);
                }
                
                // Also send back to sender for acknowledgement
                if (session.isOpen()) {
                    session.getBasicRemote().sendText(jsonResponse);
                }
            }
            // 2. Role Broadcasting (User to Role)
            else if (dto.getRecipientRole() != null) {
                String targetRole = dto.getRecipientRole().toUpperCase();
                for (Map.Entry<Long, Session> entry : userSessions.entrySet()) {
                    Long targetUserId = entry.getKey();
                    Session targetSession = entry.getValue();
                    String targetUserRole = userRoles.get(targetUserId);

                    if (targetSession.isOpen() && targetRole.equals(targetUserRole)) {
                        targetSession.getBasicRemote().sendText(jsonResponse);
                    }
                }
                
                // Also send back to sender if not already included
                if (session.isOpen() && !targetRole.equals(userRoles.get(dto.getSenderId()))) {
                    session.getBasicRemote().sendText(jsonResponse);
                }
            }
        } catch (Exception e) {
            System.err.println("ChatWebSocket error parsing message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @OnError
    public void onError(Throwable throwable, Session session) {
        System.err.println("ChatWebSocket error on session " + session.getId() + ": " + throwable.getMessage());
    }
}
