setlocal EnableDelayedExpansion

set filename=
set Num=1
set currentDir=""
set lastDir=""
for /r %%i in (*.gif) do (
    set /a currentDir= %cd%
    if "currenetDir"!="lastDir" set /a Num=1

    ren "%%i" "%filename%!Num!.gif"
    set /a Num+=1
    if "!Num!"=="9" set /a Num=1

)