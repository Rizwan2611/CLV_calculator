# CLV Calculator Makefile

CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -pthread $(shell pkg-config --cflags libmongocxx)
LDFLAGS = $(shell pkg-config --libs libmongocxx)
TARGET = clv-calculator
SERVER_TARGET = clv-server
SOURCES = main.cpp
SERVER_SOURCES = server_main.cpp
HEADERS = clv_calculator.hpp http_server.hpp mongodb_service.hpp mongodb_auth_logger.hpp

# Ensure these directories exist
MKDIR_P = mkdir -p
BUILD_DIR = build

# Default target - build both CLI and server
all: $(TARGET) $(SERVER_TARGET)

# Link the CLI executable
$(TARGET): $(SOURCES) $(HEADERS)
	$(CXX) $(CXXFLAGS) $(SOURCES) -o $(TARGET)

# Link the server executable
$(SERVER_TARGET): $(SERVER_SOURCES) $(HEADERS)
	$(CXX) $(CXXFLAGS) $(SERVER_SOURCES) -o $(SERVER_TARGET) $(LDFLAGS)

# Clean build files
clean:
	rm -f $(TARGET) $(SERVER_TARGET)

# Install
install: $(TARGET)
	sudo cp $(TARGET) /usr/local/bin/

# Run the CLI application
run: $(TARGET)
	./$(TARGET)

# Run the web server
server: $(SERVER_TARGET)
	./$(SERVER_TARGET)

# Test compilation
test-compile:
	$(CXX) $(CXXFLAGS) -c main.cpp -o /tmp/test.o

# Show help
help:
	@echo "CLV Calculator Build System"
	@echo "Commands:"
	@echo "  make         - Build both CLI and server"
	@echo "  make run     - Build and run CLI version"
	@echo "  make server  - Build and run web server"
	@echo "  make clean   - Remove build files"
	@echo "  make help    - Show this help"

.PHONY: all clean install run server test-compile help
