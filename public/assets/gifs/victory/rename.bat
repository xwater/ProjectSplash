setlocal EnableDelayedExpansion

set filename=
set Num=1
for /r %%i in (*.mp4) do (
    ren "%%i" "%filename%!Num!.mp4"
)