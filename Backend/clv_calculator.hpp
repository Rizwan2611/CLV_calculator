#ifndef CLV_CALCULATOR_HPP
#define CLV_CALCULATOR_HPP

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <ctime>

using namespace std;

// Customer struct - simple data structure
struct Customer {
    string id;
    string name;
    double averagePurchaseValue;  // Average Order Value (AOV)
    double purchaseFrequency;     // Purchases per year
    double customerLifespan;      // Customer lifespan in years
    double clv;                   // Calculated CLV

    // Constructor
    Customer(string customerId, string customerName,
             double aov, double freq, double lifespan)
        : id(customerId), name(customerName),
          averagePurchaseValue(aov), purchaseFrequency(freq),
          customerLifespan(lifespan) {

        // Calculate CLV using the simple formula
        clv = calculateCLV();
    }

    // Calculate Customer Lifetime Value (Simple Algorithm)
    double calculateCLV() {
        return averagePurchaseValue * purchaseFrequency * customerLifespan;
    }

    // Display customer information
    void display() const {
        cout << "Customer: " << name << " (ID: " << id << ")" << endl;
        cout << "  Average Purchase Value: ₹" << averagePurchaseValue << endl;
        cout << "  Purchase Frequency: " << purchaseFrequency << " times/year" << endl;
        cout << "  Customer Lifespan: " << customerLifespan << " years" << endl;
        cout << "  Customer Lifetime Value (CLV): ₹" << clv << endl;
        cout << endl;
    }
};

// CLV Calculator class - demonstrates DSA algorithms
class CLVCalculator {
private:
    vector<Customer> customers;

    // Quicksort partition function (DSA Algorithm)
    int partition(vector<Customer>& arr, int low, int high) {
        double pivot = arr[high].clv;
        int i = low - 1;

        for (int j = low; j < high; j++) {
            if (arr[j].clv > pivot) {  // Sort by CLV descending (highest first)
                i++;
                swap(arr[i], arr[j]);
            }
        }
        swap(arr[i + 1], arr[high]);
        return i + 1;
    }

    // Quicksort implementation (DSA Algorithm)
    void quicksort(vector<Customer>& arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quicksort(arr, low, pi - 1);
            quicksort(arr, pi + 1, high);
        }
    }

    // Simple JSON helper functions
    string escapeString(const string& str) {
        string escaped;
        for (char c : str) {
            if (c == '"' || c == '\\') {
                escaped += '\\';
            }
            escaped += c;
        }
        return escaped;
    }

    string getCurrentTimestamp() {
        time_t now = time(0);
        char buf[80];
        strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", localtime(&now));
        return string(buf);
    }

