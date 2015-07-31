cd ..\www\
copy ..\nw\config\package.json package.json
..\nw\zip\zip.exe -r app.zip  *
del package.json
mkdir ..\nw\tmp
move app.zip ..\nw\bin32\app.nw
cd ..\nw\


cd bin32\
copy /b nw.exe+app.nw app.exe
del app.nw
mkdir ..\tmp\app32
move app.exe ..\tmp\app32\nw.exe
copy icudtl.dat ..\tmp\app32
copy libEGL.dll ..\tmp\app32
copy libGLESv2.dll ..\tmp\app32
copy ffmpegsumo.dll ..\tmp\app32
copy nw.pak ..\tmp\app32
cd ..\tmp\app32
REM npm install -g enigmavirtualbox
cmd /c "enigmavirtualbox gen app.evp app.exe nw.exe nw.pak icudtl.dat ffmpegsumo.dll libEGL.dll libGLESv2.dll"
cmd /c "enigmavirtualbox cli app.evp"
move app.exe ..\app32.exe
cd ..\..\

start tmp\app32.exe

