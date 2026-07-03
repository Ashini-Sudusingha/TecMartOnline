package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.OrderDTO;
import lk.jiat.techmart.dto.OrderItemDTO;
import lk.jiat.techmart.dto.PickListDTO;
import lk.jiat.techmart.dto.PickListRequestDTO;
import lk.jiat.techmart.dto.PackingItemDTO;
import lk.jiat.techmart.dto.PackItemRequestDTO;
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

    @jakarta.ejb.EJB
    private lk.jiat.techmart.async.EmailService emailService;

    @Override
    public boolean placeOrder(lk.jiat.techmart.dto.OrderRequestDTO orderRequest) {
        try {
            User user = em.find(User.class, orderRequest.getUserId());
            UserAddress address = em.find(UserAddress.class, orderRequest.getAddressId());
            PaymentMethod method = em.find(PaymentMethod.class, orderRequest.getPaymentMethodId());

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
            order.setTotalAmount(orderRequest.getTotal());
            order.setSubtotal(orderRequest.getSubtotal());
            order.setCreatedAt(new Date());

            em.persist(order);

            // Process order items and block quantities
            if (orderRequest.getItems() != null) {
                for (lk.jiat.techmart.dto.OrderRequestDTO.OrderItemRequestDTO itemDto : orderRequest.getItems()) {
                    Product product = em.find(Product.class, itemDto.getProductId());
                    if (product != null) {
                        // 1. Create and persist OrderItem record
                        OrderItem orderItem = new OrderItem();
                        orderItem.setOrder(order);
                        orderItem.setProduct(product);
                        orderItem.setQuantity(itemDto.getQuantity());
                        orderItem.setSellingPrice(itemDto.getPrice());
                        em.persist(orderItem);

                        // 2. Add quantity to product's blockQty
                        product.setBlockQty(product.getBlockQty() + itemDto.getQuantity());
                        em.merge(product);
                    }
                }
            }

            // Broadcast order placement to live WebSocket clients
            try {
                String customer = user.getFname() + " " + user.getLname();
                String wsMsg = String.format(
                    "{\"type\": \"order\", \"orderId\": %d, \"customerName\": \"%s\", \"totalAmount\": %.2f}",
                    order.getId(),
                    customer,
                    order.getTotalAmount()
                );
                lk.jiat.techmart.websocket.InventoryWebSocket.broadcast(wsMsg);
            } catch (Exception e) {
                System.err.println("Failed to broadcast order notification: " + e.getMessage());
            }

            // Asynchronously dispatch email notification
            try {
                emailService.sendEmailAsync(user.getEmail(), "Order Confirmation - TechMart", "Hi " + user.getFname() + ", your order #" + order.getId() + " has been successfully submitted and is being processed.");
            } catch (Exception e) {
                System.err.println("EmailService invocation failed: " + e.getMessage());
            }

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

            List<Long> assignedIds = em.createQuery(
                "SELECT plo.order.id FROM PickListOrder plo", Long.class).getResultList();

            return orders.stream().map(o -> {
                OrderDTO dto = new OrderDTO();
                dto.setId(o.getId());
                dto.setTotalAmount(o.getTotalAmount());
                dto.setSubtotal(o.getSubtotal());
                dto.setCreatedAt(o.getCreatedAt());
                dto.setStatus(o.getStatus().getName());
                dto.setPaymentStatus(o.getPaymentStatus().getStatus());
                dto.setPaymentMethod(o.getPaymentMethod().getName());
                dto.setAssignedToPicklist(assignedIds.contains(o.getId()));
                return dto;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<OrderDTO> getAllOrders() {
        try {
            TypedQuery<Order> query = em.createQuery("SELECT o FROM Order o ORDER BY o.createdAt DESC", Order.class);
            List<Order> orders = query.getResultList();

            List<Long> assignedIds = em.createQuery(
                "SELECT plo.order.id FROM PickListOrder plo", Long.class).getResultList();

            return orders.stream().map(o -> {
                OrderDTO dto = new OrderDTO();
                dto.setId(o.getId());
                dto.setTotalAmount(o.getTotalAmount());
                dto.setSubtotal(o.getSubtotal());
                dto.setCreatedAt(o.getCreatedAt());
                dto.setStatus(o.getStatus().getName());
                dto.setPaymentStatus(o.getPaymentStatus().getStatus());
                dto.setPaymentMethod(o.getPaymentMethod().getName());
                if (o.getUser() != null) {
                    dto.setCustomerName(o.getUser().getFname() + " " + o.getUser().getLname());
                } else {
                    dto.setCustomerName("Guest");
                }
                dto.setAssignedToPicklist(assignedIds.contains(o.getId()));
                return dto;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<OrderItemDTO> getOrderItems(Long orderId) {
        try {
            TypedQuery<OrderItem> query = em.createQuery(
                "SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId", OrderItem.class);
            query.setParameter("orderId", orderId);
            List<OrderItem> items = query.getResultList();
            return items.stream().map(oi -> new OrderItemDTO(
                oi.getProduct().getId(),
                oi.getProduct().getName(),
                oi.getQuantity(),
                oi.getSellingPrice()
            )).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean createPickList(PickListRequestDTO request) {
        try {
            User user = em.find(User.class, request.getUserId());
            Warehouse warehouse = em.find(Warehouse.class, request.getWarehouseId());
            if (user == null || warehouse == null) return false;

            PickList pickList = new PickList();
            pickList.setUser(user);
            pickList.setWarehouse(warehouse);
            pickList.setCreatedAt(new Date());
            em.persist(pickList);

            // Fetch a Status for PickListOrder
            TypedQuery<Status> statusQuery = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", Status.class);
            statusQuery.setParameter("name", "Processing");
            List<Status> statuses = statusQuery.getResultList();
            Status status = null;
            if (!statuses.isEmpty()) {
                status = statuses.get(0);
            } else {
                statusQuery.setParameter("name", "Pending");
                statuses = statusQuery.getResultList();
                if (!statuses.isEmpty()) {
                    status = statuses.get(0);
                } else {
                    status = em.find(Status.class, 1L);
                }
            }

            int index = 0;
            for (Long orderId : request.getOrderIds()) {
                Order order = em.find(Order.class, orderId);
                if (order != null) {
                    PickListOrder plo = new PickListOrder();
                    plo.setId(System.currentTimeMillis() + (index++));
                    plo.setPickList(pickList);
                    plo.setOrder(order);
                    plo.setStatus(status);
                    em.persist(plo);

                    if (status != null) {
                        order.setStatus(status);
                        em.merge(order);
                    }
                }
            }

            // Broadcast a Live Message via WebSocket to all connected clients!
            try {
                String wsMsg = String.format(
                    "{\"type\": \"picklist\", \"picklistId\": %d, \"warehouseId\": %d, \"warehouseName\": \"%s\", \"ordersCount\": %d}",
                    pickList.getId(),
                    warehouse.getId(),
                    warehouse.getName(),
                    request.getOrderIds().size()
                );
                lk.jiat.techmart.websocket.InventoryWebSocket.broadcast(wsMsg);
            } catch (Exception e) {
                System.err.println("Failed to broadcast picklist notification: " + e.getMessage());
            }

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<PickListDTO> getPickListsByWarehouseId(Long warehouseId) {
        try {
            TypedQuery<PickList> query = em.createQuery(
                "SELECT pl FROM PickList pl WHERE pl.warehouse.id = :warehouseId ORDER BY pl.id DESC", PickList.class);
            query.setParameter("warehouseId", warehouseId);
            List<PickList> pickLists = query.getResultList();

            List<PickListDTO> dtos = new ArrayList<>();
            for (PickList pl : pickLists) {
                String userName = pl.getUser() != null ? pl.getUser().getFname() + " " + pl.getUser().getLname() : "Admin";
                PickListDTO dto = new PickListDTO(
                    pl.getId(),
                    userName,
                    pl.getWarehouse().getName(),
                    pl.getCreatedAt()
                );

                TypedQuery<Order> ordersQuery = em.createQuery(
                    "SELECT plo.order FROM PickListOrder plo WHERE plo.pickList.id = :plId", Order.class);
                ordersQuery.setParameter("plId", pl.getId());
                List<Order> orders = ordersQuery.getResultList();

                List<OrderDTO> orderDTOs = orders.stream().map(o -> {
                    OrderDTO odto = new OrderDTO();
                    odto.setId(o.getId());
                    odto.setTotalAmount(o.getTotalAmount());
                    odto.setSubtotal(o.getSubtotal());
                    odto.setCreatedAt(o.getCreatedAt());
                    odto.setStatus(o.getStatus().getName());
                    odto.setPaymentStatus(o.getPaymentStatus().getStatus());
                    odto.setPaymentMethod(o.getPaymentMethod().getName());
                    if (o.getUser() != null) {
                        odto.setCustomerName(o.getUser().getFname() + " " + o.getUser().getLname());
                    } else {
                        odto.setCustomerName("Guest");
                    }
                    return odto;
                }).collect(Collectors.toList());

                dto.setOrders(orderDTOs);
                dtos.add(dto);
            }
            return dtos;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<PickListDTO> getAllPickLists() {
        try {
            TypedQuery<PickList> query = em.createQuery(
                "SELECT pl FROM PickList pl ORDER BY pl.id DESC", PickList.class);
            List<PickList> pickLists = query.getResultList();

            List<PickListDTO> dtos = new ArrayList<>();
            for (PickList pl : pickLists) {
                String userName = pl.getUser() != null ? pl.getUser().getFname() + " " + pl.getUser().getLname() : "Admin";
                PickListDTO dto = new PickListDTO(
                    pl.getId(),
                    userName,
                    pl.getWarehouse().getName(),
                    pl.getCreatedAt()
                );

                TypedQuery<Order> ordersQuery = em.createQuery(
                    "SELECT plo.order FROM PickListOrder plo WHERE plo.pickList.id = :plId", Order.class);
                ordersQuery.setParameter("plId", pl.getId());
                List<Order> orders = ordersQuery.getResultList();

                List<OrderDTO> orderDTOs = orders.stream().map(o -> {
                    OrderDTO odto = new OrderDTO();
                    odto.setId(o.getId());
                    odto.setTotalAmount(o.getTotalAmount());
                    odto.setSubtotal(o.getSubtotal());
                    odto.setCreatedAt(o.getCreatedAt());
                    odto.setStatus(o.getStatus().getName());
                    odto.setPaymentStatus(o.getPaymentStatus().getStatus());
                    odto.setPaymentMethod(o.getPaymentMethod().getName());
                    if (o.getUser() != null) {
                        odto.setCustomerName(o.getUser().getFname() + " " + o.getUser().getLname());
                    } else {
                        odto.setCustomerName("Guest");
                    }
                    odto.setAssignedToPicklist(true);
                    return odto;
                }).collect(Collectors.toList());

                dto.setOrders(orderDTOs);
                dtos.add(dto);
            }
            return dtos;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public List<PackingItemDTO> getPackingDetails(Long picklistId) {
        try {
            PickList pl = em.find(PickList.class, picklistId);
            if (pl == null) {
                return new ArrayList<>();
            }
            Long warehouseId = pl.getWarehouse().getId();

            TypedQuery<PickListOrder> ploQuery = em.createQuery(
                "SELECT plo FROM PickListOrder plo WHERE plo.pickList.id = :picklistId", PickListOrder.class);
            ploQuery.setParameter("picklistId", picklistId);
            List<PickListOrder> plos = ploQuery.getResultList();

            List<PackingItemDTO> dtos = new ArrayList<>();
            for (PickListOrder plo : plos) {
                Order order = plo.getOrder();
                
                TypedQuery<OrderItem> oiQuery = em.createQuery(
                    "SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId", OrderItem.class);
                oiQuery.setParameter("orderId", order.getId());
                List<OrderItem> ois = oiQuery.getResultList();

                for (OrderItem oi : ois) {
                    // Check if already packed
                    TypedQuery<Long> countQuery = em.createQuery(
                        "SELECT COUNT(it) FROM InventoryTransfer it WHERE it.pickListOrder.id = :ploId AND it.orderItem.id = :oiId", Long.class);
                    countQuery.setParameter("ploId", plo.getId());
                    countQuery.setParameter("oiId", oi.getId());
                    boolean packed = countQuery.getSingleResult() > 0;

                    PackingItemDTO dto = new PackingItemDTO(
                        oi.getId(),
                        order.getId(),
                        oi.getProduct().getId().longValue(),
                        oi.getProduct().getName(),
                        oi.getQuantity(),
                        packed
                    );

                    // Find inventory slots in this warehouse
                    TypedQuery<Inventory> invQuery = em.createQuery(
                        "SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.warehouse.id = :warehouseId AND i.stockQuantity > 0", Inventory.class);
                    invQuery.setParameter("productId", oi.getProduct().getId());
                    invQuery.setParameter("warehouseId", warehouseId);
                    List<Inventory> inventories = invQuery.getResultList();

                    List<PackingItemDTO.InventorySlot> slots = new ArrayList<>();
                    for (Inventory i : inventories) {
                        slots.add(new PackingItemDTO.InventorySlot(
                            i.getId(),
                            i.getWarehouseLocation().getLocation(),
                            i.getStockQuantity(),
                            i.getBuyingPrice()
                        ));
                    }
                    dto.setInventorySlots(slots);
                    dtos.add(dto);
                }
            }
            return dtos;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean packItem(PackItemRequestDTO request) {
        try {
            // Find PickListOrder
            TypedQuery<PickListOrder> ploQuery = em.createQuery(
                "SELECT plo FROM PickListOrder plo WHERE plo.pickList.id = :picklistId AND plo.order.id = :orderId", PickListOrder.class);
            ploQuery.setParameter("picklistId", request.getPicklistId());
            ploQuery.setParameter("orderId", request.getOrderId());
            List<PickListOrder> plos = ploQuery.getResultList();
            if (plos.isEmpty()) {
                return false;
            }
            PickListOrder plo = plos.get(0);

            // Find OrderItem
            OrderItem orderItem = em.find(OrderItem.class, request.getOrderItemId());
            if (orderItem == null) {
                return false;
            }

            // Find Inventory
            Inventory inventory = em.find(Inventory.class, request.getInventoryId());
            if (inventory == null) {
                return false;
            }

            // Check stock quantity
            int newQty = inventory.getStockQuantity() - request.getPickQty();
            if (newQty < 0) {
                return false; // Not enough stock
            }

            // Find or create "Packed" status
            TypedQuery<Status> statusQuery = em.createQuery("SELECT s FROM Status s WHERE s.name = :name", Status.class);
            statusQuery.setParameter("name", "Packed");
            List<Status> statuses = statusQuery.getResultList();
            Status packedStatus;
            if (!statuses.isEmpty()) {
                packedStatus = statuses.get(0);
            } else {
                packedStatus = new Status();
                packedStatus.setName("Packed");
                em.persist(packedStatus);
            }

            // Create InventoryTransfer
            InventoryTransfer transfer = new InventoryTransfer();
            transfer.setId(System.currentTimeMillis());
            transfer.setInventory(inventory);
            transfer.setPickQty(String.valueOf(request.getPickQty()));
            transfer.setPickListOrder(plo);
            transfer.setOrderItem(orderItem);
            transfer.setCreatedAt(new Date());
            transfer.setStatus(packedStatus);
            em.persist(transfer);

            // Decrement stock quantity
            inventory.setStockQuantity(newQty);
            em.merge(inventory);

            // Decrement product blocked quantity
            Product product = inventory.getProduct();
            if (product != null) {
                int newBlockQty = product.getBlockQty() - request.getPickQty();
                if (newBlockQty < 0) {
                    newBlockQty = 0;
                }
                product.setBlockQty(newBlockQty);
                em.merge(product);
            }

            // Check if all items for this order are packed
            TypedQuery<OrderItem> oiQuery = em.createQuery(
                "SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId", OrderItem.class);
            oiQuery.setParameter("orderId", request.getOrderId());
            List<OrderItem> allItems = oiQuery.getResultList();

            boolean allPacked = true;
            for (OrderItem oi : allItems) {
                TypedQuery<Long> countQuery = em.createQuery(
                    "SELECT COUNT(it) FROM InventoryTransfer it WHERE it.pickListOrder.id = :ploId AND it.orderItem.id = :oiId", Long.class);
                countQuery.setParameter("ploId", plo.getId());
                countQuery.setParameter("oiId", oi.getId());
                if (countQuery.getSingleResult() == 0) {
                    allPacked = false;
                    break;
                }
            }

            if (allPacked) {
                // If all items are packed, update the status of PickListOrder and Order to "Packed"
                plo.setStatus(packedStatus);
                em.merge(plo);

                Order order = plo.getOrder();
                order.setStatus(packedStatus);
                em.merge(order);
            }

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    @jakarta.transaction.Transactional
    public boolean updateOrderStatus(Long orderId, String statusName) {
        try {
            lk.jiat.techmart.entity.Order order = em.find(lk.jiat.techmart.entity.Order.class, orderId);
            if (order == null) return false;

            TypedQuery<lk.jiat.techmart.entity.Status> statusQuery = em.createQuery(
                "SELECT s FROM Status s WHERE s.name = :name", 
                lk.jiat.techmart.entity.Status.class
            );
            statusQuery.setParameter("name", statusName);
            List<lk.jiat.techmart.entity.Status> statuses = statusQuery.getResultList();
            lk.jiat.techmart.entity.Status status;
            if (!statuses.isEmpty()) {
                status = statuses.get(0);
            } else {
                status = new lk.jiat.techmart.entity.Status();
                status.setName(statusName);
                em.persist(status);
            }

            order.setStatus(status);
            em.merge(order);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
