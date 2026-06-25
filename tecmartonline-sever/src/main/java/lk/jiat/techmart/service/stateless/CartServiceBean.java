package lk.jiat.techmart.service.stateless;

import jakarta.ejb.Stateless;
import jakarta.interceptor.Interceptors;
import lk.jiat.techmart.interceptor.LoggingInterceptor;
import lk.jiat.techmart.interceptor.PerformanceInterceptor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lk.jiat.techmart.dto.CartDTO;
import lk.jiat.techmart.dto.ProductDTO;
import lk.jiat.techmart.entity.CartItem;
import lk.jiat.techmart.entity.Product;
import lk.jiat.techmart.entity.User;
import lk.jiat.techmart.service.remote.CartServiceRemote;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
@Interceptors({LoggingInterceptor.class, PerformanceInterceptor.class})
public class CartServiceBean implements CartServiceRemote {

    @PersistenceContext(unitName = "TechMartOnlinePU")
    private EntityManager em;

    @Override
    public boolean addToCart(Long userId, Long productId, int quantity) {
        try {
            User user = em.find(User.class, userId);
            Product product = em.find(Product.class, productId);

            if (user == null || product == null) {
                return false;
            }

            // Check if cart item already exists
            TypedQuery<CartItem> query = em.createQuery(
                    "SELECT c FROM CartItem c WHERE c.user.id = :userId AND c.product.id = :productId", CartItem.class);
            query.setParameter("userId", userId);
            query.setParameter("productId", productId);
            List<CartItem> existing = query.getResultList();

            if (!existing.isEmpty()) {
                CartItem item = existing.get(0);
                item.setQuantity(item.getQuantity() + quantity);
                em.merge(item);
            } else {
                CartItem item = new CartItem();
                item.setUser(user);
                item.setProduct(product);
                item.setQuantity(quantity);
                em.persist(item);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public List<CartDTO> getCartByUserId(Long userId) {
        try {
            TypedQuery<CartItem> query = em.createQuery(
                    "SELECT c FROM CartItem c WHERE c.user.id = :userId", CartItem.class);
            query.setParameter("userId", userId);
            List<CartItem> items = query.getResultList();

            return items.stream().map(c -> {
                CartDTO dto = new CartDTO();
                dto.setId(c.getId());
                dto.setQuantity(c.getQuantity());

                Product p = c.getProduct();
                ProductDTO pDto = new ProductDTO();
                pDto.setId(p.getId());
                pDto.setName(p.getName());
                pDto.setDescription(p.getDescription());
                pDto.setPrice(p.getPrice());
                pDto.setBarcode(p.getBarcode());
                pDto.setWeight(p.getWeight());
                pDto.setBlockQty(p.getBlockQty());
                pDto.setDimensions(p.getDimensions());
                pDto.setIsActive(p.isIsActive());
                pDto.setColor(p.getColor().getColor());
                pDto.setCategory(p.getCategory().getName());
                pDto.setBrand(p.getBrand().getName());
                dto.setProduct(pDto);

                return dto;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean removeFromCart(Long cartItemId) {
        try {
            CartItem item = em.find(CartItem.class, cartItemId);
            if (item != null) {
                em.remove(item);
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
