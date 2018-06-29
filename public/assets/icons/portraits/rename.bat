setlocal EnableDelayedExpansion

set filename=
set Num=1
for /r %%i in (*.png) do (
    ren "%%i" "%filename%!Num!.png"
    set /a Num+=1
    if "!Num!"=="9" set /a Num=1
)