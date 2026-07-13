package com.whitehat.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitehat.platform.common.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.*; import org.springframework.http.HttpMethod; import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity; import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain; import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration @EnableMethodSecurity public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder(12);}
    @Bean SecurityFilterChain filterChain(HttpSecurity http,JwtAuthenticationFilter jwt,ObjectMapper mapper)throws Exception{return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).exceptionHandling(e->e.authenticationEntryPoint((req,res,ex)->writeError(res,mapper,401,"请先登录")).accessDeniedHandler((req,res,ex)->writeError(res,mapper,403,"无权执行此操作"))).authorizeHttpRequests(a->a.requestMatchers("/api/login","/api/register","/api/dashboard/**","/error","/actuator/health").permitAll().requestMatchers(HttpMethod.GET,"/api/tasks/**","/api/user/rank","/api/forum/posts/**").permitAll().anyRequest().authenticated()).addFilterBefore(jwt,UsernamePasswordAuthenticationFilter.class).build();}
    private static void writeError(HttpServletResponse response,ObjectMapper mapper,int status,String message)throws java.io.IOException{response.setStatus(status);response.setCharacterEncoding("UTF-8");response.setContentType(MediaType.APPLICATION_JSON_VALUE);mapper.writeValue(response.getWriter(),new ApiResponse<>(status,message,null));}
}
