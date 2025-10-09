#include "http_server.hpp"
#include <signal.h>
#include <iostream>
#include <cstdlib>
#include <string>

HTTPServer* server = nullptr;

void signalHandler(int signum) {
    std::cout << "\n🛑 Shutting down server..." << std::endl;
    if (server) {
        delete server;
    }
    exit(signum);
}

int main() {
    // Set up signal handler for graceful shutdown
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    std::cout << "🎯 CLV Calculator - Full Stack Server" << std::endl;
    std::cout << "=====================================\n" << std::endl;
    
    // Determine port from environment (Render sets PORT), default 8080 locally
    int port = 8080;
    if (const char* penv = std::getenv("PORT")) {
        try {
            port = std::stoi(penv);
        } catch (...) {
            std::cerr << "⚠️  Invalid PORT env var, falling back to 8080" << std::endl;
            port = 8080;
        }
    }

    // Create and start server
    server = new HTTPServer(port);
    server->run();
    
    return 0;
}
