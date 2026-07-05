# Förbereder api.php inför deploy.
#
# Säkerhetsprincip: repo-versionen av api.php innehåller bara ett
# platshållarlösenord. Det RIKTIGA betalningslösenordet ligger som
# GitHub-secret (PAY_ADMIN_PASSWORD) och injiceras här vid deploy.
#
#  - Om secreten är satt: kopiera api.php till deploy/ och byt ut
#    platshållaren mot det riktiga lösenordet (escapat för PHP-sträng).
#  - Om secreten SAKNAS: ladda inte upp api.php alls, så att serverns
#    befintliga fil (med ert manuellt satta lösenord) inte skrivs över.

import os
import shutil
import sys

PLACEHOLDER = "ÄNDRA-MIG-hemligt-2026"

pw = os.environ.get("PAY_ADMIN_PASSWORD", "")
if not pw:
    print("PAY_ADMIN_PASSWORD är inte satt som secret -> api.php deployas INTE "
          "(serverns befintliga api.php lämnas orörd).")
    sys.exit(0)

shutil.copy("api.php", "deploy/api.php")
src = open("deploy/api.php", encoding="utf-8").read()

if PLACEHOLDER not in src:
    print("FEL: platshållaren hittades inte i api.php — avbryter så att "
          "fel lösenord inte deployas.")
    sys.exit(1)

# Escapa för PHP enkelciterad sträng: \ -> \\ och ' -> \'
esc = pw.replace("\\", "\\\\").replace("'", "\\'")
open("deploy/api.php", "w", encoding="utf-8").write(src.replace(PLACEHOLDER, esc))
print("api.php förberedd: riktigt lösenord injicerat från secret.")
