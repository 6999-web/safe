package com.whitehat.platform.config;

import io.jsonwebtoken.Claims; import jakarta.servlet.*; import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority; import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException; import java.util.List;

@Component public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt; public JwtAuthenticationFilter(JwtService jwt){this.jwt=jwt;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
        String header=req.getHeader("Authorization");
        if(header!=null&&header.startsWith("Bearer ")){try{Claims c=jwt.parse(header.substring(7));Long uid=((Number)c.get("uid")).longValue();String role=c.get("role",String.class);var auth=new UsernamePasswordAuthenticationToken(uid,null,List.of(new SimpleGrantedAuthority("ROLE_"+role)));SecurityContextHolder.getContext().setAuthentication(auth);}catch(Exception ignored){SecurityContextHolder.clearContext();}}
        chain.doFilter(req,res);
    }
}

