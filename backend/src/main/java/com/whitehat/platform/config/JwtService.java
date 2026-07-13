package com.whitehat.platform.config;

import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service;
import javax.crypto.SecretKey; import java.nio.charset.StandardCharsets; import java.time.*; import java.util.Date;

@Service public class JwtService {
    private final SecretKey key; private final long minutes;
    public JwtService(@Value("${security.jwt.secret}") String secret,@Value("${security.jwt.expiration-minutes}") long minutes){this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));this.minutes=minutes;}
    public String create(Long id,String username,String role){Instant now=Instant.now();return Jwts.builder().subject(username).claim("uid",id).claim("role",role).issuedAt(Date.from(now)).expiration(Date.from(now.plus(Duration.ofMinutes(minutes)))).signWith(key).compact();}
    public Claims parse(String token){return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();}
}

