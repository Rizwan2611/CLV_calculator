#pragma once
#include <string>
#include <vector>
#include <fstream>
#include <iostream>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <set>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

struct AuthEvent {
    string userId;
    string email;
    string displayName;
    string eventType;  // "login" or "signup"
    string provider;   // "email", "google", etc.
    string timestamp;
    string sessionId;
    string userAgent;
    string platform;
    string deviceType;
    string browserName;
    string ipAddress;
    string currentUrl;
    bool isNewUser;
    long long timestampUnix;
    
    // Convert to JSON
    json toJson() const {
        return json{
            {"userId", userId},
            {"email", email},
            {"displayName", displayName},
            {"eventType", eventType},
            {"provider", provider},
            {"timestamp", timestamp},
            {"sessionId", sessionId},
            {"userAgent", userAgent},
            {"platform", platform},
            {"deviceType", deviceType},
            {"browserName", browserName},
            {"ipAddress", ipAddress},
            {"currentUrl", currentUrl},
            {"isNewUser", isNewUser},
            {"timestampUnix", timestampUnix}
        };
    }
    
    // Create from JSON
    static AuthEvent fromJson(const json& j) {
        AuthEvent event;
        event.userId = j.value("userId", "");
        event.email = j.value("email", "");
        event.displayName = j.value("displayName", "");
        event.eventType = j.value("eventType", "");
        event.provider = j.value("provider", "");
        event.timestamp = j.value("timestamp", "");
        event.sessionId = j.value("sessionId", "");
        event.userAgent = j.value("userAgent", "");
        event.platform = j.value("platform", "");
        event.deviceType = j.value("deviceType", "");
        event.browserName = j.value("browserName", "");
        event.ipAddress = j.value("ipAddress", "");
        event.currentUrl = j.value("currentUrl", "");
        event.isNewUser = j.value("isNewUser", false);
        event.timestampUnix = j.value("timestampUnix", 0LL);
        return event;
    }
};

class AuthLogger {
private:
    string authLogsFile;
    string dailyLogsDir;
    vector<AuthEvent> authEvents;
    
