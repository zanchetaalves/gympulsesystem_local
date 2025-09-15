@echo off
:: Script de debug passo a passo para Gym Pulse
title Gym Pulse - Debug Passo a Passo
color 0E

pm2 start ecosystem.config.cjs

pm2 save

goto final_exit

:final_exit
echo Pressione ENTER para fechar...
pause
exit


