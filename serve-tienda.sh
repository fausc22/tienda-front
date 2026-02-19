#!/bin/bash
# Script para servir la tienda con el basePath correcto
cd "$(dirname "$0")"
npx serve out -p 3000 -s
