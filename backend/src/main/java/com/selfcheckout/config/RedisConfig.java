package com.selfcheckout.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        return new InMemoryRedisTemplate();
    }

    private static class InMemoryRedisTemplate extends RedisTemplate<String, Object> {
        private final Map<String, Object> store = new ConcurrentHashMap<>();
        private final ValueOperations<String, Object> valueOps;

        @SuppressWarnings("unchecked")
        public InMemoryRedisTemplate() {
            this.valueOps = (ValueOperations<String, Object>) Proxy.newProxyInstance(
                ValueOperations.class.getClassLoader(),
                new Class<?>[]{ValueOperations.class},
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if ("get".equals(name)) {
                            return store.get(args[0]);
                        } else if ("set".equals(name)) {
                            store.put((String) args[0], args[1]);
                            return null;
                        }
                        return null;
                    }
                }
            );
        }

        @Override
        public ValueOperations<String, Object> opsForValue() {
            return this.valueOps;
        }

        @Override
        public Boolean delete(String key) {
            return store.remove(key) != null;
        }

        @Override
        public void afterPropertiesSet() {
            // Bypass the ConnectionFactory verification
        }
    }
}
