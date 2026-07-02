package lk.jiat.techmart.rest;

import jakarta.ejb.EJB;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import lk.jiat.techmart.dto.MessageDTO;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.security.JWTUtil;
import lk.jiat.techmart.service.remote.MessageServiceRemote;
import lk.jiat.techmart.util.ResponseUtil;

import java.util.List;

@Path("/messages")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MessageResource {

    @EJB
    private MessageServiceRemote messageService;

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        if (JWTUtil.validateToken(token) == null) {
            return null;
        }
        String email = JWTUtil.getSubject(token);
        try {
            return em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                     .setParameter("email", email)
                     .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    @POST
    public Response sendMessage(@HeaderParam("Authorization") String authHeader, MessageDTO dto) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Unauthorized user.");
        }

        if (dto == null || dto.getMessageText() == null || dto.getMessageText().trim().isEmpty()) {
            return ResponseUtil.buildErrorResponse(Status.BAD_REQUEST, "Message text cannot be empty.");
        }

        dto.setSenderId(user.getId());
        boolean success = messageService.sendMessage(dto);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Message sent successfully", dto);
        } else {
            return ResponseUtil.buildErrorResponse(Status.INTERNAL_SERVER_ERROR, "Failed to send message.");
        }
    }

    @GET
    @Path("/direct/{otherUserId}")
    public Response getDirectMessages(@HeaderParam("Authorization") String authHeader, @PathParam("otherUserId") Long otherUserId) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Unauthorized user.");
        }

        List<MessageDTO> history = messageService.getDirectMessages(user.getId(), otherUserId);
        return ResponseUtil.buildSuccessResponse("Chat history retrieved successfully", history);
    }

    @GET
    @Path("/role/{roleName}")
    public Response getRoleMessages(@HeaderParam("Authorization") String authHeader, @PathParam("roleName") String roleName) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Unauthorized user.");
        }

        List<MessageDTO> history = messageService.getRoleMessages(roleName);
        return ResponseUtil.buildSuccessResponse("Role broadcast history retrieved successfully", history);
    }

    @GET
    @Path("/conversations")
    public Response getConversations(@HeaderParam("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Unauthorized user.");
        }

        List<UserDTO> contacts = messageService.getConversations(user.getId());
        return ResponseUtil.buildSuccessResponse("Active conversations contacts retrieved", contacts);
    }

    @PUT
    @Path("/{messageId}/read")
    public Response markAsRead(@HeaderParam("Authorization") String authHeader, @PathParam("messageId") Long messageId) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseUtil.buildErrorResponse(Status.UNAUTHORIZED, "Unauthorized user.");
        }

        boolean success = messageService.markAsRead(messageId);
        if (success) {
            return ResponseUtil.buildSuccessResponse("Message marked as read", null);
        } else {
            return ResponseUtil.buildErrorResponse(Status.NOT_FOUND, "Message not found.");
        }
    }
}
