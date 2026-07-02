package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.MessageDTO;
import lk.jiat.techmart.dto.UserDTO;
import lk.jiat.techmart.entity.Message;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import lk.jiat.techmart.service.remote.MessageServiceRemote;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class MessageServiceBean implements MessageServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public boolean sendMessage(MessageDTO dto) {
        try {
            User sender = em.find(User.class, dto.getSenderId());
            if (sender == null) {
                return false;
            }

            Message message = new Message();
            message.setSender(sender);

            if (dto.getRecipientId() != null) {
                User recipient = em.find(User.class, dto.getRecipientId());
                if (recipient != null) {
                    message.setRecipient(recipient);
                }
            }

            message.setRecipientRole(dto.getRecipientRole());
            message.setMessageText(dto.getMessageText());
            message.setSentAt(new Date());
            message.setIsRead(false);

            em.persist(message);
            dto.setId(message.getId());
            dto.setSentAt(message.getSentAt().getTime());
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<MessageDTO> getDirectMessages(Long userId1, Long userId2) {
        try {
            TypedQuery<Message> query = em.createQuery(
                "SELECT m FROM Message m WHERE " +
                "(m.sender.id = :u1 AND m.recipient.id = :u2) OR " +
                "(m.sender.id = :u2 AND m.recipient.id = :u1) " +
                "ORDER BY m.sentAt ASC", Message.class);
            query.setParameter("u1", userId1);
            query.setParameter("u2", userId2);

            return query.getResultList().stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<MessageDTO> getRoleMessages(String roleName) {
        try {
            TypedQuery<Message> query = em.createQuery(
                "SELECT m FROM Message m WHERE m.recipientRole = :role ORDER BY m.sentAt ASC", Message.class);
            query.setParameter("role", roleName);

            return query.getResultList().stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<UserDTO> getConversations(Long userId) {
        try {
            TypedQuery<User> query = em.createQuery(
                "SELECT DISTINCT u FROM User u WHERE u.id IN (" +
                "  SELECT m.recipient.id FROM Message m WHERE m.sender.id = :uid AND m.recipient.id IS NOT NULL" +
                "  UNION" +
                "  SELECT m.sender.id FROM Message m WHERE m.recipient.id = :uid" +
                ") AND u.id != :uid", User.class);
            query.setParameter("uid", userId);

            return query.getResultList().stream().map(u -> new UserDTO(
                u.getId(),
                u.getFname(),
                u.getLname(),
                u.getEmail(),
                u.getMobile(),
                u.getRole().getName()
            )).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean markAsRead(Long messageId) {
        try {
            Message message = em.find(Message.class, messageId);
            if (message != null) {
                message.setIsRead(true);
                em.merge(message);
                return true;
            }
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private MessageDTO convertToDTO(Message m) {
        MessageDTO dto = new MessageDTO();
        dto.setId(m.getId());
        dto.setSenderId(m.getSender().getId());
        dto.setSenderName(m.getSender().getFname() + " " + m.getSender().getLname());
        dto.setSenderRole(m.getSender().getRole().getName());
        
        if (m.getRecipient() != null) {
            dto.setRecipientId(m.getRecipient().getId());
            dto.setRecipientName(m.getRecipient().getFname() + " " + m.getRecipient().getLname());
            dto.setRecipientRole(m.getRecipient().getRole().getName());
        }
        
        dto.setRecipientRole(m.getRecipientRole());
        dto.setMessageText(m.getMessageText());
        dto.setSentAt(m.getSentAt().getTime());
        dto.setIsRead(m.isIsRead());
        return dto;
    }
}
