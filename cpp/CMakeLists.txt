cmake_minimum_required(VERSION 3.10)
project(PathWise_CPP VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# CLI Application
add_executable(pathwise_cli src/main.cpp)

# Test Suite
add_executable(pathwise_tests tests/test_algorithms.cpp)

enable_testing()
add_test(NAME AlgorithmVerificationTests COMMAND pathwise_tests)
