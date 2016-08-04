package com.qreal.robots.config;

import com.qreal.robots.server.DiagramDbServer;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class AppInit {
    /**
     * Main function creates context and starts server.
     */
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.scan("com.qreal.robots.config");
        context.scan("com.qreal.robots.dao");
        context.register(AppInit.class);
        context.refresh();
        DiagramDbServer diagramDbServer = new DiagramDbServer(context);
    }

}