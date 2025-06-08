#!/bin/bash

# Configuration
JMETER_HOME="jmeter"
TEST_PLAN="oss_performance_test.jmx"
PYTHON_SCRIPT="resumable_test.py"
RESULTS_DIR="results"
SMALL_FILE_COUNT=100

# Create results directory
mkdir -p "$RESULTS_DIR"

# Generate small test files
echo "Generating small test files..."
for i in $(seq 1 $SMALL_FILE_COUNT); do
  echo "Test file content $i" > "test_file_$i.txt"
done

# Run JMeter test for small file uploads
echo "Running JMeter test for small file uploads..."
"$JMETER_HOME/bin/jmeter" -n -t "$TEST_PLAN" -l "$RESULTS_DIR/small_file_results.jtl"

# Run Python script for large file resumable upload
echo "Running Python script for large file resumable upload..."
python3 "$PYTHON_SCRIPT" > "$RESULTS_DIR/large_file_results.log"

# Generate reports
echo "Generating reports..."
"$JMETER_HOME/bin/jmeter" -g "$RESULTS_DIR/small_file_results.jtl" -o "$RESULTS_DIR/small_file_report"

echo "Performance testing completed. Results are in the '$RESULTS_DIR' directory."