package lk.jiat.techmart.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import lk.jiat.techmart.util.Constants;

import java.util.Date;

public class JWTUtil {

    private static final String ISSUER = "techmart";

    public static String generateToken(String email, String role) {
        Algorithm algorithm = Algorithm.HMAC256(Constants.JWT_SECRET);
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(email)
                .withClaim("role", role)
                .withExpiresAt(new Date(System.currentTimeMillis() + Constants.JWT_EXPIRATION_MS))
                .sign(algorithm);
    }

    public static DecodedJWT validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(Constants.JWT_SECRET);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build();
            return verifier.verify(token);
        } catch (Exception e) {
            return null; // Token is invalid or expired
        }
    }

    public static String getSubject(String token) {
        DecodedJWT decodedJWT = JWT.decode(token);
        return decodedJWT.getSubject();
    }

    public static String getRole(String token) {
        DecodedJWT decodedJWT = JWT.decode(token);
        return decodedJWT.getClaim("role").asString();
    }
}
