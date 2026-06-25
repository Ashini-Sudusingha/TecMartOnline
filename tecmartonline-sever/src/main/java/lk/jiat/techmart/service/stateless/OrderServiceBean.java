package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.OrderDTO;
import lk.jiat.techmart.entity.*;
import lk.jiat.techmart.service.remote.OrderServiceRemote;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class OrderServiceBean implements OrderServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public boolean placeOrder(Long userId, Long addressId, int paymentMethodId, double total, double subtotal) {
        try {
            User user = em.find(User.class, userId);
            UserAddress address = em.find(UserAddress.class, addressId);
            PaymentMethod method = em.find(PaymentMethod.class, paymentMethodId);

            if (user == null || address == null || method == null) {
                return false;
            }

            // Find default status (e.g. Processing or Pending, let's look up or create)
            TypedQuery<Status> statusQuery = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", Status.class);
            statusQuery.setParameter("name", "Processing");
            Status status;
            try {
                status = statusQuery.getSingleResult();
            } catch (Exception e) {
                status = new Status();
                status.setName("Processing");
                em.persist(status);
            }

            // Find default payment status (Pending)
            TypedQuery<PaymentStatus> payQuery = em.createQuery("SELECT ps FROM PaymentStatus ps WHERE ps.status = :status", PaymentStatus.class);
            payQuery.setParameter("status", "Pending");
            PaymentStatus paymentStatus;
            try {
                paymentStatus = payQuery.getSingleResult();
            } catch (Exception e) {
                paymentStatus = new PaymentStatus();
                paymentStatus.setStatus("Pending");
                em.persist(paymentStatus);
            }

            // Find default shipping amount (e.g. free or 10.0)
            ShippingAmount shipping = em.find(ShippingAmount.class, 1);
            if (shipping == null) {
                shipping = new ShippingAmount();
                shipping.setId(1);
                shipping.setAmount(10.0);
                em.persist(shipping);
            }

            Order order = new Order();
            order.setId(System.currentTimeMillis());
            order.setUser(user);
            order.setUserAddress(address);
            order.setPaymentMethod(method);
            order.setStatus(status);
            order.setPaymentStatus(paymentStatus);
            order.setShippingAmount(shipping);
            order.setTotalAmount(total);
            order.setSubtotal(subtotal);
            order.setCreatedAt(new Date());

            em.persist(order);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(Long userId) {
        try {
            TypedQuery<Order> query = em.createQuery("SELECT o FROM Order o WHERE o.user.id = :userId", Order.class);
            query.setParameter("userId", userId);
            List<Order> orders = query.getResultList();
            return orders.stream().map(o -> {
                OrderDTO dto = new OrderDTO();
                dto.setId(o.getId());
                dto.setTotalAmount(o.getTotalAmount());
                dto.setSubtotal(o.getSubtotal());
                dto.setCreatedAt(o.getCreatedAt());
                dto.setStatus(o.getStatus().getName());
                dto.setPaymentStatus(o.getPaymentStatus().getStatus());
                dto.setPaymentMethod(o.getPaymentMethod().getName());
                return dto;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