public:
    // Add a new customer and calculate CLV immediately
    void addCustomer(const string& id, const string& name,
                     double avgPurchaseValue, double purchaseFrequency, double lifespan) {

        // Check for duplicate ID
        for (const auto& customer : customers) {
            if (customer.id == id) {
                cout << "❌ Error: Customer ID '" << id << "' already exists!" << endl;
                return;
            }
        }

        // Validate inputs
        if (avgPurchaseValue <= 0 || purchaseFrequency <= 0 || lifespan <= 0) {
            cout << "❌ Error: All values must be positive!" << endl;
            return;
        }

        // Create new customer (CLV calculated in constructor)
        Customer newCustomer(id, name, avgPurchaseValue, purchaseFrequency, lifespan);
        customers.push_back(newCustomer);

        cout << "✅ Added customer: " << name << endl;
        cout << "💰 CLV: ₹" << newCustomer.clv << endl;
        cout << endl;
    }

    // Display all customers
    void displayAllCustomers() {
        if (customers.empty()) {
            cout << "📭 No customers found." << endl;
            return;
        }

        cout << "=== All Customers ===" << endl;
        cout << "Total customers: " << customers.size() << endl;
        cout << endl;

        for (const auto& customer : customers) {
            customer.display();
        }
    }

    // Sort and display top customers by CLV (DSA: Quicksort)
    void displayTopCustomers(int n = 5) {
        if (customers.empty()) {
            cout << "📭 No customers found." << endl;
            return;
        }

        // Create a copy for sorting (DSA: Vector copy)
        vector<Customer> sortedCustomers = customers;

        // Sort using quicksort (DSA Algorithm)
        quicksort(sortedCustomers, 0, sortedCustomers.size() - 1);

        // Limit to requested number
        int displayCount = min(n, (int)sortedCustomers.size());

        cout << "=== Top " << displayCount << " Customers by CLV ===" << endl;
        for (int i = 0; i < displayCount; i++) {
            cout << (i + 1) << ". " << sortedCustomers[i].name
                      << " - CLV: ₹" << sortedCustomers[i].clv << endl;
        }
        cout << endl;
    }

    // Calculate and display analytics
    void displayAnalytics() {
        if (customers.empty()) {
            cout << "📊 No customers for analytics." << endl;
            return;
        }

        cout << "=== CLV Analytics ===" << endl;
        cout << "Total Customers: " << customers.size() << endl;

        // Calculate average CLV (DSA: Loop through vector)
        double totalCLV = 0;
        double highestCLV = 0;
        double lowestCLV = customers[0].clv;

        for (const auto& customer : customers) {
            totalCLV += customer.clv;
            if (customer.clv > highestCLV) highestCLV = customer.clv;
            if (customer.clv < lowestCLV) lowestCLV = customer.clv;
        }

        double averageCLV = totalCLV / customers.size();

        cout << "Average CLV: ₹" << averageCLV << endl;
        cout << "Highest CLV: ₹" << highestCLV << endl;
        cout << "Lowest CLV: ₹" << lowestCLV << endl;
        cout << "Total CLV: ₹" << totalCLV << endl;
        cout << endl;
    }

    // Save customers to JSON file (DSA: File I/O)
    void saveToJSON(const string& filename = "customers.json") {
        ofstream file(filename);
        if (!file.is_open()) {
            cout << "❌ Error: Could not open file for writing!" << endl;
            return;
        }

        file << "{\n";
        file << "  \"customers\": [\n";

        for (size_t i = 0; i < customers.size(); i++) {
            const auto& customer = customers[i];
            file << "    {\n";
            file << "      \"id\": \"" << escapeString(customer.id) << "\",\n";
            file << "      \"name\": \"" << escapeString(customer.name) << "\",\n";
            file << "      \"averagePurchaseValue\": " << customer.averagePurchaseValue << ",\n";
            file << "      \"purchaseFrequency\": " << customer.purchaseFrequency << ",\n";
            file << "      \"customerLifespan\": " << customer.customerLifespan << ",\n";
            file << "      \"clv\": " << customer.clv << "\n";
            file << "    }";
            if (i < customers.size() - 1) {
                file << ",";
            }
            file << "\n";
        }

        file << "  ],\n";
        file << "  \"totalCustomers\": " << customers.size() << ",\n";
        file << "  \"averageCLV\": " << (customers.empty() ? 0 : customers[0].calculateCLV()) << ",\n";
        file << "  \"timestamp\": \"" << getCurrentTimestamp() << "\"\n";
        file << "}\n";

        file.close();
        cout << "💾 Saved " << customers.size() << " customers to " << filename << endl;
    }

    // Load customers from JSON file (DSA: File I/O)
    void loadFromJSON(const string& filename = "customers.json") {
        // Clear existing customers before loading to prevent duplicates
        customers.clear();
        ifstream file(filename);
        if (!file.is_open()) {
            cout << "⚠️  Could not open " << filename << " - starting fresh!" << endl;
            return;
        }

        string content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
        file.close();

        // Simple JSON parsing (basic implementation)
        size_t pos = 0;
        while ((pos = content.find("\"id\":", pos)) != string::npos) {
            // Extract customer data from JSON (simplified parsing)
            string id, name;
            double aov = 0, freq = 0, lifespan = 0;

            // Extract ID
            size_t idStart = content.find("\"", pos + 6);
            size_t idEnd = content.find("\"", idStart + 1);
            if (idStart != string::npos && idEnd != string::npos) {
                id = content.substr(idStart + 1, idEnd - idStart - 1);
            }

            // Extract name
            pos = content.find("\"name\":", pos);
            size_t nameStart = content.find("\"", pos + 8);
            size_t nameEnd = content.find("\"", nameStart + 1);
            if (nameStart != string::npos && nameEnd != string::npos) {
                name = content.substr(nameStart + 1, nameEnd - nameStart - 1);
            }

            // Extract AOV
            pos = content.find("\"averagePurchaseValue\":", pos);
            size_t aovStart = pos + 25;
            size_t aovEnd = content.find(",", aovStart);
            if (aovEnd != string::npos) {
                string aovStr = content.substr(aovStart, aovEnd - aovStart);
                try {
                    aov = stod(aovStr);
                } catch (...) {}
            }

            // Extract frequency
            pos = content.find("\"purchaseFrequency\":", pos);
            size_t freqStart = pos + 22;
            size_t freqEnd = content.find(",", freqStart);
            if (freqEnd != string::npos) {
                string freqStr = content.substr(freqStart, freqEnd - freqStart);
                try {
                    freq = stod(freqStr);
                } catch (...) {}
            }

            // Extract lifespan
            pos = content.find("\"customerLifespan\":", pos);
            size_t lifeStart = pos + 20;
            size_t lifeEnd = content.find(",", lifeStart);
            if (lifeEnd != string::npos) {
                string lifeStr = content.substr(lifeStart, lifeEnd - lifeStart);
                try {
                    lifespan = stod(lifeStr);
                } catch (...) {}
            }

            // Add customer if we have valid data
            if (!id.empty() && !name.empty() && aov > 0 && freq > 0 && lifespan > 0) {
                customers.emplace_back(id, name, aov, freq, lifespan);
            }

            pos++;
        }

        cout << "📂 Loaded " << customers.size() << " customers from " << filename << endl;
    }

    // Get customer count
    size_t getCustomerCount() const {
        return customers.size();
    }

    // Interactive menu
    void runInteractiveMode() {
        string choice;

        while (true) {
            cout << "=== CLV Calculator (Simple Algorithm) ===" << endl;
            cout << "📊 CLV = Average Purchase Value × Purchase Frequency × Customer Lifespan" << endl;
            cout << endl;
            cout << "1. Add Customer" << endl;
            cout << "2. View All Customers" << endl;
            cout << "3. View Top Customers (Quicksort)" << endl;
            cout << "4. View Analytics" << endl;
            cout << "5. Save to JSON File" << endl;
            cout << "6. Load from JSON File" << endl;
            cout << "7. Exit" << endl;
            cout << "Choose (1-7): ";

            getline(cin, choice);

            if (choice == "1") {
                addCustomerInteractive();
            } else if (choice == "2") {
                displayAllCustomers();
            } else if (choice == "3") {
                cout << "How many top customers? ";
                string nStr;
                getline(cin, nStr);
                try {
                    int n = stoi(nStr);
                    displayTopCustomers(n);
                } catch (...) {
                    cout << "❌ Invalid number!" << endl;
                }
            } else if (choice == "4") {
                displayAnalytics();
            } else if (choice == "5") {
                saveToJSON();
            } else if (choice == "6") {
                loadFromJSON();
            } else if (choice == "7") {
                cout << "👋 Goodbye!" << endl;
                break;
            } else {
                cout << "❌ Invalid choice!" << endl;
            }
            cout << endl;
        }
    }

