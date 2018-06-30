setlocal EnableDelayedExpansion

set filename=
set Num=1
set lastDir=
for /r %%i in (*.png) do (
    if %cd%  NEQ "!lastDir!" set /a Num=1

    if %cd%  NEQ "!lastDir!" set /a lastDir=%cd%

    ren "%%i" "%filename%!Num!.png"

    set /a Num+=1
    if "!Num!"=="9" set /a Num=1
)