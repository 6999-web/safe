package com.whitehat.platform.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.*;

/** Keeps vendor-specific API details outside core business transactions. */
@Service public class IntegrationGateway {
 private final Map<String,String> endpoints; private final RestClient client;
 public IntegrationGateway(@Value("${integration.ctfd-url}") String ctfd,@Value("${integration.taiga-url}") String taiga,@Value("${integration.flarum-url}") String flarum,@Value("${integration.defectdojo-url}") String dojo){endpoints=new LinkedHashMap<>(Map.of("ctfd",ctfd,"taiga",taiga,"flarum",flarum,"defectdojo",dojo));var f=new SimpleClientHttpRequestFactory();f.setConnectTimeout(1500);f.setReadTimeout(1500);client=RestClient.builder().requestFactory(f).build();}
 public List<Map<String,Object>> health(){return endpoints.entrySet().stream().map(e->{boolean up;try{client.get().uri(e.getValue()).retrieve().toBodilessEntity();up=true;}catch(Exception ex){up=false;}return Map.<String,Object>of("name",e.getKey(),"url",e.getValue(),"status",up?"UP":"UNAVAILABLE");}).toList();}
}