private:
    // Interactive customer input
    void addCustomerInteractive() {
        string id, name, input;

        cout << "=== Add New Customer ===" << endl;

        cout << "Customer ID: ";
        getline(cin, id);

        cout << "Customer Name: ";
        getline(cin, name);

        double aov, freq, lifespan;

        // Get Average Purchase Value
        while (true) {
            cout << "Average Purchase Value (₹): ";
            getline(cin, input);
            try {
                aov = stod(input);
                if (aov > 0) break;
                cout << "❌ Enter a positive value!" << endl;
            } catch (...) {
                cout << "❌ Invalid number!" << endl;
            }
        }

        // Get Purchase Frequency
        while (true) {
            cout << "Purchase Frequency (per year): ";
            getline(cin, input);
            try {
                freq = stod(input);
                if (freq > 0) break;
                cout << "❌ Enter a positive value!" << endl;
            } catch (...) {
                cout << "❌ Invalid number!" << endl;
            }
        }

        // Get Customer Lifespan
        while (true) {
            cout << "Customer Lifespan (years): ";
            getline(cin, input);
            try {
                lifespan = stod(input);
                if (lifespan > 0) break;
                cout << "❌ Enter a positive value!" << endl;
            } catch (...) {
                cout << "❌ Invalid number!" << endl;
            }
        }

        addCustomer(id, name, aov, freq, lifespan);
    }
};

#endif // CLV_CALCULATOR_HPP
