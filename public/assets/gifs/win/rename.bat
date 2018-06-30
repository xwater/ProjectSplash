setlocal EnableDelayedExpansion

set filename=
set Num=1
for /r %%i in (*.gif) do (
    ren "%%i" "%filename%!Num!.gif"
    set /a Num+=1
    if "!Num!"=="4" set /a Num=1
)