#include "clv_calculator.hpp"
#include <iostream>

using namespace std;

int main() {
    cout << "🎯 Customer Lifetime Value (CLV) Calculator" << endl;
    cout << "📊 Simple Algorithm: CLV = AOV × Frequency × Lifespan" << endl;
    cout << "🚀 DSA Features: Vectors, Structs, Quicksort, File I/O" << endl;
    cout << endl;

    CLVCalculator calculator;

    // Load existing data if available
    calculator.loadFromJSON();

    // Run interactive mode
    calculator.runInteractiveMode();

    // Auto-save on exit
    calculator.saveToJSON();

    return 0;
}
