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

using namespace std;

struct SimpleAuthEvent {
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
    
    // Convert to simple JSON string
    string toJsonString() const {
        stringstream ss;
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

class SimpleAuthLogger {
private:
    string authLogsFile;
    string dailyLogsDir;
    vector<SimpleAuthEvent> authEvents;
    
    string getCurrentTimestamp() const {
        auto now = chrono::system_clock::now();
        auto time_t = chrono::system_clock::to_time_t(now);
        stringstream ss;
        ss << put_time(localtime(&time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
    string getCurrentDate() const {
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
    
    // Simple JSON value extraction
    string extractJsonValue(const string& json, const string& key) const {
        string searchKey = "\"" + key + "\":";
        size_t pos = json.find(searchKey);
        if (pos == string::npos) return "";
        
        pos = json.find("\"", pos + searchKey.length());
        if (pos == string::npos) return "";
        pos++; // Skip opening quote
        
        size_t endPos = json.find("\"", pos);
        if (endPos == string::npos) return "";
        
        return json.substr(pos, endPos - pos);
    }
    
public:
    SimpleAuthLogger(const string& logsFile = "auth_logs.json") 
        : authLogsFile(logsFile), dailyLogsDir("daily_auth_logs/") {
        ensureDirectoryExists(dailyLogsDir);
        loadFromJSON();
    }
    
    // Add new authentication event
    bool logAuthEvent(const SimpleAuthEvent& event) {
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
            SimpleAuthEvent event;
            
            // Simple JSON parsing
            event.userId = extractJsonValue(jsonStr, "userId");
            event.email = extractJsonValue(jsonStr, "email");
            event.displayName = extractJsonValue(jsonStr, "displayName");
            event.eventType = extractJsonValue(jsonStr, "eventType");
            event.provider = extractJsonValue(jsonStr, "provider");
            event.timestamp = extractJsonValue(jsonStr, "timestamp");
            event.sessionId = extractJsonValue(jsonStr, "sessionId");
            event.userAgent = extractJsonValue(jsonStr, "userAgent");
            event.platform = extractJsonValue(jsonStr, "platform");
            event.deviceType = extractJsonValue(jsonStr, "deviceType");
            event.browserName = extractJsonValue(jsonStr, "browserName");
            event.currentUrl = extractJsonValue(jsonStr, "currentUrl");
            
            // Add server-side information
            event.ipAddress = "127.0.0.1"; // In real app, get from request
            if (event.timestamp.empty()) {
                event.timestamp = getCurrentTimestamp();
            }
            event.timestampUnix = chrono::duration_cast<chrono::milliseconds>(
                chrono::system_clock::now().time_since_epoch()).count();
            
            string isNewUserStr = extractJsonValue(jsonStr, "isNewUser");
            event.isNewUser = (isNewUserStr == "true");
            
            return logAuthEvent(event);
        } catch (const exception& e) {
            cerr << "❌ Error parsing auth event JSON: " << e.what() << endl;
            return false;
        }
    }
    
    // Save to main JSON file
    void saveToJSON() {
        try {
            ofstream file(authLogsFile);
            file << "{\n";
            file << "  \"metadata\": {\n";
            file << "    \"totalEvents\": " << authEvents.size() << ",\n";
            file << "    \"lastUpdated\": \"" << getCurrentTimestamp() << "\",\n";
            file << "    \"version\": \"1.0.0\"\n";
            file << "  },\n";
            file << "  \"authEvents\": [\n";
            
            for (size_t i = 0; i < authEvents.size(); i++) {
                file << "    " << authEvents[i].toJsonString();
                if (i < authEvents.size() - 1) file << ",";
                file << "\n";
            }
            
            file << "  ]\n";
            file << "}\n";
            file.close();
            
        } catch (const exception& e) {
            cerr << "❌ Error saving auth logs: " << e.what() << endl;
        }
    }
    
    // Save to daily file
    void saveToDailyFile(const SimpleAuthEvent& event) {
        try {
            string dailyFile = dailyLogsDir + "auth_" + getCurrentDate() + ".json";
            
            // Simple daily file handling - append to file
            ofstream dailyFileStream(dailyFile, ios::app);
            if (dailyFileStream.tellp() == 0) {
                // New file, write header
                dailyFileStream << "{\n";
                dailyFileStream << "  \"date\": \"" << getCurrentDate() << "\",\n";
                dailyFileStream << "  \"events\": [\n";
                dailyFileStream << "    " << event.toJsonString() << "\n";
                dailyFileStream << "  ]\n";
                dailyFileStream << "}\n";
            } else {
                // For simplicity, just append the event as a separate JSON object
                dailyFileStream << event.toJsonString() << "\n";
            }
            
            dailyFileStream.close();
            
        } catch (const exception& e) {
            cerr << "❌ Error saving daily auth log: " << e.what() << endl;
        }
    }
    
    // Load from JSON file (simplified)
    void loadFromJSON() {
        try {
            ifstream file(authLogsFile);
            if (!file.good()) {
                cout << "📝 Creating new auth logs file: " << authLogsFile << endl;
                return;
            }
            
            // For simplicity, just count existing events without full parsing
            string line;
            int eventCount = 0;
            while (getline(file, line)) {
                if (line.find("\"userId\":") != string::npos) {
                    eventCount++;
                }
            }
            file.close();
            
            cout << "📂 Found " << eventCount << " auth events in " << authLogsFile << endl;
            
        } catch (const exception& e) {
            cerr << "❌ Error loading auth logs: " << e.what() << endl;
        }
    }
    
    // Get all authentication events
    vector<SimpleAuthEvent> getAllAuthEvents() const {
        return authEvents;
    }
    
    // Get events by type
    vector<SimpleAuthEvent> getEventsByType(const string& eventType) const {
        vector<SimpleAuthEvent> filtered;
        for (const auto& event : authEvents) {
            if (event.eventType == eventType) {
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
    
    // Get recent events (last N events)
    vector<SimpleAuthEvent> getRecentEvents(int limit = 10) const {
        vector<SimpleAuthEvent> recent;
        int start = max(0, (int)authEvents.size() - limit);
        
        for (size_t i = start; i < authEvents.size(); i++) {
            recent.push_back(authEvents[i]);
        }
        
        return recent;
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
};
