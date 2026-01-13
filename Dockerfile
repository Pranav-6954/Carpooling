# Build Stage
FROM gradle:jdk17-alpine AS build
WORKDIR /app
COPY . .
RUN ./gradlew clean build -x test --no-daemon

# Run Stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
