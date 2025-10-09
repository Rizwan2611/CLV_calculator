#ifndef HTTP_SERVER_HPP
#define HTTP_SERVER_HPP

#include <iostream>
#include <string>
#include <sstream>
#include <thread>
#include <vector>
#include <map>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <fstream>
#include <cstdlib>
#include "clv_calculator.hpp"
#include "mongodb_service.hpp"
#include "mongodb_auth_logger.hpp"

class HTTPServer {
private:
    int server_fd;
    int port;
    CLVCalculator* calculator;
    MongoDBService* mongoService;
    MongoDBAuthLogger* authLogger;
    std::string allowedOrigins;
    
    std::string getContentType(const std::string& path) {
        if (path.find(".html") != std::string::npos) return "text/html";
        if (path.find(".css") != std::string::npos) return "text/css";
        if (path.find(".js") != std::string::npos) return "application/javascript";
        if (path.find(".json") != std::string::npos) return "application/json";
        return "text/plain";
    }
    
    std::string readFile(const std::string& path) {
        std::ifstream file(path);
        if (!file.is_open()) return "";
        
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    }
    
    std::string createResponse(int statusCode, const std::string& contentType, const std::string& body) {
        std::stringstream response;
        response << "HTTP/1.1 " << statusCode;
        
        switch(statusCode) {
            case 200: response << " OK"; break;
            case 404: response << " Not Found"; break;
            case 500: response << " Internal Server Error"; break;
            default: response << " Unknown"; break;
        }
        
        response << "\r\n";
        response << "Content-Type: " << contentType << "\r\n";
        response << "Content-Length: " << body.length() << "\r\n";
        response << "Access-Control-Allow-Origin: " << allowedOrigins << "\r\n";
        response << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
        response << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
        response << "Connection: close\r\n";
        response << "\r\n";
        response << body;
        
        return response.str();
    }
    
    std::map<std::string, std::string> parseQuery(const std::string& query) {
        std::map<std::string, std::string> params;
        std::stringstream ss(query);
        std::string pair;
        
        while (std::getline(ss, pair, '&')) {
            size_t pos = pair.find('=');
            if (pos != std::string::npos) {
                std::string key = pair.substr(0, pos);
                std::string value = pair.substr(pos + 1);
                params[key] = value;
            }
        }
        return params;
    }
    
    std::string urlDecode(const std::string& str) {
        std::string result;
        for (size_t i = 0; i < str.length(); ++i) {
            if (str[i] == '%' && i + 2 < str.length()) {
                int value;
                std::stringstream ss;
                ss << std::hex << str.substr(i + 1, 2);
                ss >> value;
                result += static_cast<char>(value);
                i += 2;
            } else if (str[i] == '+') {
                result += ' ';
            } else {
                result += str[i];
            }
        }
        return result;
    }
    
