package com.mycompany.saas_japanese;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SaasJapaneseApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaasJapaneseApplication.class, args);
	}

}
