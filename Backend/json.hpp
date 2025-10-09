// Simplified JSON header for basic JSON operations
// This is a minimal implementation for the auth logging system

#pragma once
#include <string>
#include <map>
#include <vector>
#include <sstream>
#include <iostream>
#include <variant>

namespace nlohmann {
    class json {
    private:
        std::map<std::string, std::string> stringData;
        std::vector<json> arrayData;
        bool isArray = false;
        
    public:
        json() {}
        
        json(std::initializer_list<std::pair<const char*, const char*>> init) {
            for (const auto& pair : init) {
                stringData[pair.first] = pair.second;
            }
        }
        
        json(std::initializer_list<std::pair<std::string, std::string>> init) {
            for (const auto& pair : init) {
                stringData[pair.first] = pair.second;
            }
        }
        
        // Array operations
        static json array() {
            json j;
            j.isArray = true;
            return j;
        }
        
        void push_back(const json& item) {
            if (isArray) {
                arrayData.push_back(item);
            }
        }
        
        size_t size() const {
            return isArray ? arrayData.size() : stringData.size();
        }
        
        // Access operators
        std::string& operator[](const std::string& key) {
            return stringData[key];
        }
        
        const std::string& operator[](const std::string& key) const {
            static std::string empty = "";
            auto it = stringData.find(key);
            return it != stringData.end() ? it->second : empty;
        }
        
        // Assignment operator for initializer list
        json& operator=(std::initializer_list<std::pair<const char*, const char*>> init) {
            stringData.clear();
            for (const auto& pair : init) {
                stringData[pair.first] = pair.second;
            }
            return *this;
        }
        
        // Value access with default
        template<typename T>
        T value(const std::string& key, const T& defaultValue) const {
            auto it = stringData.find(key);
            if (it != stringData.end()) {
                if constexpr (std::is_same_v<T, std::string>) {
                    return it->second;
                } else if constexpr (std::is_same_v<T, int>) {
                    try { return std::stoi(it->second); } catch (...) { return defaultValue; }
                } else if constexpr (std::is_same_v<T, long long>) {
                    try { return std::stoll(it->second); } catch (...) { return defaultValue; }
                } else if constexpr (std::is_same_v<T, bool>) {
                    return it->second == "true";
                }
            }
            return defaultValue;
        }
        
        // Check if key exists
        bool contains(const std::string& key) const {
            return stringData.find(key) != stringData.end();
        }
        
        // Dump to string
        std::string dump(int indent = 0) const {
            std::stringstream ss;
            
            if (isArray) {
                ss << "[";
                for (size_t i = 0; i < arrayData.size(); i++) {
                    if (i > 0) ss << ",";
                    if (indent > 0) ss << "\n" << std::string(indent, ' ');
                    ss << arrayData[i].dump(indent);
                }
                if (indent > 0 && !arrayData.empty()) ss << "\n";
                ss << "]";
            } else {
                ss << "{";
                bool first = true;
                for (const auto& pair : stringData) {
                    if (!first) ss << ",";
                    if (indent > 0) ss << "\n" << std::string(indent, ' ');
                    ss << "\"" << pair.first << "\": \"" << pair.second << "\"";
                    first = false;
                }
                if (indent > 0 && !stringData.empty()) ss << "\n";
                ss << "}";
            }
            
            return ss.str();
        }
        
        // Parse from string (simplified)
        static json parse(const std::string& str) {
            json result;
            // Very basic JSON parsing - in real implementation use proper parser
            // This is just for demo purposes
            return result;
        }
        
        // Stream operator for reading
        friend std::istream& operator>>(std::istream& is, json& j) {
            // Simple implementation - just read everything as string
            std::string content((std::istreambuf_iterator<char>(is)), std::istreambuf_iterator<char>());
            j = parse(content);
            return is;
        }
    };
}