    std::string handleAPIRequest(const std::string& method, const std::string& path, const std::string& body) {
        std::stringstream response;
        
        if (path == "/api/customers" && method == "GET") {
            // Get all customers
            response << "{\n  \"customers\": [\n";
            
            // Since we can't directly access private members, we'll read from JSON file
            std::ifstream file("customers.json");
            if (file.is_open()) {
                std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
                file.close();
                
                // Extract customers array from JSON
                size_t start = content.find("\"customers\": [");
                if (start != std::string::npos) {
                    start = content.find("[", start);
                    size_t end = content.find("]", start);
                    if (end != std::string::npos) {
                        std::string customers = content.substr(start + 1, end - start - 1);
                        response << customers;
                    }
                }
            }
            
            response << "\n  ],\n";
            response << "  \"status\": \"success\"\n";
            response << "}";
            
        } else if (path == "/api/customers" && method == "POST") {
            // Add new customer
            // Parse JSON body (simplified)
            std::string id, name;
            double aov = 0, freq = 0, lifespan = 0;
            
            // Simple JSON parsing for demo
            size_t pos = body.find("\"id\":");
            if (pos != std::string::npos) {
                size_t start = body.find("\"", pos + 5);
                size_t end = body.find("\"", start + 1);
                if (start != std::string::npos && end != std::string::npos) {
                    id = body.substr(start + 1, end - start - 1);
                }
            }
            
            pos = body.find("\"name\":");
            if (pos != std::string::npos) {
                size_t start = body.find("\"", pos + 7);
                size_t end = body.find("\"", start + 1);
                if (start != std::string::npos && end != std::string::npos) {
                    name = body.substr(start + 1, end - start - 1);
                }
            }
            
            pos = body.find("\"averagePurchaseValue\":");
            if (pos != std::string::npos) {
                size_t start = pos + 24;
                size_t end = body.find(",", start);
                if (end == std::string::npos) end = body.find("}", start);
                if (end != std::string::npos) {
                    std::string aovStr = body.substr(start, end - start);
                    try { aov = std::stod(aovStr); } catch (...) {}
                }
            }
            
            pos = body.find("\"purchaseFrequency\":");
            if (pos != std::string::npos) {
                size_t start = pos + 20;
                size_t end = body.find(",", start);
                if (end == std::string::npos) end = body.find("}", start);
                if (end != std::string::npos) {
                    std::string freqStr = body.substr(start, end - start);
                    try { freq = std::stod(freqStr); } catch (...) {}
                }
            }
            
            pos = body.find("\"customerLifespan\":");
            if (pos != std::string::npos) {
                size_t start = pos + 19;
                size_t end = body.find(",", start);
                if (end == std::string::npos) end = body.find("}", start);
                if (end != std::string::npos) {
                    std::string lifespanStr = body.substr(start, end - start);
                    try { lifespan = std::stod(lifespanStr); } catch (...) {}
                }
            }
            
            if (!id.empty() && !name.empty() && aov > 0 && freq > 0 && lifespan > 0) {
                calculator->addCustomer(id, name, aov, freq, lifespan);
                calculator->saveToJSON();
                
                double clv = aov * freq * lifespan;
                response << "{\n";
                response << "  \"status\": \"success\",\n";
                response << "  \"message\": \"Customer added successfully\",\n";
                response << "  \"customer\": {\n";
                response << "    \"id\": \"" << id << "\",\n";
                response << "    \"name\": \"" << name << "\",\n";
                response << "    \"averagePurchaseValue\": " << aov << ",\n";
                response << "    \"purchaseFrequency\": " << freq << ",\n";
                response << "    \"customerLifespan\": " << lifespan << ",\n";
                response << "    \"clv\": " << clv << "\n";
                response << "  }\n";
                response << "}";
            } else {
                response << "{\n";
                response << "  \"status\": \"error\",\n";
                response << "  \"message\": \"Invalid customer data\"\n";
                response << "}";
            }
            
        } else if (path.find("/api/add-customer") == 0 && method == "GET") {
            // Add customer via GET with query parameters (workaround for POST body parsing)
            std::string queryString = "";
            size_t queryPos = path.find('?');
            if (queryPos != std::string::npos) {
                queryString = path.substr(queryPos + 1);
            }
            
            auto params = parseQuery(queryString);
            
            std::string id = urlDecode(params["id"]);
            std::string name = urlDecode(params["name"]);
            double aov = 0, freq = 0, lifespan = 0;
            
            try {
                if (!params["averagePurchaseValue"].empty()) aov = std::stod(params["averagePurchaseValue"]);
                if (!params["purchaseFrequency"].empty()) freq = std::stod(params["purchaseFrequency"]);
                if (!params["customerLifespan"].empty()) lifespan = std::stod(params["customerLifespan"]);
            } catch (...) {}
            
            if (!id.empty() && !name.empty() && aov > 0 && freq > 0 && lifespan > 0) {
                calculator->addCustomer(id, name, aov, freq, lifespan);
                calculator->saveToJSON();
                
                double clv = aov * freq * lifespan;
                response << "{\n";
                response << "  \"status\": \"success\",\n";
                response << "  \"message\": \"Customer added successfully\",\n";
                response << "  \"customer\": {\n";
                response << "    \"id\": \"" << id << "\",\n";
                response << "    \"name\": \"" << name << "\",\n";
                response << "    \"averagePurchaseValue\": " << aov << ",\n";
                response << "    \"purchaseFrequency\": " << freq << ",\n";
                response << "    \"customerLifespan\": " << lifespan << ",\n";
                response << "    \"clv\": " << clv << "\n";
                response << "  }\n";
                response << "}";
            } else {
                response << "{\n";
                response << "  \"status\": \"error\",\n";
                response << "  \"message\": \"Invalid customer data - missing required fields\"\n";
                response << "}";
            }
            
        } else if (path == "/api/analytics" && method == "GET") {
            // Get analytics
            calculator->loadFromJSON(); // Refresh data
            
            response << "{\n";
            response << "  \"status\": \"success\",\n";
            response << "  \"analytics\": {\n";
            response << "    \"totalCustomers\": " << calculator->getCustomerCount() << ",\n";
            response << "    \"message\": \"Analytics data retrieved\"\n";
            response << "  }\n";
            response << "}";
            
        } else if (path == "/api/log-auth" && method == "POST") {
            // Log authentication event
            bool success = authLogger->logAuthEventFromJson(body);
            
            if (success) {
                response << "{\n";
                response << "  \"status\": \"success\",\n";
                response << "  \"message\": \"Authentication event logged successfully\"\n";
                response << "}";
            } else {
                response << "{\n";
                response << "  \"status\": \"error\",\n";
                response << "  \"message\": \"Failed to log authentication event\"\n";
                response << "}";
            }
            
        } else if (path == "/api/auth-stats" && method == "GET") {
            // Get authentication statistics
            std::string stats = authLogger->getAuthStatisticsJson();
            
            response << "{\n";
            response << "  \"status\": \"success\",\n";
            response << "  \"authStatistics\": " << stats << "\n";
            response << "}";
            
        } else if (path == "/api/auth-logs" && method == "GET") {
            // Get recent authentication logs
            auto recentEvents = authLogger->getRecentEvents(20);
            
            response << "{\n";
            response << "  \"status\": \"success\",\n";
            response << "  \"authLogs\": [\n";
            
            for (size_t i = 0; i < recentEvents.size(); i++) {
                response << "    " << recentEvents[i].toJsonString();
                if (i < recentEvents.size() - 1) response << ",";
                response << "\n";
            }
            
            response << "  ],\n";
            response << "  \"totalEvents\": " << recentEvents.size() << "\n";
            response << "}";
            
        } else if (path == "/api/auth-export" && method == "GET") {
            // Export authentication logs to CSV
            std::string filename = "auth_export_" + std::to_string(time(nullptr)) + ".csv";
            bool success = authLogger->exportToCSV(filename);
            
            if (success) {
                response << "{\n";
                response << "  \"status\": \"success\",\n";
                response << "  \"message\": \"Authentication logs exported successfully\",\n";
                response << "  \"filename\": \"" << filename << "\"\n";
                response << "}";
            } else {
                response << "{\n";
                response << "  \"status\": \"error\",\n";
                response << "  \"message\": \"Failed to export authentication logs\"\n";
                response << "}";
            }
            
        } else {
            response << "{\n";
            response << "  \"status\": \"error\",\n";
            response << "  \"message\": \"Endpoint not found\"\n";
            response << "}";
        }
        
        return response.str();
    }
    
