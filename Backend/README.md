# CLV Calculator - Simple Version

A **simple** Customer Lifetime Value (CLV) Calculator that demonstrates **DSA algorithms** using **pure C++** and **JSON storage**.

## 🎯 Simple CLV Algorithm

```
CLV = Average Purchase Value × Purchase Frequency × Customer Lifespan
```

## 🚀 DSA Features Demonstrated

- **📊 Structs** - Customer data organization
- **🔄 Vectors** - Dynamic customer storage
- **⚡ Quicksort** - Sorting customers by CLV
- **💾 File I/O** - JSON data persistence
- **🔍 Search** - Finding customers by ID

## 📁 Project Structure

```
Backend/
├── clv_calculator.hpp    # All functionality in one file
├── main.cpp             # Simple entry point
├── customers.json       # Data storage
└── Makefile            # Build system
```

## 🛠️ Quick Start

### Build & Run
```bash
cd Backend
make run
```

### Manual Build
```bash
cd Backend
g++ -std=c++17 main.cpp -o clv-calculator
./clv-calculator
```

## 📋 Usage

The calculator provides a simple interactive menu:

```
🎯 Customer Lifetime Value (CLV) Calculator
📊 Simple Algorithm: CLV = AOV × Frequency × Lifespan
🚀 DSA Features: Vectors, Structs, Quicksort, File I/O

1. Add Customer
2. View All Customers
3. View Top Customers (Quicksort)
4. View Analytics
5. Save to JSON File
6. Load from JSON File
7. Exit
```

## 💡 Example Usage

1. **Add a customer:**
   - Choose option 1
   - Enter customer details
   - CLV is calculated instantly

2. **View top customers:**
   - Choose option 3
   - See customers sorted by CLV using **quicksort**

3. **Save/Load data:**
   - Use options 5/6 to persist data in JSON format

## 🔧 How It Works

### 1. Customer Data Structure
```cpp
struct Customer {
    std::string id, name;
    double averagePurchaseValue, purchaseFrequency, customerLifespan;
    double clv;  // Calculated automatically

    double calculateCLV() {
        return averagePurchaseValue * purchaseFrequency * customerLifespan;
    }
};
```

### 2. Quicksort Algorithm
```cpp
// Sorts customers by CLV (highest first)
void quicksort(std::vector<Customer>& customers, int low, int high);
```

### 3. JSON Storage
- **Save**: Converts customers to JSON format
- **Load**: Parses JSON back to customer objects
- **Auto-save**: Data is saved automatically when you exit

## 🎨 Key Benefits

- ✅ **Simple** - Easy to understand and modify
- ✅ **Educational** - Clear DSA algorithm examples
- ✅ **Portable** - Pure C++ with no dependencies
- ✅ **Persistent** - JSON data storage
- ✅ **Interactive** - User-friendly console interface

## 🔍 Technical Details

- **Language**: C++17
- **Data Structures**: Vectors, Structs
- **Algorithms**: Quicksort for sorting
- **Storage**: JSON file format
- **I/O**: Standard file operations

## 🚀 Learning Outcomes

This simple version helps you understand:
- How CLV calculations work
- Vector usage for dynamic data
- Struct organization for complex data
- Quicksort algorithm implementation
- File I/O operations in C++
- JSON parsing basics

---

**Perfect for learning DSA concepts with a practical, real-world example!** 🎓