    string getCurrentTimestamp() {
        auto now = chrono::system_clock::now();
        auto time_t = chrono::system_clock::to_time_t(now);
        stringstream ss;
        ss << put_time(localtime(&time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
    string getCurrentDate() {
        auto now = chrono::system_clock::now();
        auto time_t = chrono::system_clock::to_time_t(now);
        stringstream ss;
        ss << put_time(localtime(&time_t), "%Y-%m-%d");
        return ss.str();
    }
    
    void ensureDirectoryExists(const string& dir) {
        // Create directory if it doesn't exist (simplified)
        system(("mkdir -p " + dir).c_str());
    }
    
public:
    AuthLogger(const string& logsFile = "auth_logs.json") 
        : authLogsFile(logsFile), dailyLogsDir("daily_auth_logs/") {
        ensureDirectoryExists(dailyLogsDir);
        loadFromJSON();
    }
    
    // Add new authentication event
    bool logAuthEvent(const AuthEvent& event) {
        try {
            // Add to memory
            authEvents.push_back(event);
            
            // Save to main file
            saveToJSON();
            
            // Save to daily file
            saveToDailyFile(event);
            
            cout << "✅ Auth event logged: " << event.eventType 
                 << " for " << event.email << endl;
            
            return true;
        } catch (const exception& e) {
            cerr << "❌ Error logging auth event: " << e.what() << endl;
            return false;
        }
    }
    
    // Log authentication event from JSON string
    bool logAuthEventFromJson(const string& jsonStr) {
        try {
            json j = json::parse(jsonStr);
            AuthEvent event = AuthEvent::fromJson(j);
            
            // Add server-side information
            event.ipAddress = "127.0.0.1"; // In real app, get from request
            if (event.timestamp.empty()) {
                event.timestamp = getCurrentTimestamp();
            }
            if (event.timestampUnix == 0) {
                event.timestampUnix = chrono::duration_cast<chrono::milliseconds>(
                    chrono::system_clock::now().time_since_epoch()).count();
            }
            
            return logAuthEvent(event);
        } catch (const exception& e) {
            cerr << "❌ Error parsing auth event JSON: " << e.what() << endl;
            return false;
        }
    }
    
    // Save to main JSON file
    void saveToJSON() {
        try {
            json j;
            j["metadata"] = {
                {"totalEvents", authEvents.size()},
                {"lastUpdated", getCurrentTimestamp()},
                {"version", "1.0.0"}
            };
            
            j["authEvents"] = json::array();
            for (const auto& event : authEvents) {
                j["authEvents"].push_back(event.toJson());
            }
            
            ofstream file(authLogsFile);
            file << j.dump(2);
            file.close();
            
        } catch (const exception& e) {
            cerr << "❌ Error saving auth logs: " << e.what() << endl;
        }
    }
    
    // Save to daily file
    void saveToDailyFile(const AuthEvent& event) {
        try {
            string dailyFile = dailyLogsDir + "auth_" + getCurrentDate() + ".json";
            
            // Simple daily file handling - just append events
            ofstream dailyFileStream(dailyFile, ios::app);
            if (dailyFileStream.tellp() == 0) {
                // New file, write header
                dailyFileStream << "{\n  \"date\": \"" << getCurrentDate() << "\",\n";
                dailyFileStream << "  \"events\": [\n";
            } else {
                // Existing file, add comma for next event
                dailyFileStream << ",\n";
            }
            
            // Add event (simplified JSON)
            dailyFileStream << "    {\n";
            dailyFileStream << "      \"userId\": \"" << event.userId << "\",\n";
            dailyFileStream << "      \"email\": \"" << event.email << "\",\n";
            dailyFileStream << "      \"eventType\": \"" << event.eventType << "\",\n";
            dailyFileStream << "      \"timestamp\": \"" << event.timestamp << "\"\n";
            dailyFileStream << "    }";
            
            dailyFileStream.close();
            
        } catch (const exception& e) {
            cerr << "❌ Error saving daily auth log: " << e.what() << endl;
        }
    }
    
    // Load from JSON file
    void loadFromJSON() {
        try {
            ifstream file(authLogsFile);
            if (!file.good()) {
                cout << "📝 Creating new auth logs file: " << authLogsFile << endl;
                return;
            }
            
            json j;
            file >> j;
            file.close();
            
            if (j.contains("authEvents")) {
                for (const auto& eventJson : j["authEvents"]) {
                    authEvents.push_back(AuthEvent::fromJson(eventJson));
                }
            }
            
            cout << "📂 Loaded " << authEvents.size() << " auth events from " << authLogsFile << endl;
            
        } catch (const exception& e) {
            cerr << "❌ Error loading auth logs: " << e.what() << endl;
        }
    }
    
    // Get all authentication events
    vector<AuthEvent> getAllAuthEvents() const {
        return authEvents;
    }
    
    // Get events by type
    vector<AuthEvent> getEventsByType(const string& eventType) const {
        vector<AuthEvent> filtered;
        for (const auto& event : authEvents) {
            if (event.eventType == eventType) {
                filtered.push_back(event);
            }
        }
        return filtered;
    }
    
    // Get events by user
    vector<AuthEvent> getEventsByUser(const string& userId) const {
        vector<AuthEvent> filtered;
        for (const auto& event : authEvents) {
            if (event.userId == userId) {
                filtered.push_back(event);
            }
        }
        return filtered;
    }
    
    // Get authentication statistics as JSON string
    string getAuthStatisticsJson() const {
        int totalEvents = authEvents.size();
        int signups = 0, logins = 0;
        int googleAuth = 0, emailAuth = 0;
        int mobileUsers = 0, desktopUsers = 0;
        set<string> uniqueUsers;
        
        for (const auto& event : authEvents) {
            if (event.eventType == "signup") signups++;
            else if (event.eventType == "login") logins++;
            
            if (event.provider == "google") googleAuth++;
            else if (event.provider == "email") emailAuth++;
            
            if (event.deviceType == "mobile") mobileUsers++;
            else if (event.deviceType == "desktop") desktopUsers++;
            
            uniqueUsers.insert(event.userId);
        }
        
        stringstream ss;
        ss << "{\n";
        ss << "  \"totalEvents\": " << totalEvents << ",\n";
        ss << "  \"signups\": " << signups << ",\n";
        ss << "  \"logins\": " << logins << ",\n";
        ss << "  \"googleAuth\": " << googleAuth << ",\n";
        ss << "  \"emailAuth\": " << emailAuth << ",\n";
        ss << "  \"mobileUsers\": " << mobileUsers << ",\n";
        ss << "  \"desktopUsers\": " << desktopUsers << ",\n";
        ss << "  \"uniqueUsers\": " << uniqueUsers.size() << ",\n";
        ss << "  \"lastUpdated\": \"" << getCurrentTimestamp() << "\"\n";
        ss << "}";
        
        return ss.str();
    }
    
    // Export events to CSV
    bool exportToCSV(const string& filename) const {
        try {
            ofstream file(filename);
            
            // Write header
            file << "UserId,Email,DisplayName,EventType,Provider,Timestamp,SessionId,UserAgent,Platform,DeviceType,BrowserName,IPAddress,CurrentUrl,IsNewUser,TimestampUnix\n";
            
            // Write data
            for (const auto& event : authEvents) {
                file << event.userId << ","
                     << event.email << ","
                     << event.displayName << ","
                     << event.eventType << ","
                     << event.provider << ","
                     << event.timestamp << ","
                     << event.sessionId << ","
                     << "\"" << event.userAgent << "\","
                     << event.platform << ","
                     << event.deviceType << ","
                     << event.browserName << ","
                     << event.ipAddress << ","
                     << event.currentUrl << ","
                     << (event.isNewUser ? "true" : "false") << ","
                     << event.timestampUnix << "\n";
            }
            
            file.close();
            cout << "✅ Auth events exported to " << filename << endl;
            return true;
            
        } catch (const exception& e) {
            cerr << "❌ Error exporting to CSV: " << e.what() << endl;
            return false;
        }
    }
    
    // Clear all authentication events
    void clearAuthEvents() {
        authEvents.clear();
        saveToJSON();
        cout << "🗑️ All auth events cleared" << endl;
    }
    
    // Get recent events (last N events)
    vector<AuthEvent> getRecentEvents(int limit = 10) const {
        vector<AuthEvent> recent;
        int start = max(0, (int)authEvents.size() - limit);
        
        for (int i = start; i < authEvents.size(); i++) {
            recent.push_back(authEvents[i]);
        }
        
        return recent;
    }
};