    void handleClient(int client_socket) {
        char buffer[4096] = {0};
        read(client_socket, buffer, 4096);
        
        std::string request(buffer);
        std::stringstream ss(request);
        std::string line;
        std::getline(ss, line);
        
        std::stringstream requestLine(line);
        std::string method, path, version;
        requestLine >> method >> path >> version;
        
        std::string response;
        
        // Handle OPTIONS request for CORS
        if (method == "OPTIONS") {
            response = createResponse(200, "text/plain", "");
        }
        // Handle API requests
        else if (path.find("/api/") == 0) {
            std::string body;
            std::string headerLine;
            bool inBody = false;
            
            while (std::getline(ss, headerLine)) {
                if (headerLine == "\r" || headerLine.empty()) {
                    inBody = true;
                    continue;
                }
                if (inBody) {
                    body += headerLine;
                }
            }
            
            std::string apiResponse = handleAPIRequest(method, path, body);
            response = createResponse(200, "application/json", apiResponse);
        }
        // Serve static files
        else {
            std::string filePath = "../Frontend";
            if (path == "/") {
                filePath += "/index.html";
            } else {
                filePath += path;
            }
            
            std::string content = readFile(filePath);
            if (!content.empty()) {
                response = createResponse(200, getContentType(filePath), content);
            } else {
                response = createResponse(404, "text/html", "<h1>404 Not Found</h1>");
            }
        }
        
        send(client_socket, response.c_str(), response.length(), 0);
        close(client_socket);
    }
    
public:
    HTTPServer(int p = 8080) 
        : server_fd(0),
          port(p), 
          calculator(new CLVCalculator()),
          mongoService(nullptr),
          authLogger(nullptr),
          allowedOrigins("*") {
        // Read environment variables (with safe fallbacks)
        const char* origins_env = std::getenv("ALLOWED_ORIGINS");
        if (origins_env && std::strlen(origins_env) > 0) {
            allowedOrigins = origins_env;
        }

        const char* uri_env = std::getenv("MONGODB_URI");
        const char* db_env  = std::getenv("MONGODB_DB_NAME");

        std::string mongoUri = (uri_env && std::strlen(uri_env) > 0)
            ? std::string(uri_env)
            : std::string("mongodb+srv://rizxx50_db_user:P3VywhlQkN49ZWIf@clv.llk5c76.mongodb.net/");

        std::string dbName = (db_env && std::strlen(db_env) > 0)
            ? std::string(db_env)
            : std::string("clv_database");

        mongoService = new MongoDBService(mongoUri, dbName);
        authLogger = new MongoDBAuthLogger(*mongoService, "auth_events");

        calculator->loadFromJSON(); // Load existing data
        std::cout << "✅ Server initialized with MongoDB storage (DB: " << dbName << ")" << std::endl;
    }
    
