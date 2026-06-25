package lk.jiat.techmart.service.singleton;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import java.util.HashMap;
import java.util.Map;

@Singleton
@Startup
public class CacheManagerBean {

    private Map<String, String> cache;

    @PostConstruct
    public void init() {
        cache = new HashMap<>();
        // Load default config
        cache.put("appName", "TechMart Online");
        cache.put("version", "1.0 Enterprise");
        System.out.println("CacheManagerBean: Singleton Startup EJB initialized and properties cached.");
    }

    public String getProperty(String key) {
        return cache.get(key);
    }

    public void setProperty(String key, String value) {
        cache.put(key, value);
    }
}
