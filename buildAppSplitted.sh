#build monolith
sh buildApp.sh
#build splitted parts
sh thriftGenSplitted.sh
cd DBServices
mvn clean package
#build DiagramDBService
cd DiagramService
mvn clean package
#build RobotsDBService
cd ../RobotsService
mvn clean package
#build UserDbService
cd ../UserService
mvn clean package
echo "Now use tomcat7 to start project"
