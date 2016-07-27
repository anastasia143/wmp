package com.qreal.robots.dao.config;

import com.qreal.robots.components.database.diagrams.dao.DiagramDao;
import com.qreal.robots.components.database.diagrams.dao.DiagramDaoImpl;
import com.qreal.robots.components.database.robots.dao.RobotDao;
import com.qreal.robots.components.database.robots.dao.RobotDaoImpl;
import com.qreal.robots.components.database.users.dao.UserDao;
import com.qreal.robots.components.database.users.dao.UserDaoImpl;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.annotation.PersistenceExceptionTranslationPostProcessor;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.hibernate4.HibernateTransactionManager;
import org.springframework.orm.hibernate4.LocalSessionFactoryBuilder;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@EnableTransactionManagement
public class HibernateTestConfig {

    @Bean
    public SessionFactory sessionFactory() {

        LocalSessionFactoryBuilder sessionBuilder = new LocalSessionFactoryBuilder(dataSource());

        sessionBuilder.scanPackages("com.qreal.robots.model");
        sessionBuilder.addProperties(getHibernateProperties());
        return sessionBuilder.buildSessionFactory();
    }

    @Bean
    public HibernateTransactionManager txManager() {
        return new HibernateTransactionManager(sessionFactory());
    }

    private Properties getHibernateProperties() {
        Properties ps = new Properties();
        ps.put("hibernate.dialect", "org.hibernate.dialect.HSQLDialect");
        ps.put("hibernate.hbm2ddl.auto", "create-drop");
        return ps;
    }

    @Bean
    public DataSource dataSource() {

        DriverManagerDataSource ds = new DriverManagerDataSource();

        ds.setDriverClassName("org.hsqldb.jdbcDriver");
        ds.setUrl("jdbc:hsqldb:mem:testdb");
        ds.setUsername("sa");
        ds.setPassword("");

        return ds;
    }

    @Bean
    public PersistenceExceptionTranslationPostProcessor exceptionTranslation() {
        return new PersistenceExceptionTranslationPostProcessor();
    }

    @Autowired
    @Bean(name = "diagramDao")
    public DiagramDao getDiagramDao(SessionFactory sessionFactory) {
        return new DiagramDaoImpl(sessionFactory);
    }

    @Autowired
    @Bean(name = "userDao")
    public UserDao getUserDao(SessionFactory sessionFactory) {
        return new UserDaoImpl(sessionFactory);
    }

    @Autowired
    @Bean(name = "robotDao")
    public RobotDao getRobotDao(SessionFactory sessionFactory) {
        return new RobotDaoImpl(sessionFactory);
    }
}