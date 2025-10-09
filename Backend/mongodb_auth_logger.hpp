#pragma once
#include "mongodb_service.hpp"
#include <string>
#include <vector>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <fstream>

class MongoDBAuthLogger {
private:
    MongoDBService& db;
    std::string collection_name;
    
    std::string getCurrentDateTime() {
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        
        std::stringstream ss;
        ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
public:
    struct AuthEvent {
        std::string userId;
        std::string email;
        std::string displayName;
        std::string eventType;  // "login" or "signup"
        std::string provider;   // "email", "google", etc.
        std::string timestamp;
        std::string sessionId;
        std::string userAgent;
        std::string platform;
        std::string deviceType; // "mobile", "tablet", "desktop"
        std::string browserName;
        std::string ipAddress;
        std::string currentUrl;
        bool isNewUser;
        int64_t timestampUnix;
        
        // Convert to BSON document
        bsoncxx::document::value toBson() const {
            using namespace bsoncxx::builder::stream;
            auto doc = document{};
            
            doc << "userId" << userId
                << "email" << email
                << "displayName" << displayName
                << "eventType" << eventType
                << "provider" << provider
                << "timestamp" << timestamp
                << "sessionId" << sessionId
                << "userAgent" << userAgent
                << "platform" << platform
                << "deviceType" << deviceType
                << "browserName" << browserName
                << "ipAddress" << ipAddress
                << "currentUrl" << currentUrl
                << "isNewUser" << isNewUser
                << "timestampUnix" << static_cast<int64_t>(timestampUnix)
                << finalize;
            
            return doc.extract();
        }
        
        // Create from BSON document
        static AuthEvent fromBson(const bsoncxx::document::view& doc) {
            AuthEvent event;
            
            auto get_string = [](const bsoncxx::document::view& d, const char* key) -> std::string {
                auto elem = d[key];
                if (elem && elem.type() == bsoncxx::type::k_string) {
                    return std::string(elem.get_string().value);
                }
                return "";
            };
            
            event.userId = get_string(doc, "userId");
            event.email = get_string(doc, "email");
            event.displayName = get_string(doc, "displayName");
            event.eventType = get_string(doc, "eventType");
            event.provider = get_string(doc, "provider");
            event.timestamp = get_string(doc, "timestamp");
            event.sessionId = get_string(doc, "sessionId");
            event.userAgent = get_string(doc, "userAgent");
            event.platform = get_string(doc, "platform");
            event.deviceType = get_string(doc, "deviceType");
            event.browserName = get_string(doc, "browserName");
            event.ipAddress = get_string(doc, "ipAddress");
            event.currentUrl = get_string(doc, "currentUrl");
            
            auto is_new = doc["isNewUser"];
            event.isNewUser = (is_new && is_new.type() == bsoncxx::type::k_bool) ? is_new.get_bool().value : false;
            
            auto ts = doc["timestampUnix"];
            event.timestampUnix = (ts && ts.type() == bsoncxx::type::k_int64) ? ts.get_int64().value : 0;
            
            return event;
        }
        
        // Convert to JSON string
        std::string toJsonString() const {
            std::stringstream ss;
            ss << "{\n";
            ss << "  \"userId\": \"" << userId << "\",\n";
            ss << "  \"email\": \"" << email << "\",\n";
            ss << "  \"displayName\": \"" << displayName << "\",\n";
            ss << "  \"eventType\": \"" << eventType << "\",\n";
            ss << "  \"provider\": \"" << provider << "\",\n";
            ss << "  \"timestamp\": \"" << timestamp << "\",\n";
            ss << "  \"sessionId\": \"" << sessionId << "\",\n";
            ss << "  \"userAgent\": \"" << userAgent << "\",\n";
            ss << "  \"platform\": \"" << platform << "\",\n";
            ss << "  \"deviceType\": \"" << deviceType << "\",\n";
            ss << "  \"browserName\": \"" << browserName << "\",\n";
            ss << "  \"ipAddress\": \"" << ipAddress << "\",\n";
            ss << "  \"currentUrl\": \"" << currentUrl << "\",\n";
            ss << "  \"isNewUser\": " << (isNewUser ? "true" : "false") << ",\n";
            ss << "  \"timestampUnix\": " << timestampUnix << "\n";
            ss << "}";
            return ss.str();
        }
    };
    
    MongoDBAuthLogger(MongoDBService& db_service, const std::string& collection = "auth_events")
        : db(db_service), collection_name(collection) {
        std::cout << "📝 MongoDB Auth Logger initialized for collection: " << collection_name << std::endl;
        
        // Create indexes for common queries
        try {
            auto index_builder = bsoncxx::builder::stream::document{};
            
            // Index on timestamp for time-based queries
            auto index_doc = index_builder << "timestampUnix" << -1 << finalize;
            db.createIndex(collection_name, index_doc.view(), false);
            
            // Index on userId for user-specific queries
            index_doc = index_builder << "userId" << 1 << finalize;
            db.createIndex(collection_name, index_doc.view(), false);
            
            // Index on eventType for filtering by event type
            index_doc = index_builder << "eventType" << 1 << finalize;
            db.createIndex(collection_name, index_doc.view(), false);
            
            std::cout << "✅ Database indexes created successfully" << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "⚠️  Warning: Could not create indexes: " << e.what() << std::endl;
        }
    }
    
    bool logAuthEvent(const AuthEvent& event) {
        std::cout << "📊 Logging auth event: " << event.eventType << " for " << event.email << std::endl;
        return db.insertDocument(collection_name, event.toBson());
    }
    
    bool logAuthEventFromJson(const std::string& json_str) {
        try {
            auto doc = bsoncxx::from_json(json_str);
            std::cout << "📊 Logging auth event from JSON" << std::endl;
            return db.insertDocument(collection_name, doc.view());
        } catch (const std::exception& e) {
            std::cerr << "❌ Error parsing JSON: " << e.what() << std::endl;
            return false;
        }
    }
    
    std::vector<AuthEvent> getRecentEvents(int limit = 20) {
        using namespace bsoncxx::builder::stream;
        
        try {
            auto collection = db.getCollection(collection_name);
            
            document sort_doc;
            sort_doc << "timestampUnix" << -1;  // Sort by timestamp descending
            
            mongocxx::options::find opts{};
            opts.sort(sort_doc.view()).limit(limit);
            
            auto cursor = collection.find(document{} << finalize, opts);
            
            std::vector<AuthEvent> events;
            for (auto&& doc : cursor) {
                events.push_back(AuthEvent::fromBson(doc));
            }
            
            return events;
        } catch (const std::exception& e) {
            std::cerr << "❌ Error getting recent events: " << e.what() << std::endl;
            return std::vector<AuthEvent>();
        }
    }
    
    std::string getAuthStatisticsJson() {
        using namespace bsoncxx::builder::stream;
        
        try {
            // Total events
            int64_t total_events = db.countDocuments(collection_name);
            
            // Signups and logins
            document signup_filter;
            signup_filter << "eventType" << "signup" << finalize;
            
            document login_filter;
            login_filter << "eventType" << "login" << finalize;
            
            int64_t total_events = 0, signups = 0, logins = 0, google_auth = 0, email_auth = 0, desktop_users = 0, mobile_users = 0;
            
            try {
                // Count total events
                document all_filter;
                all_filter << "1" << "1" << finalize;
                total_events = db.countDocuments(collection_name, all_filter.view());
                
                // Count signups
                document signup_filter;
                signup_filter << "eventType" << "signup" << finalize;
                signups = db.countDocuments(collection_name, signup_filter.view());
                
                // Count logins
                document login_filter;
                login_filter << "eventType" << "login" << finalize;
                logins = db.countDocuments(collection_name, login_filter.view());
                
                // Count Google auth
                document google_filter;
                google_filter << "authProvider" << "google.com" << finalize;
                google_auth = db.countDocuments(collection_name, google_filter.view());
                
                // Count email auth
                document email_filter;
                email_filter << "authProvider" << "password" << finalize;
                email_auth = db.countDocuments(collection_name, email_filter.view());
                
                // Count device types
                document desktop_filter;
                desktop_filter << "deviceType" << "desktop" << finalize;
                desktop_users = db.countDocuments(collection_name, desktop_filter.view());
                
                document mobile_filter;
                mobile_filter << "deviceType" << "mobile" << finalize;
                mobile_users = db.countDocuments(collection_name, mobile_filter.view());
            } catch (const std::exception& e) {
                std::cerr << "Error counting documents: " << e.what() << std::endl;
                return "{\"error\": \"Failed to count documents\"}";
            }
            
            // Create result JSON using string stream for simplicity
            std::ostringstream result;
            result << "{\"totalEvents\": " << total_events << ",\n";
            result << "  \"signups\": " << signups << ",\n";
            result << "  \"logins\": " << logins << ",\n";
            result << "  \"googleAuth\": " << google_auth << ",\n";
            result << "  \"emailAuth\": " << email_auth << ",\n";
            result << "  \"mobileUsers\": " << mobile_users << ",\n";
            result << "  \"desktopUsers\": " << desktop_users << ",\n";
            result << "  \"uniqueUsers\": " << unique_users << ",\n";
            result << "  \"lastUpdated\": \"" << getCurrentDateTime() << "\"\n";
            result << "}";
            
            return result.str();
        } catch (const std::exception& e) {
            std::cerr << "❌ Error getting statistics: " << e.what() << std::endl;
            return "{\"error\": \"Failed to get statistics\"}";
        }
    }
    
    bool exportToCSV(const std::string& filename) {
        try {
            std::ofstream file(filename);
            if (!file.is_open()) {
                std::cerr << "❌ Could not open file: " << filename << std::endl;
                return false;
            }
            
            // Write CSV header
            file << "UserId,Email,DisplayName,EventType,Provider,Timestamp,SessionId,UserAgent,"
                 << "Platform,DeviceType,BrowserName,IPAddress,CurrentUrl,IsNewUser,TimestampUnix\n";
            
            // Get all documents
            auto collection = db.getCollection(collection_name);
            auto cursor = collection.find(document{} << finalize);
            
            int count = 0;
            for (auto&& doc : cursor) {
                auto event = AuthEvent::fromBson(doc);
                
                // Escape quotes in strings
                auto escape = [](const std::string& s) {
                    std::string result = s;
                    size_t pos = 0;
                    while ((pos = result.find('"', pos)) != std::string::npos) {
                        result.replace(pos, 1, "\"\"");
                        pos += 2;
                    }
                    return "\"" + result + "\"";
                };
                
                file << escape(event.userId) << ","
                     << escape(event.email) << ","
                     << escape(event.displayName) << ","
                     << escape(event.eventType) << ","
                     << escape(event.provider) << ","
                     << escape(event.timestamp) << ","
                     << escape(event.sessionId) << ","
                     << escape(event.userAgent) << ","
                     << escape(event.platform) << ","
                     << escape(event.deviceType) << ","
                     << escape(event.browserName) << ","
                     << escape(event.ipAddress) << ","
                     << escape(event.currentUrl) << ","
                     << (event.isNewUser ? "true" : "false") << ","
                     << event.timestampUnix << "\n";
                
                count++;
            }
            
            file.close();
            std::cout << "✅ Exported " << count << " events to " << filename << std::endl;
            return true;
        } catch (const std::exception& e) {
            std::cerr << "❌ Error exporting to CSV: " << e.what() << std::endl;
            return false;
        }
    }
};
