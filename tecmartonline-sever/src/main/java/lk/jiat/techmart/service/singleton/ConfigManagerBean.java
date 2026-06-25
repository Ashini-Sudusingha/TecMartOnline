package lk.jiat.techmart.service.singleton;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import java.util.Properties;

@Singleton
public class ConfigManagerBean {

    private Properties properties;

    @PostConstruct
    public void init() {
        properties = new Properties();
        properties.setProperty("db.name", "techmartonline");
        properties.setProperty("smtp.host", "smtp.techmart.com");
        System.out.println("ConfigManagerBean: Singleton EJB initialized properties.");
    }

    public String getValue(String key) {
        return properties.getProperty(key);
    }
}
