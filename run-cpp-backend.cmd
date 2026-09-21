@echo off
setlocal
set "ROOT=%~dp0"
set "PATH=C:\msys64\ucrt64\bin;%PATH%"
if not exist "%ROOT%build" mkdir "%ROOT%build"
echo Compilare backend C++ OpenCV...
g++ -std=c++17 "%ROOT%cpp\web_backend.cpp" -o "%ROOT%build\purcarorz_backend.exe" -I"C:\msys64\ucrt64\include\opencv5" -L"C:\msys64\ucrt64\lib" -lws2_32 -lopencv_dnn -lopencv_highgui -lopencv_videoio -lopencv_imgcodecs -lopencv_imgproc -lopencv_core
if errorlevel 1 goto :error
echo Pornesc backendul C++ pe portul 8080...
start "PURCAR ORZ C++ Backend" /D "%ROOT%" "%ROOT%build\purcarorz_backend.exe"
echo Gata. Acum ruleaza npm run dev si deschide site-ul.
exit /b 0
:error
echo Compilarea a esuat. Verifica daca OpenCV este instalat in C:\msys64\ucrt64.
exit /b 1
