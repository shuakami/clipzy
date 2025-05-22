cmake_minimum_required(VERSION 3.10)
project(sysinfo LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(sysinfo main.cpp)

if(MSVC)
  set_target_properties(sysinfo PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
  )
  target_compile_options(sysinfo PRIVATE /O2 /MT /DNDEBUG)
  target_link_options(sysinfo PRIVATE /INCREMENTAL:NO /OPT:REF /OPT:ICF)
endif() 