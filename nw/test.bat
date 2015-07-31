cd ..\www\
copy ..\nw\config\package.json package.json
..\nw\zip\zip.exe -r app.zip  *
del package.json
mkdir ..\nw\tmp
move app.zip ..\nw\tmp\app.nw
cd ..\nw\


start bin32\nw.exe tmp\app.nw
exit