    ~HTTPServer() {
        delete calculator;
        delete authLogger;
        delete mongoService;
        if (server_fd > 0) {
            close(server_fd);
        }
    }
    
    bool start() {
        // Create socket
        server_fd = socket(AF_INET, SOCK_STREAM, 0);
        if (server_fd == 0) {
            std::cerr << "Socket creation failed" << std::endl;
            return false;
        }
        
        // Set socket options
        int opt = 1;
        if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
            std::cerr << "Setsockopt failed" << std::endl;
            return false;
        }
        
        // Bind socket
        struct sockaddr_in address;
        address.sin_family = AF_INET;
        address.sin_addr.s_addr = INADDR_ANY;
        address.sin_port = htons(port);
        
        if (::bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
            std::cerr << "Bind failed" << std::endl;
            return false;
        }
        
        // Listen
        if (listen(server_fd, 10) < 0) {
            std::cerr << "Listen failed" << std::endl;
            return false;
        }
        
        std::cout << "🚀 CLV Server running on http://localhost:" << port << std::endl;
        std::cout << "📊 Backend API available at http://localhost:" << port << "/api/" << std::endl;
        std::cout << "🌐 Frontend available at http://localhost:" << port << "/" << std::endl;
        std::cout << "Press Ctrl+C to stop the server" << std::endl;
        
        return true;
    }
    
    void run() {
        if (!start()) return;
        
        while (true) {
            struct sockaddr_in client_addr;
            socklen_t client_len = sizeof(client_addr);
            
            int client_socket = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
            if (client_socket < 0) {
                std::cerr << "Accept failed" << std::endl;
                continue;
            }
            
            // Handle client in a separate thread
            std::thread clientThread(&HTTPServer::handleClient, this, client_socket);
            clientThread.detach();
        }
    }
};

#endif // HTTP_SERVER_HPP
