CXX = g++
CXXFLAGS = -std=c++14 -O3 -Wall -Wextra -Iinclude

all: bin/pathwise_cli bin/pathwise_tests

bin/pathwise_cli: src/main.cpp
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) src/main.cpp -o bin/pathwise_cli

bin/pathwise_tests: tests/test_algorithms.cpp
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) tests/test_algorithms.cpp -o bin/pathwise_tests

test: bin/pathwise_tests
	./bin/pathwise_tests

run: bin/pathwise_cli
	./bin/pathwise_cli

clean:
	rm -rf bin *.exe *.csv
