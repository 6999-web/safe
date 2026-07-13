package com.whitehat.platform.config;

import org.junit.jupiter.api.Test; import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
 @Test void createsAndParsesSignedIdentity(){JwtService service=new JwtService("a-secure-test-secret-that-is-long-enough",30);String token=service.create(42L,"researcher","WHITEHAT");var claims=service.parse(token);assertThat(claims.getSubject()).isEqualTo("researcher");assertThat(((Number)claims.get("uid")).longValue()).isEqualTo(42L);assertThat(claims.get("role",String.class)).isEqualTo("WHITEHAT");}
}
